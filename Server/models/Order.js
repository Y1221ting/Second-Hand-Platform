const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  buyer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  // 交易快照：防止商品被删除或修改后订单信息丢失
  productSnapshot: {
    name: { type: String, required: true },
    price: { type: Number, required: true },
    image: { type: String, default: "" },
  },
  quantity: {
    type: Number,
    default: 1,
    min: 1,
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0,
  },
  status: {
    type: String,
    enum: ["pending", "completed", "cancelled"],
    default: "pending",
  },
  buyerInfo: {
    name: String,
    phone: String,
    dormitory: String,
    department: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// 索引：买家查自己订单、卖家查售出订单、按时间排序
orderSchema.index({ buyer: 1, createdAt: -1 });
orderSchema.index({ seller: 1, createdAt: -1 });
orderSchema.index({ product: 1 });

module.exports = mongoose.model("Order", orderSchema);
