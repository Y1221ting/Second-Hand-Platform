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

module.exports = mongoose.model("Warning", warningSchema);
