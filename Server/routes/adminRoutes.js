const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const User = require("../models/User");
const Product = require("../models/Product");
const Report = require("../models/Report");
const Appeal = require("../models/Appeal");
const Warning = require("../models/Warning");

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

    const [userCount, productCount, todayUsers, todayProducts, pendingReports, pendingAppeals] =
      await Promise.all([
        User.countDocuments(),
        Product.countDocuments({ status: { $nin: ["sold_out", "inactive"] } }),
        User.countDocuments({ createdAt: { $gte: today } }),
        Product.countDocuments({ createdAt: { $gte: today } }),
        Report.countDocuments({ status: "pending" }),
        Appeal.countDocuments({ status: "pending" }),
      ]);

    res.json({
      userCount,
      productCount,
      todayUsers,
      todayProducts,
      pendingReports,
      pendingAppeals,
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
    const limit = parseInt(req.query.limit) || 20;
    const status = req.query.status || "";

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
        await Warning.create({
          userId: product.uploadedBy.id,
          title: `商品"${product.name}"因被举报已下架`,
          content: reason,
          type: "product_delisted",
          severity: "critical",
          metadata: { productId: product._id.toString(), reason },
          createdBy: req.user._id.toString(),
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
    const limit = parseInt(req.query.limit) || 20;
    const search = req.query.search || "";
    const status = req.query.status || "";

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

    // 自动创建通知给卖家
    if (existing.uploadedBy?.id) {
      await Warning.create({
        userId: existing.uploadedBy.id,
        title: status === "inactive" ? `商品"${existing.name}"已被管理员下架` : `商品"${existing.name}"已恢复上架`,
        content: status === "inactive"
          ? `下架原因：${update.delistReason || "违反平台规定"}`
          : "您的商品已恢复上架，可以正常浏览和购买。",
        type: "product_delisted",
        severity: status === "inactive" ? "critical" : "info",
        metadata: { productId: existing._id.toString(), reason: update.delistReason || "" },
        createdBy: req.user._id.toString(),
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
    const limit = parseInt(req.query.limit) || 20;
    const search = req.query.search || "";
    const role = req.query.role || "";
    const status = req.query.status || "";

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
    const { status } = req.body; // "active" | "banned"
    if (!["active", "banned"].includes(status)) {
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

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );

    // 返回前去除密码
    const data = user.toObject();
    delete data.password;

    // 自动创建通知
    await Warning.create({
      userId: targetUser._id,
      title: status === "banned" ? "您的账号已被封禁" : "您的账号已解封",
      content: status === "banned"
        ? "如有疑问，请通过申诉渠道联系管理员。"
        : "感谢您的理解，请继续遵守平台规则。",
      type: "account_banned",
      severity: status === "banned" ? "critical" : "info",
      createdBy: req.user._id.toString(),
    });

    res.json({ message: status === "banned" ? "已封禁" : "已解封", user: data });
  } catch (error) {
    console.error("封禁用户失败:", error);
    res.status(500).json({ message: "操作失败" });
  }
});

// ========== 申诉管理 ==========

// 获取申诉列表
router.get("/appeals", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const status = req.query.status || "";

    const query = {};
    if (status) query.status = status;

    const [appeals, total] = await Promise.all([
      Appeal.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate("productId", "name images price status delistReason"),
      Appeal.countDocuments(query),
    ]);

    res.json({ appeals, total, page, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    console.error("获取申诉列表失败:", error);
    res.status(500).json({ message: "获取申诉列表失败" });
  }
});

// 处理申诉 — 通过（恢复商品）/ 驳回
router.put("/appeals/:id", async (req, res) => {
  try {
    const { action, note } = req.body; // action: "approve" | "reject"

    if (!["approve", "reject"].includes(action)) {
      return res.status(400).json({ message: "action 必须为 approve 或 reject" });
    }

    const appeal = await Appeal.findById(req.params.id);
    if (!appeal) {
      return res.status(404).json({ message: "申诉不存在" });
    }
    if (appeal.status !== "pending") {
      return res.status(400).json({ message: "该申诉已处理" });
    }

    // 更新申诉状态
    appeal.status = action === "approve" ? "approved" : "rejected";
    appeal.handledBy = req.user._id.toString();
    appeal.handleNote = note || "";
    await appeal.save();

    // 通过：恢复商品 + 清除下架原因
    if (action === "approve") {
      await Product.findByIdAndUpdate(
        appeal.productId,
        { status: "unsold", delistReason: "" },
        { runValidators: true }
      );
    }

    // 驳回：更新商品下架原因，让卖家看到驳回理由
    if (action === "reject") {
      const rejectReason = note
        ? `申诉被驳回：${note.trim()}`
        : "申诉被驳回";
      await Product.findByIdAndUpdate(
        appeal.productId,
        { delistReason: rejectReason },
        { runValidators: true }
      );
    }

    // 自动创建通知给申诉人
    const appealedProduct = await Product.findById(appeal.productId);
    const productName = appealedProduct ? appealedProduct.name : "未知商品";
    await Warning.create({
      userId: appeal.sellerId,
      title: action === "approve"
        ? `申诉已通过 — 商品"${productName}"已恢复`
        : `申诉已驳回 — 商品"${productName}"`,
      content: action === "approve"
        ? "您的申诉已通过审核，商品已恢复上架。"
        : `驳回理由：${note || "经审核，您的申诉不符合恢复条件"}`,
      type: "appeal_result",
      severity: "info",
      metadata: { productId: appeal.productId.toString(), appealStatus: action === "approve" ? "approved" : "rejected" },
      createdBy: req.user._id.toString(),
    });

    res.json({
      message: action === "approve" ? "申诉已通过，商品已恢复" : "申诉已驳回",
      appeal,
    });
  } catch (error) {
    console.error("处理申诉失败:", error);
    res.status(500).json({ message: "处理申诉失败" });
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

    const warning = new Warning({
      userId,
      title: title.trim(),
      content: content.trim(),
      type: "warning",
      severity: "critical",
      createdBy: req.user._id.toString(),
    });
    await warning.save();

    res.status(201).json({ message: "警告已发送", warning });
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
    const limit = parseInt(req.query.limit) || 20;
    const status = req.query.status || ""; // all | unread | read

    const query = {};
    if (status === "unread") query.isRead = false;
    else if (status === "read") query.isRead = true;

    const [warnings, total] = await Promise.all([
      Warning.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate("userId", "fullName email department"),
      Warning.countDocuments(query),
    ]);

    res.json({ warnings, total, page, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    console.error("获取警告列表失败:", error);
    res.status(500).json({ message: "获取警告列表失败" });
  }
});

module.exports = router;
