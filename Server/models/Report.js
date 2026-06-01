const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  reporterId: {
    type: String,
    required: true,
  },
  reason: {
    type: String,
    enum: ["信息不实", "违禁品", "重复发布", "人身攻击/骚扰", "其他"],
    default: "其他",
  },
  detail: {
    type: String,
    trim: true,
  },
  status: {
    type: String,
    enum: ["pending", "handled", "dismissed"],
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

reportSchema.index({ status: 1, createdAt: -1 }); // 管理员举报列表

module.exports = mongoose.model("Report", reportSchema);
