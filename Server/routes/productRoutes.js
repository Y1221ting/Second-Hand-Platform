const express = require("express");
const router = express.Router();
const productController = require("../controllers/productController");
const authMiddleware = require("../middleware/authMiddleware");

// Public routes (no auth required)
router.get("/", productController.getAllProducts);
router.get("/:id", productController.getProductById);
router.get("/user/:userId", productController.getProductsByUser);

// Protected routes (auth required)
router.post("/", authMiddleware, productController.createProduct);
router.put("/:id", authMiddleware, productController.updateProductById);
router.delete("/:id", authMiddleware, productController.deleteProductById);
router.put("/:id/update-status", authMiddleware, productController.updateProductStatus);

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
