const express = require("express");
const router = express.Router();
const cartController = require("../controllers/cartController");
const authMiddleware = require("../middleware/authMiddleware");

// 所有购物车接口都需要登录
router.use(authMiddleware);

router.get("/", cartController.getCart);
router.post("/:productId", cartController.addToCart);
router.delete("/:productId", cartController.removeFromCart);
router.put("/:productId", cartController.updateQuantity);
router.delete("/", cartController.clearCart);
router.post("/checkout/all", cartController.checkoutCart);

module.exports = router;
