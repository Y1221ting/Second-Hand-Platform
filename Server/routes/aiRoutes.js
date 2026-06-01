const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const { generateProductDescription, recommendProductCategory } = require("../controllers/aiController");

router.post("/generate-description", authMiddleware, generateProductDescription);
router.post("/recommend-category", authMiddleware, recommendProductCategory);

module.exports = router;
