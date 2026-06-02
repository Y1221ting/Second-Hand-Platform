const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: [200, "标题不能超过200个字符"],
  },
  content: {
    type: String,
    required: true,
    trim: true,
    maxlength: [5000, "内容不能超过5000个字符"],
  },
  isRead: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

messageSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model("Message", messageSchema);
