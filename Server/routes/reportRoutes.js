const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const Report = require("../models/Report");

// 举报商品
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { productId, reason, detail } = req.body;
    if (!productId) {
      return res.status(400).json({ message: "缺少商品ID" });
    }

    const report = new Report({
      productId,
      reporterId: req.user._id.toString(),
      reason: reason || "其他",
      detail: detail || "",
    });
    await report.save();

    res.status(201).json({ message: "举报已提交" });
  } catch (error) {
    console.error("举报失败:", error);
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: "输入数据格式不正确" });
    }
    res.status(500).json({ message: "服务器内部错误" });
  }
});

module.exports = router;
