const mongoose = require("mongoose");

const conversationSchema = new mongoose.Schema({
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  }],
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
  },
  lastMessage: {
    content: String,
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    createdAt: Date,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

conversationSchema.index({ participants: 1, updatedAt: -1 });
conversationSchema.index({ "lastMessage.createdAt": -1 });

module.exports = mongoose.model("Conversation", conversationSchema);
