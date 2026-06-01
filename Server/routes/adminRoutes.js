const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const User = require("../models/User");
const Product = require("../models/Product");
const Report = require("../models/Report");

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

    const [userCount, productCount, todayUsers, todayProducts, pendingReports] =
      await Promise.all([
        User.countDocuments(),
        Product.countDocuments({ status: { $nin: ["sold_out", "inactive"] } }),
        User.countDocuments({ createdAt: { $gte: today } }),
        Product.countDocuments({ createdAt: { $gte: today } }),
        Report.countDocuments({ status: "pending" }),
      ]);

    res.json({
      userCount,
      productCount,
      todayUsers,
      todayProducts,
      pendingReports,
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
    const { status } = req.body; // "inactive" | "unsold"
    if (!["inactive", "unsold"].includes(status)) {
      return res.status(400).json({ message: "状态值无效" });
    }

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );
    if (!product) {
      return res.status(404).json({ message: "商品不存在" });
    }

    res.json({ message: status === "inactive" ? "已下架" : "已恢复", product });
  } catch (error) {
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

module.exports = router;
