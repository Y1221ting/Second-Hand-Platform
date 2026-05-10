const express = require("express");
const router = express.Router();
const { generateProductDescription } = require("../controllers/aiController");

router.post("/generate-description", generateProductDescription);

module.exports = router;
