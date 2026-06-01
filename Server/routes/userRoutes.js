const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const authMiddleware = require("../middleware/authMiddleware");
const { loginLimiter, registerLimiter } = require("../config/rateLimiter");

// Define the routes
router.post("/register", registerLimiter, userController.registerUser);
router.post("/login", loginLimiter, userController.loginUser);
router.post("/logout", authMiddleware, userController.logoutUser);
router.get("/", userController.getAllUsers);
router.get("/:userId", userController.getUserById);
router.put("/:userId", authMiddleware, userController.updateUser);
router.delete("/:userId", authMiddleware, userController.deleteUser);

module.exports = router;
