const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const User = require("../models/User");
const Product = require("../models/Product");
const Report = require("../models/Report");
const Message = require("../models/Message");

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

    const [userCount, productCount, todayUsers, todayProducts, pendingReports, pendingUsers] =
      await Promise.all([
        User.countDocuments(),
        Product.countDocuments({ status: { $nin: ["sold_out", "inactive"] } }),
        User.countDocuments({ createdAt: { $gte: today } }),
        Product.countDocuments({ createdAt: { $gte: today } }),
        Report.countDocuments({ status: "pending" }),
        User.countDocuments({ status: "inactive" }),
      ]);

    res.json({
      userCount,
      productCount,
      todayUsers,
      todayProducts,
      pendingReports,
      pendingUsers,
    });
  } catch (error) {
    console.error("stats error:", error);
    res.status(500).json({ message: "获取统计数据失败" });
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
    console.log(`[AUDIT] admin=${req.user._id} action=handle_report reportId=${report._id} result=${report.status} note="${note || ""}"`);

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
    console.log(`[AUDIT] admin=${req.user._id} action=${status === "inactive" ? "delist_product" : "restore_product"} productId=${req.params.id} reason="${reason || ""}"`);

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
    console.error("商品管理失败:", error);
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
    console.log(`[AUDIT] admin=${req.user._id} action=set_user_status targetUserId=${req.params.id} newStatus=${status}`);

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
    console.error("封禁用户失败:", error);
    res.status(500).json({ message: "操作失败" });
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
    console.log(`[AUDIT] admin=${req.user._id} action=send_warning targetUserId=${userId} title="${title.trim().substring(0, 50)}"`);

    res.status(201).json({ message: "消息已发送", warning: msg });
  } catch (error) {
    console.error("发送警告失败:", error);
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
    console.error("获取警告列表失败:", error);
    res.status(500).json({ message: "获取警告列表失败" });
  }
});

module.exports = router;
