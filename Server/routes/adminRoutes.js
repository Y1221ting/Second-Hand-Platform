const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const User = require("../models/User");
const Product = require("../models/Product");
const Report = require("../models/Report");
const Message = require("../models/Message");
const Wanted = require("../models/Wanted");
const logger = require("../config/logger");

// 所有接口：先认证，再检查管理员角色
router.use(authMiddleware);
router.use((req, res, next) => {
  if (req.user.role === "admin") {
    next();
  } else {
    res.status(403).json({ message: "无管理员权限" });
  }
});

// ========== 数据概览 ==========
router.get("/stats", async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [userCount, productCount, todayUsers, todayProducts, pendingReports, pendingUsers, wantedCount, todayWanteds] =
      await Promise.all([
        User.countDocuments(),
        Product.countDocuments({ status: { $nin: ["sold_out", "inactive"] } }),
        User.countDocuments({ createdAt: { $gte: today } }),
        Product.countDocuments({ createdAt: { $gte: today } }),
        Report.countDocuments({ status: "pending" }),
        User.countDocuments({ status: "inactive" }),
        Wanted.countDocuments(),
        Wanted.countDocuments({ createdAt: { $gte: today } }),
      ]);

    res.json({
      userCount,
      productCount,
      todayUsers,
      todayProducts,
      pendingReports,
      pendingUsers,
      wantedCount,
      todayWanteds,
    });
  } catch (error) {
    logger.error("管理员统计失败", { message: error.message, userId: req.user?._id?.toString() });
    res.status(500).json({ message: "获取统计数据失败" });
  }
});

// ========== 趋势数据 ==========
router.get("/stats/trend", async (req, res) => {
  try {
    const days = Math.min(parseInt(req.query.days) || 7, 30);
    const result = [];

    for (let i = days - 1; i >= 0; i--) {
      const start = new Date();
      start.setDate(start.getDate() - i);
      start.setHours(0, 0, 0, 0);

      const end = new Date(start);
      end.setDate(end.getDate() + 1);

      const [newUsers, newProducts, newReports, newWanteds] = await Promise.all([
        User.countDocuments({ createdAt: { $gte: start, $lt: end } }),
        Product.countDocuments({ createdAt: { $gte: start, $lt: end } }),
        Report.countDocuments({ createdAt: { $gte: start, $lt: end } }),
        Wanted.countDocuments({ createdAt: { $gte: start, $lt: end } }),
      ]);

      result.push({
        date: `${start.getMonth() + 1}/${start.getDate()}`,
        newUsers,
        newProducts,
        newReports,
        newWanteds,
      });
    }

    res.json(result);
  } catch (error) {
    logger.error("获取趋势数据失败", { message: error.message, userId: req.user?._id?.toString() });
    res.status(500).json({ message: "获取趋势数据失败" });
  }
});

// ========== 举报管理 ==========

// 获取举报列表（关联商品信息）
router.get("/reports", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const status = typeof req.query.status === "string" ? req.query.status : "";

    const query = {};
    if (status) query.status = status;

    const [reports, total] = await Promise.all([
      Report.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate("productId", "name images status uploadedBy"),
      Report.countDocuments(query),
    ]);

    res.json({ reports, total, page, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ message: "获取举报列表失败" });
  }
});

// 处理举报 — 通过（下架商品）/ 驳回 / 忽略
router.put("/reports/:id", async (req, res) => {
  try {
    const { action, note } = req.body; // action: "handle" | "dismiss"
    const report = await Report.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ message: "举报不存在" });
    }

    // 更新举报状态
    report.status = action === "handle" ? "handled" : "dismissed";
    report.handledBy = req.user._id.toString();
    report.handleNote = note || "";
    await report.save();

    // 审计日志：记录管理员处理举报
    logger.info("管理员处理举报", { admin: req.user._id.toString(), action: "handle_report", reportId: report._id.toString(), result: report.status });

    // 如果是通过，则下架商品并写入原因
    if (action === "handle") {
      const reason = note
        ? `举报原因：${report.reason}；处理备注：${note}`
        : `举报原因：${report.reason}`;
      const product = await Product.findByIdAndUpdate(
        report.productId,
        { status: "inactive", delistReason: reason },
        { runValidators: true }
      );

      // 自动通知卖家
      if (product && product.uploadedBy?.id) {
        await Message.create({
          userId: product.uploadedBy.id,
          title: `商品"${product.name}"因被举报已下架`,
          content: reason,
        });
      }
    }

    res.json({ message: "处理成功", report });
  } catch (error) {
    res.status(500).json({ message: "处理举报失败" });
  }
});

// ========== 求购管理 ==========

