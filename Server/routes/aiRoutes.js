const express = require("express");
const router = express.Router();
const { generateProductDescription, recommendProductCategory } = require("../controllers/aiController");

router.post("/generate-description", generateProductDescription);
router.post("/recommend-category", recommendProductCategory);

module.exports = router;
