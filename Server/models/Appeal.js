const mongoose = require("mongoose");

const appealSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  sellerId: {
    type: String,
    required: true,
  },
  reason: {
    type: String,
    required: [true, "申诉理由不能为空"],
    trim: true,
  },
  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending",
  },
  handledBy: {
    type: String,
  },
  handleNote: {
    type: String,
    trim: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

appealSchema.index({ sellerId: 1, createdAt: -1 });           // 用户申诉列表
appealSchema.index({ status: 1, createdAt: -1 });              // 管理员申诉列表
appealSchema.index({ productId: 1, sellerId: 1, status: 1 }); // 查重

module.exports = mongoose.model("Appeal", appealSchema);
