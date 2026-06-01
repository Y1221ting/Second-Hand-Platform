const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const Review = require("../models/Review");

// 创建评价（需认证）
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { orderId, productId, revieweeId, rating, content, type } = req.body;

    if (!orderId || !productId || !revieweeId || !rating || !type) {
      return res.status(400).json({ message: "缺少必填字段" });
    }
    if (!["buyer_to_seller", "seller_to_buyer"].includes(type)) {
      return res.status(400).json({ message: "评价类型无效" });
    }
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: "评分需在 1-5 之间" });
    }

    const review = new Review({
      orderId,
      productId,
      reviewerId: req.user._id,
      revieweeId,
      rating,
      content: content ? content.trim() : "",
      type,
    });
    await review.save();

    res.status(201).json({ message: "评价成功", review });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: "该订单已评价过" });
    }
    console.error("创建评价失败:", error);
    if (error.name === "ValidationError") {
      const msg = Object.values(error.errors).map((e) => e.message).join("；");
      return res.status(400).json({ message: msg });
    }
    if (error.name === "CastError") {
      return res.status(400).json({ message: "无效的ID格式" });
    }
    res.status(500).json({ message: "评价失败" });
  }
});

// 获取用户的评价列表（公开，支持分页）
router.get("/user/:userId", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const type = req.query.type; // buyer_to_seller | seller_to_buyer

    const query = { revieweeId: req.params.userId };
    if (type) query.type = type;

    const [reviews, total] = await Promise.all([
      Review.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate("reviewerId", "fullName department major"),
      Review.countDocuments(query),
    ]);

    res.json({ reviews, total, page, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    console.error("获取评价列表失败:", error);
    res.status(500).json({ message: "获取评价失败" });
  }
});

// 获取用户的评分统计（公开）
router.get("/user/:userId/stats", async (req, res) => {
  try {
    const stats = await Review.aggregate([
      { $match: { revieweeId: require("mongoose").Types.ObjectId(req.params.userId) } },
      {
        $group: {
          _id: null,
          avgRating: { $avg: "$rating" },
          totalReviews: { $sum: 1 },
        },
      },
    ]);

    const distribution = await Review.aggregate([
      { $match: { revieweeId: require("mongoose").Types.ObjectId(req.params.userId) } },
      {
        $group: {
          _id: "$rating",
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: -1 } },
    ]);

    const result = stats[0] || { avgRating: 0, totalReviews: 0 };
    const positiveCount = distribution
      .filter((d) => d._id >= 4)
      .reduce((sum, d) => sum + d.count, 0);

    res.json({
      avgRating: Math.round(result.avgRating * 10) / 10,
      totalReviews: result.totalReviews,
      positiveRate: result.totalReviews > 0
        ? Math.round((positiveCount / result.totalReviews) * 100)
        : 0,
      distribution,
    });
  } catch (error) {
    console.error("获取评分统计失败:", error);
    res.status(500).json({ message: "获取统计失败" });
  }
});

// 获取某商品的评价列表（公开）
router.get("/product/:productId", async (req, res) => {
  try {
    const reviews = await Review.find({ productId: req.params.productId })
      .sort({ createdAt: -1 })
      .populate("reviewerId", "fullName department")
      .limit(50);

    res.json({ reviews });
  } catch (error) {
    console.error("获取商品评价失败:", error);
    res.status(500).json({ message: "获取评价失败" });
  }
});

module.exports = router;
