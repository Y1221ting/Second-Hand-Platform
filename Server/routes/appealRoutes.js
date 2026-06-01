const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const Appeal = require("../models/Appeal");
const Product = require("../models/Product");

// 卖家提交申诉
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { productId, reason } = req.body;

    if (!productId) {
      return res.status(400).json({ message: "缺少商品ID", code: "MISSING_PRODUCT_ID" });
    }
    if (!reason || !reason.trim()) {
      return res.status(400).json({ message: "申诉理由不能为空", code: "MISSING_REASON" });
    }

    // 1. 查商品，确认是本人的且已下架
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: `商品不存在（ID: ${productId}）`, code: "PRODUCT_NOT_FOUND" });
    }
    if (product.uploadedBy.id !== req.user._id.toString()) {
      return res.status(403).json({
        message: `只能申诉自己的商品（当前用户: ${req.user._id}, 商品所属: ${product.uploadedBy.id}）`,
        code: "NOT_OWNER",
      });
    }
    if (product.status !== "inactive") {
      return res.status(400).json({ message: `该商品当前状态为 ${product.status}，未被下架，无需申诉`, code: "NOT_INACTIVE" });
    }

    // 2. 检查是否已在申诉中（同一商品不能重复申诉）
    const existing = await Appeal.findOne({
      productId,
      sellerId: req.user._id.toString(),
      status: "pending",
    });
    if (existing) {
      return res.status(400).json({ message: "该商品已有在审的申诉，请等待处理", code: "DUPLICATE_APPEAL" });
    }

    // 3. 计算申诉时间窗口（下架后 7 天）
    const lastAppeal = await Appeal.findOne({ productId }).sort({ createdAt: -1 });
    if (lastAppeal) {
      const daysSinceLast = (Date.now() - lastAppeal.createdAt) / (1000 * 60 * 60 * 24);
      if (daysSinceLast > 7 && lastAppeal.status !== "approved") {
        return res.status(400).json({ message: "已超过申诉有效期（7天）", code: "APPEAL_EXPIRED" });
      }
    }

    const newAppeal = new Appeal({
      productId,
      sellerId: req.user._id.toString(),
      reason: reason.trim(),
    });
    await newAppeal.save();

    res.status(201).json({ message: "申诉提交成功", appeal: newAppeal });
  } catch (error) {
    console.error("提交申诉失败:", error.message, error.stack);
    if (error.name === "CastError") {
      return res.status(400).json({ message: `无效的商品ID格式: ${req.body.productId}`, code: "INVALID_ID" });
    }
    res.status(500).json({ message: "服务器内部错误", detail: error.message, code: "SERVER_ERROR" });
  }
});

// 卖家查看自己的申诉记录
router.get("/", authMiddleware, async (req, res) => {
  try {
    const appeals = await Appeal.find({
      sellerId: req.user._id.toString(),
    })
      .sort({ createdAt: -1 })
      .populate("productId", "name images price status delistReason");

    res.json({ appeals });
  } catch (error) {
    console.error("获取申诉列表失败:", error);
    res.status(500).json({ message: "服务器内部错误" });
  }
});

module.exports = router;
