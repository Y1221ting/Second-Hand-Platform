const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const authMiddleware = require("../middleware/authMiddleware");

// Define the routes
router.post("/register", userController.registerUser);
router.post("/login", userController.loginUser);
router.get("/", userController.getAllUsers);
router.get("/:userId", userController.getUserById);
router.put("/:userId", authMiddleware, userController.updateUser);
router.delete("/:userId", userController.deleteUser);

module.exports = router;
