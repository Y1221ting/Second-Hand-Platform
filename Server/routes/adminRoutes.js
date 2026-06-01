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
      await Product.findByIdAndUpdate(
        report.productId,
        { status: "inactive", delistReason: reason },
        { runValidators: true }
      );
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

    const query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { "uploadedBy.name": { $regex: search, $options: "i" } },
        { "uploadedBy.department": { $regex: search, $options: "i" } },
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
    if (!product) {
      return res.status(404).json({ message: "商品不存在" });
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

    const query = {};
    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { department: { $regex: search, $options: "i" } },
      ];
    }
    if (role) query.role = role;
    if (status) query.status = status;

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

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );
    if (!user) {
      return res.status(404).json({ message: "用户不存在" });
    }

    // 返回前去除密码
    const data = user.toObject();
    delete data.password;

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

    const warning = new Warning({
      userId,
      title: title.trim(),
      content: content.trim(),
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
        .limit(limit),
      Warning.countDocuments(query),
    ]);

    res.json({ warnings, total, page, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    console.error("获取警告列表失败:", error);
    res.status(500).json({ message: "获取警告列表失败" });
  }
});

module.exports = router;
