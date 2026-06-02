const express = require("express");
const router = express.Router();
const { getBuyOrders, getSellOrders, updateOrderStatus } = require("../controllers/orderController");
const authMiddleware = require("../middleware/authMiddleware");

router.get("/", authMiddleware, getBuyOrders);
router.get("/sold", authMiddleware, getSellOrders);
router.patch("/:id/status", authMiddleware, updateOrderStatus);

module.exports = router;