// 获取全部求购
router.get("/wanteds", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const search = typeof req.query.search === "string" ? req.query.search : "";

    const query = {};
    if (search) {
      const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      query.$or = [
        { name: { $regex: escaped, $options: "i" } },
        { "postedBy.name": { $regex: escaped, $options: "i" } },
      ];
    }

    const [wanteds, total] = await Promise.all([
      Wanted.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Wanted.countDocuments(query),
    ]);

    // 脱敏：不暴露 phone
    const safe = wanteds.map((w) => {
      const obj = w.toObject();
      if (obj.postedBy) delete obj.postedBy.phone;
      return obj;
    });

    res.json({ wanteds: safe, total, page, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    logger.error("管理员获取求购列表失败", { message: error.message });
    res.status(500).json({ message: "获取求购列表失败" });
  }
});

// 管理员删除求购（不走 postedBy 校验）
router.delete("/wanteds/:id", async (req, res) => {
  try {
    const wanted = await Wanted.findById(req.params.id);
    if (!wanted) {
      return res.status(404).json({ message: "求购不存在" });
    }
    await Wanted.deleteOne({ _id: req.params.id });
    logger.info("管理员删除求购", { admin: req.user._id.toString(), wantedId: req.params.id, name: wanted.name });
    res.json({ message: "删除成功" });
  } catch (error) {
    logger.error("管理员删除求购失败", { message: error.message });
    res.status(500).json({ message: "删除失败" });
  }
});

// ========== 商品管理 ==========

// 获取全部商品（含已下架）
router.get("/products", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const search = typeof req.query.search === "string" ? req.query.search : "";
    const status = typeof req.query.status === "string" ? req.query.status : "";

    const escaped = search ? search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") : "";

    const query = {};
    if (escaped) {
      query.$or = [
        { name: { $regex: escaped, $options: "i" } },
        { "uploadedBy.name": { $regex: escaped, $options: "i" } },
        { "uploadedBy.department": { $regex: escaped, $options: "i" } },
      ];
    }
    if (status) query.status = status;

    const [products, total] = await Promise.all([
      Product.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Product.countDocuments(query),
    ]);

    res.json({ products, total, page, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ message: "获取商品列表失败" });
  }
});

// 下架/恢复商品
router.put("/products/:id", async (req, res) => {
  try {
    const { status, reason } = req.body; // status: "inactive" | "unsold"
    if (!["inactive", "unsold"].includes(status)) {
      return res.status(400).json({ message: "状态值无效" });
    }

    // 先获取商品信息（含卖家ID）
    const existing = await Product.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ message: "商品不存在" });
    }

    const update = { status };
    if (status === "inactive" && reason) {
      update.delistReason = `管理员下架：${reason.trim()}`;
    } else if (status === "unsold") {
      update.delistReason = "";
    }

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      update,
      { new: true, runValidators: true }
    );

    // 审计日志
    logger.info("管理员商品操作", { admin: req.user._id.toString(), action: status === "inactive" ? "delist_product" : "restore_product", productId: req.params.id });

    // 自动创建通知给卖家
    if (existing.uploadedBy?.id) {
      await Message.create({
        userId: existing.uploadedBy.id,
        title: status === "inactive" ? `商品"${existing.name}"已被管理员下架` : `商品"${existing.name}"已恢复上架`,
        content: status === "inactive"
          ? `下架原因：${update.delistReason || "违反平台规定"}`
          : "您的商品已恢复上架，可以正常浏览和购买。",
      });
    }

    res.json({ message: status === "inactive" ? "已下架" : "已恢复", product });
  } catch (error) {
    logger.error("管理员商品操作失败", { message: error.message, userId: req.user?._id?.toString() });
    res.status(500).json({ message: "操作失败" });
  }
});

// ========== 用户管理 ==========

// 获取用户列表
router.get("/users", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const search = typeof req.query.search === "string" ? req.query.search : "";
    const role = typeof req.query.role === "string" ? req.query.role : "";
    const status = typeof req.query.status === "string" ? req.query.status : "";

    const escapedUserSearch = search ? search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") : "";

    const conditions = [];
    if (escapedUserSearch) {
      conditions.push({
        $or: [
          { fullName: { $regex: escapedUserSearch, $options: "i" } },
          { email: { $regex: escapedUserSearch, $options: "i" } },
          { department: { $regex: escapedUserSearch, $options: "i" } },
        ],
      });
    }
    if (role) {
      if (role === "user") {
        // 兼容旧数据：早期用户可能没有 role 字段
        conditions.push({
          $or: [{ role: "user" }, { role: { $exists: false } }],
        });
      } else {
        conditions.push({ role });
      }
    }
    if (status) conditions.push({ status });

    const query = conditions.length > 0 ? { $and: conditions } : {};

    const [users, total] = await Promise.all([
      User.find(query)
        .select("-password")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      User.countDocuments(query),
    ]);

    res.json({ users, total, page, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ message: "获取用户列表失败" });
  }
});

