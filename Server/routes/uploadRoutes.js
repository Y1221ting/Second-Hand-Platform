const express = require("express");
const router = express.Router();
const {
  uploadMiddleware,
  uploadImages,
} = require("../controllers/uploadController");
const authMiddleware = require("../middleware/authMiddleware");

router.post(
  "/",
  authMiddleware,
  (req, res, next) => {
    uploadMiddleware(req, res, (err) => {
      if (err) return res.status(400).json({ message: err.message });
      next();
    });
  },
  uploadImages
);

module.exports = router;
