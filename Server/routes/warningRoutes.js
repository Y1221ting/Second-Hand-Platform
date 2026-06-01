const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const Warning = require("../models/Warning");

// 用户查看自己的警告
router.get("/", authMiddleware, async (req, res) => {
  try {
    const isRead = req.query.isRead; // true | false | 不传=全部
    const query = { userId: req.user._id.toString() };
    if (isRead === "true") query.isRead = true;
    else if (isRead === "false") query.isRead = false;

    const warnings = await Warning.find(query).sort({ createdAt: -1 });
    const unreadCount = await Warning.countDocuments({
      userId: req.user._id.toString(),
      isRead: false,
    });

    res.json({ warnings, unreadCount });
  } catch (error) {
    console.error("获取警告失败:", error);
    res.status(500).json({ message: "获取警告失败" });
  }
});

// 标记已读
router.put("/:id/read", authMiddleware, async (req, res) => {
  try {
    const warning = await Warning.findById(req.params.id);
    if (!warning) {
      return res.status(404).json({ message: "警告不存在" });
    }
    if (warning.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "无权操作" });
    }

    warning.isRead = true;
    warning.readAt = new Date();
    await warning.save();

    res.json({ message: "已标记为已读", warning });
  } catch (error) {
    console.error("标记已读失败:", error);
    res.status(500).json({ message: "操作失败" });
  }
});

module.exports = router;
