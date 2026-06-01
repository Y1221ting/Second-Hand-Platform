const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const Conversation = require("../models/Conversation");
const Message = require("../models/Message");

// 获取我的会话列表
router.get("/conversations", authMiddleware, async (req, res) => {
  try {
    const conversations = await Conversation.find({
      participants: req.user._id,
    })
      .sort({ updatedAt: -1 })
      .populate("participants", "fullName department")
      .populate("productId", "name images price status");

    // 统计每个会话的未读消息数
    const unreadCounts = await Message.aggregate([
      {
        $match: {
          conversationId: { $in: conversations.map((c) => c._id) },
          senderId: { $ne: req.user._id },
          isRead: false,
        },
      },
      { $group: { _id: "$conversationId", count: { $sum: 1 } } },
    ]);

    const unreadMap = {};
    unreadCounts.forEach((u) => {
      unreadMap[u._id.toString()] = u.count;
    });

    const result = conversations.map((c) => ({
      ...c.toObject(),
      unreadCount: unreadMap[c._id.toString()] || 0,
    }));

    res.json({ conversations: result });
  } catch (error) {
    console.error("获取会话列表失败:", error);
    res.status(500).json({ message: "获取会话列表失败" });
  }
});

// 创建或查找会话
router.post("/conversations", authMiddleware, async (req, res) => {
  try {
    const { participantId, productId } = req.body;

    if (!participantId) {
      return res.status(400).json({ message: "缺少对方用户ID" });
    }
    if (participantId === req.user._id.toString()) {
      return res.status(400).json({ message: "不能和自己聊天" });
    }

    // 查找是否已有两人的会话
    const participants = [req.user._id, participantId].sort();
    let conversation = await Conversation.findOne({
      participants: { $all: participants, $size: 2 },
      ...(productId ? { productId } : {}),
    });

    if (!conversation) {
      conversation = new Conversation({
        participants,
        productId: productId || undefined,
      });
      await conversation.save();
    }

    res.json({ conversation });
  } catch (error) {
    console.error("创建会话失败:", error);
    if (error.name === "CastError") {
      return res.status(400).json({ message: "无效的用户ID格式" });
    }
    res.status(500).json({ message: "创建会话失败" });
  }
});

// 获取某会话的消息列表
router.get("/conversations/:id/messages", authMiddleware, async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.id);
    if (!conversation) {
      return res.status(404).json({ message: "会话不存在" });
    }
    if (!conversation.participants.some((p) => p.toString() === req.user._id.toString())) {
      return res.status(403).json({ message: "无权访问此会话" });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;

    const [messages, total] = await Promise.all([
      Message.find({ conversationId: req.params.id })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate("senderId", "fullName"),
      Message.countDocuments({ conversationId: req.params.id }),
    ]);

    // 标记对方发来的未读消息为已读
    await Message.updateMany(
      {
        conversationId: req.params.id,
        senderId: { $ne: req.user._id },
        isRead: false,
      },
      { isRead: true }
    );

    res.json({
      messages: messages.reverse(), // 按时间正序返回
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("获取消息失败:", error);
    res.status(500).json({ message: "获取消息失败" });
  }
});

// 发送消息
router.post("/messages", authMiddleware, async (req, res) => {
  try {
    const { conversationId, content } = req.body;

    if (!conversationId || !content || !content.trim()) {
      return res.status(400).json({ message: "缺少消息内容" });
    }

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: "会话不存在" });
    }
    if (!conversation.participants.some((p) => p.toString() === req.user._id.toString())) {
      return res.status(403).json({ message: "无权发送消息" });
    }

    const message = new Message({
      conversationId,
      senderId: req.user._id,
      content: content.trim(),
    });
    await message.save();

    // 更新会话的最后消息和时间
    conversation.lastMessage = {
      content: content.trim(),
      senderId: req.user._id,
      createdAt: message.createdAt,
    };
    conversation.updatedAt = message.createdAt;
    await conversation.save();

    const populated = await message.populate("senderId", "fullName");

    res.status(201).json({ message: "发送成功", data: populated });
  } catch (error) {
    console.error("发送消息失败:", error);
    res.status(500).json({ message: "发送消息失败" });
  }
});

// 获取总未读消息数
router.get("/conversations/unread-count", authMiddleware, async (req, res) => {
  try {
    const conversations = await Conversation.find({
      participants: req.user._id,
    });
    const conversationIds = conversations.map((c) => c._id);

    const count = await Message.countDocuments({
      conversationId: { $in: conversationIds },
      senderId: { $ne: req.user._id },
      isRead: false,
    });

    res.json({ unreadCount: count });
  } catch (error) {
    console.error("获取未读消息数失败:", error);
    res.status(500).json({ message: "获取失败" });
  }
});

module.exports = router;
