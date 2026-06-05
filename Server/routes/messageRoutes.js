const router = require("express").Router();
const authMiddleware = require("../middleware/authMiddleware");
const Message = require("../models/Message");
const logger = require("../config/logger");

// 获取当前用户的消息列表
router.get("/", authMiddleware, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 20;

    const filter = { userId: req.user._id };
    if (req.query.isRead === "false") filter.isRead = false;
    else if (req.query.isRead === "true") filter.isRead = true;

    const [messages, total] = await Promise.all([
      Message.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Message.countDocuments(filter),
    ]);

    res.json({ messages, total, page, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    logger.error("获取消息失败", { message: err.message, userId: req.user?._id?.toString() });
    res.status(500).json({ message: "获取消息失败" });
  }
});

// 标记消息为已读
router.put("/:id/read", authMiddleware, async (req, res) => {
  try {
    const msg = await Message.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { isRead: true },
      { new: true }
    );
    if (!msg) return res.status(404).json({ message: "消息不存在" });
    res.json({ message: "已标记已读" });
  } catch (err) {
    res.status(500).json({ message: "操作失败" });
  }
});

// 获取未读消息数（Navbar 角标用）
router.get("/unread-count", authMiddleware, async (req, res) => {
  try {
    const count = await Message.countDocuments({ userId: req.user._id, isRead: false });
    res.json({ count });
  } catch (err) {
    res.status(500).json({ count: 0 });
  }
});

module.exports = router;
