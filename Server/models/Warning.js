const mongoose = require("mongoose");

const warningSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  title: {
    type: String,
    required: [true, "警告标题不能为空"],
    trim: true,
  },
  content: {
    type: String,
    required: [true, "警告内容不能为空"],
    trim: true,
  },
  type: {
    type: String,
    enum: ["warning", "product_delisted", "account_banned", "appeal_result"],
    default: "warning",
  },
  severity: {
    type: String,
    enum: ["info", "critical"],
    default: "info",
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  createdBy: {
    type: String,
    required: true,
  },
  isRead: {
    type: Boolean,
    default: false,
  },
  readAt: {
    type: Date,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

warningSchema.index({ userId: 1, isRead: 1, createdAt: -1 }); // 用户通知列表
warningSchema.index({ createdAt: -1 });                         // 管理员通知列表

module.exports = mongoose.model("Warning", warningSchema);
