const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const Wanted = require("../models/Wanted");
const { checkBanned } = require("../config/bannedKeywords");
const logger = require("../config/logger");

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
      contact: req.body.contact || "",
      postedBy: {
        id:         req.user._id.toString(),
        name:       req.user.fullName,
        department: req.user.department || "",
        major:      req.user.major || "",
        phone:      req.user.phoneNo || "",
      },
    });
    await wanted.save();
    logger.info("发布求购", { userId: req.user._id.toString(), wantedId: wanted._id.toString(), name: wanted.name });
    // 响应脱敏：不返回 postedBy.phone
    const safeWanted = wanted.toObject();
    if (safeWanted.postedBy) delete safeWanted.postedBy.phone;
    res.status(201).json({ message: "求购发布成功", wanted: safeWanted });
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: "输入数据格式不正确" });
    }
    logger.error("发布求购失败", { userId: req.user?._id?.toString(), message: error.message });
    res.status(500).json({ message: "服务器内部错误" });
  }
});

// 获取求购列表（分页）
router.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.search) {
      filter.name = { $regex: req.query.search, $options: "i" };
    }

    const [wanteds, total] = await Promise.all([
      Wanted.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Wanted.countDocuments(filter),
    ]);

    const result = wanteds.map((w) => {
      const obj = w.toObject();
      if (obj.postedBy) {
        delete obj.postedBy.phone; // 公开列表不暴露手机号
      }
      return obj;
    });

    res.json({
      wanteds: result,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    res.status(500).json({ message: "服务器内部错误" });
  }
});

// 获取当前用户的求购列表
router.get("/mine", authMiddleware, async (req, res) => {
  try {
    const wanteds = await Wanted.find({ "postedBy.id": req.user._id.toString() })
      .sort({ createdAt: -1 });
    res.json(wanteds);
  } catch (error) {
    res.status(500).json({ message: "服务器内部错误" });
  }
});

// 删除自己的求购
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const wanted = await Wanted.findById(req.params.id);
    if (!wanted) {
      return res.status(404).json({ message: "求购不存在" });
    }
    // 防御：postedBy 为空时也视为无权限（防脏数据）
    if (!wanted.postedBy || wanted.postedBy.id !== req.user._id.toString()) {
      return res.status(403).json({ message: "只能删除自己的求购" });
    }
    await Wanted.deleteOne({ _id: req.params.id });
    logger.info("删除求购", { userId: req.user._id.toString(), wantedId: req.params.id, name: wanted.name });
    res.json({ message: "删除成功" });
  } catch (error) {
    logger.error("删除求购失败", { userId: req.user?._id?.toString(), wantedId: req.params.id, message: error.message });
    res.status(500).json({ message: "服务器内部错误" });
  }
});

module.exports = router;
