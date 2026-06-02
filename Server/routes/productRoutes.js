const express = require("express");
const router = express.Router();
const productController = require("../controllers/productController");
const authMiddleware = require("../middleware/authMiddleware");
const { optionalAuth } = authMiddleware;

// Public routes (no auth required — but optionalAuth 用于 PII 脱敏判断)
router.get("/", optionalAuth, productController.getAllProducts);
router.get("/recommendations", optionalAuth, productController.getRecommendations);
router.get("/ai-recommendations", optionalAuth, productController.getRecommendations);
router.get("/:id", optionalAuth, productController.getProductById);
router.get("/user/:userId", authMiddleware, productController.getProductsByUser);
router.get("/purchased/:userId", authMiddleware, productController.getPurchasedProducts);

// Protected routes (auth required)
router.post("/", authMiddleware, productController.createProduct);
router.put("/:id", authMiddleware, productController.updateProductById);
router.delete("/:id", authMiddleware, productController.deleteProductById);
router.put("/:id/update-status", authMiddleware, productController.updateProductStatus);
router.post("/:id/purchase", authMiddleware, productController.purchaseProduct);

router.post("/:id/images", authMiddleware, productController.addImageToProduct);
router.delete(
  "/:id/images/:imageIndex",
  authMiddleware,
  productController.removeImageFromProduct
);
router.post("/:id/specifications", authMiddleware, productController.addSpecificationToProduct);
router.put(
  "/:id/specifications/:specificationId",
  authMiddleware,
  productController.updateProductSpecification
);
router.delete(
  "/:id/specifications/:specificationId",
  authMiddleware,
  productController.removeProductSpecification
);

module.exports = router;
