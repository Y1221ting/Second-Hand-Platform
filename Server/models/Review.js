const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  reviewerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  revieweeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  rating: {
    type: Number,
    required: [true, "评分不能为空"],
    min: 1,
    max: 5,
  },
  content: {
    type: String,
    trim: true,
    default: "",
  },
  type: {
    type: String,
    enum: ["buyer_to_seller", "seller_to_buyer"],
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// 一个订单只能评价一次（同一评价人+同一订单）
reviewSchema.index({ reviewerId: 1, orderId: 1 }, { unique: true });
// 查询某用户收到的评价
reviewSchema.index({ revieweeId: 1, createdAt: -1 });
// 查询某商品的评价
reviewSchema.index({ productId: 1, createdAt: -1 });

module.exports = mongoose.model("Review", reviewSchema);
