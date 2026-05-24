const User = require("../models/User");
const Product = require("../models/Product");
const {
  hashPassword,
  verifyPassword,
  createSession,
} = require("../config/auth");

// Register a user
exports.registerUser = async (req, res) => {
  try {
    // 1. Check password length before hashing
    if (req.body.password && req.body.password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    // Check if the email already exists
    const existingUser = await User.findOne({ email: req.body.email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already exists" });
    }

    // Create a new user
    const newUser = new User(req.body);
    newUser.password = await hashPassword(req.body.password);
    await newUser.save();

    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    console.error(error);
    // 2. Handle validation errors (missing fields, invalid format)
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: "Internal server error" });
  }
};

// Login a user
exports.loginUser = async (req, res) => {
  try {
    // 空值校验
    if (!req.body.email || !req.body.password) {
      return res.status(400).json({ message: "邮箱和密码不能为空" });
    }

    // Check if the email exists
    const existingUser = await User.findOne({ email: req.body.email });
    if (!existingUser) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // Check if the password is correct
    const isPasswordValid = await verifyPassword(
      req.body.password,
      existingUser.password
    );
    if (!isPasswordValid) {
      return res.status(400).json({ message: "Invalid email or password" });
    }
    // Generate a JWT token and send it in the response
    const token = await createSession(existingUser._id.toString());
    // 返回前移除 password 字段
    const userData = existingUser.toObject();
    delete userData.password;
    res.status(200).json({ token, user: userData });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.getUserById = async (req, res) => {
  const { userId } = req.params;
  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    // 兼容旧用户没有 createdAt 的情况
    const result = user.toObject();
    delete result.password;
    if (!result.createdAt) {
      result.createdAt = result.updatedAt || new Date("2026-01-01");
    }
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.updateUser = async (req, res) => {
  const { userId } = req.params;
  const { body } = req;

  try {
    // Check if the request body is empty
    if (!body) {
      return res.status(400).json({ error: "Request body is empty" });
    }

    // ⚠️ 越权检查：只能修改自己的资料
    if (req.user._id.toString() !== userId) {
      return res.status(403).json({ error: "无权修改他人资料" });
    }

    const user = await User.findByIdAndUpdate(userId, body, {
      new: true,
      runValidators: true,
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(user);
  } catch (error) {
    // Check for specific validation errors
    if (error.name === "ValidationError") {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.deleteUser = async (req, res) => {
  const { userId } = req.params;
  try {
    // ⚠️ 越权检查：只能删除自己的账户
    if (req.user._id.toString() !== userId) {
      return res.status(403).json({ error: "无权删除他人账户" });
    }

    // 级联处理：将该用户的所有商品标记为 inactive，避免成为"孤儿商品"
    await Product.updateMany(
      { "uploadedBy.id": userId },
      { $set: { status: "inactive" } }
    );

    const user = await User.findByIdAndRemove(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json({ message: "User and associated products deactivated" });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};