// 封禁/解封用户
router.put("/users/:id", async (req, res) => {
  try {
    const { status } = req.body; // "active" | "banned" | "inactive"
    if (!["active", "banned", "inactive"].includes(status)) {
      return res.status(400).json({ message: "状态值无效" });
    }

    // 互保检查：不能封禁/解封其他管理员
    const targetUser = await User.findById(req.params.id);
    if (!targetUser) {
      return res.status(404).json({ message: "用户不存在" });
    }
    if (targetUser.role === "admin") {
      return res.status(403).json({ message: "不能对其他管理员执行此操作" });
    }

    // 解封时同时重置登录锁定，避免"解封了但还被锁 15 分钟"的情况
    const updatePayload = { status, $inc: { tokenVersion: 1 } };
    if (status === "active") {
      updatePayload.$set = { loginAttempts: 0, lockUntil: null };
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      updatePayload,
      { new: true, runValidators: true }
    );

    // 审计日志
    logger.info("管理员设置用户状态", { admin: req.user._id.toString(), action: "set_user_status", targetUserId: req.params.id, newStatus: status });

    // 返回前去除密码
    const data = user.toObject();
    delete data.password;

    // 自动创建通知
    await Message.create({
      userId: targetUser._id,
      title: status === "banned" ? "您的账号已被封禁" : status === "active" ? "您的账号已通过审核" : "您的账号状态已变更",
      content: status === "banned"
        ? "如有疑问，请联系管理员。"
        : status === "active"
        ? "您现在可以发布商品了，感谢您的耐心等待。"
        : "如有疑问，请联系管理员。",
    });

    res.json({ message: status === "banned" ? "已封禁" : status === "active" ? "已激活" : "已设为待审核", user: data });
  } catch (error) {
    logger.error("管理员封禁用户失败", { message: error.message, userId: req.user?._id?.toString() });
    res.status(500).json({ message: "操作失败" });
  }
});

// ========== 用户详情（聚合）==========
router.get("/users/:id/detail", async (req, res) => {
  try {
    const [user, products, purchased, warnings, wanteds] = await Promise.all([
      User.findById(req.params.id).select("-password"),
      Product.find({ "uploadedBy.id": req.params.id }).sort({ createdAt: -1 }).limit(20),
      Product.find({ "purchasedBy.id": req.params.id }).sort({ createdAt: -1 }).limit(10),
      Message.find({ userId: req.params.id }).sort({ createdAt: -1 }).limit(10),
      Wanted.find({ "postedBy.id": req.params.id }).sort({ createdAt: -1 }).limit(20),
    ]);

    if (!user) {
      return res.status(404).json({ message: "用户不存在" });
    }

    res.json({
      user,
      productCount: products.length,
      products,
      purchasedCount: purchased.length,
      purchased,
      warnings,
      wantedCount: wanteds.length,
      wanteds,
    });
  } catch (error) {
    logger.error("获取用户详情失败", { message: error.message, userId: req.params?.id });
    res.status(500).json({ message: "获取用户详情失败" });
  }
});

// ========== 警告管理 ==========

// 给用户发送警告
router.post("/warnings", async (req, res) => {
  try {
    const { userId, title, content } = req.body;

    if (!userId) {
      return res.status(400).json({ message: "缺少用户ID" });
    }
    if (!title || !title.trim()) {
      return res.status(400).json({ message: "警告标题不能为空" });
    }
    if (!content || !content.trim()) {
      return res.status(400).json({ message: "警告内容不能为空" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "用户不存在" });
    }

    // 互保检查：不能警告其他管理员
    if (user.role === "admin") {
      return res.status(403).json({ message: "不能对其他管理员发送警告" });
    }

    const msg = new Message({
      userId,
      title: title.trim(),
      content: content.trim(),
    });
    await msg.save();

    // 审计日志
    logger.info("管理员发送警告", { admin: req.user._id.toString(), action: "send_warning", targetUserId: userId });

    res.status(201).json({ message: "消息已发送", warning: msg });
  } catch (error) {
    logger.error("管理员发送警告失败", { message: error.message, userId: req.user?._id?.toString() });
    if (error.name === "CastError") {
      return res.status(400).json({ message: "无效的用户ID格式" });
    }
    res.status(500).json({ message: "发送警告失败" });
  }
});

// 查看已发送的警告列表
router.get("/warnings", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const status = typeof req.query.status === "string" ? req.query.status : ""; // all | unread | read

    const query = {};
    if (status === "unread") query.isRead = false;
    else if (status === "read") query.isRead = true;

    const [warnings, total] = await Promise.all([
      Message.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate("userId", "fullName email department"),
      Message.countDocuments(query),
    ]);

    res.json({ warnings, total, page, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    logger.error("管理员获取警告列表失败", { message: error.message, userId: req.user?._id?.toString() });
    res.status(500).json({ message: "获取警告列表失败" });
  }
});

module.exports = router;
