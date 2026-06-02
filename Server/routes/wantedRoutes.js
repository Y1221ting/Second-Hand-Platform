const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const Wanted = require("../models/Wanted");
const { checkBanned } = require("../config/bannedKeywords");

// 发布求购
router.post("/", authMiddleware, async (req, res) => {
  try {
    if (!req.body.name || !req.body.budget) {
      return res.status(400).json({ message: "商品名称和预算为必填" });
    }
    if (req.body.budget <= 0 || req.body.budget > 9999.9) {
      return res.status(400).json({ message: "预算需在 0 ~ 9999.9 之间" });
    }

    // 违禁词检查
    const hit = checkBanned(`${req.body.name || ""} ${req.body.description || ""}`);
    if (hit) {
      return res.status(400).json({ message: "求购信息包含违规内容，请修改后重新发布" });
    }

    const wanted = new Wanted({
      name: req.body.name,
      budget: req.body.budget,
      description: req.body.description || "",
      postedBy: {
        id:         req.user._id.toString(),
        name:       req.user.fullName,
        department: req.user.department || "",
        major:      req.user.major || "",
        phone:      req.user.phoneNo || "",
      },
    });
    await wanted.save();
    res.status(201).json({ message: "求购发布成功", wanted });
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: "服务器内部错误" });
  }
});

// 获取求购列表
router.get("/", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const wanteds = await Wanted.find()
      .sort({ createdAt: -1 })
      .limit(limit);
    const result = wanteds.map((w) => {
      const obj = w.toObject();
      if (obj.postedBy) {
        delete obj.postedBy.phone; // 公开列表不暴露手机号
      }
      return obj;
    });
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: "服务器内部错误" });
  }
});

module.exports = router;
