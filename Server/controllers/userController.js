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

    // Create a new user（单校版：college 写死为南昌师范学院）
    const newUser = new User({
      email: req.body.email,
      password: req.body.password,
      fullName: req.body.fullName,
      college: "南昌师范学院",
      department: req.body.department,
      major: req.body.major,
      phoneNo: req.body.phoneNo,
      address: req.body.address || req.body.dormitory || "南昌师范学院",
      dormitory: req.body.dormitory || ""
    });
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
    // 封禁检查
    if (existingUser.status === "banned") {
      return res.status(403).json({ message: "该账号已被封禁" });
    }
    // Generate a JWT token and send it in the response
    const { token, sessionId } = await createSession(existingUser._id.toString());

    // 将 session 存入用户记录，限制同时只有 1 个活跃设备
    // 用 updateOne 而非 save()，避免旧文档缺少新增必填字段触发全量校验
    const device = req.headers["user-agent"]
      ? req.headers["user-agent"].substring(0, 100)
      : "未知设备";
    await User.updateOne(
      { _id: existingUser._id },
      {
        $push: {
          activeSessions: {
            $each: [{ sessionId, device, loginAt: new Date() }],
            $slice: -1, // 只保留最新的 1 个
          },
        },
      }
    );

    // 返回前移除 password 字段
    const userData = existingUser.toObject();
    delete userData.password;
    res.status(200).json({ token, user: userData });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Logout — 移除当前 session，允许多设备互踢
exports.logoutUser = async (req, res) => {
  try {
    const sessionId = req.sessionId; // 由 authMiddleware 从 JWT 中提取
    if (sessionId) {
      await User.updateOne(
        { _id: req.user._id },
        { $pull: { activeSessions: { sessionId } } }
      );
    }
    res.json({ message: "已登出" });
  } catch (error) {
    console.error("登出失败:", error);
    res.status(500).json({ message: "登出失败" });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.getUserById = async (req, res) => {
  const { userId } = req.params;
  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    // 兼容旧用户没有 createdAt 的情况
    const result = user.toObject();
    delete result.password;
    if (!result.createdAt) {
      result.createdAt = result.updatedAt || new Date("2026-01-01");
    }
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.updateUser = async (req, res) => {
  const { userId } = req.params;
  const { body } = req;

  try {
    // Check if the request body is empty
    if (!body) {
      return res.status(400).json({ message: "Request body is empty" });
    }

    // ⚠️ 越权检查：只能修改自己的资料
    if (req.user._id.toString() !== userId) {
      return res.status(403).json({ message: "无权修改他人资料" });
    }

    // 字段白名单：防止通过修改 role/status 等字段提权
    const allowedFields = ["fullName", "phoneNo", "department", "major", "dormitory", "address"];
    const safeUpdate = {};
    allowedFields.forEach(field => {
      if (body[field] !== undefined) {
        safeUpdate[field] = body[field];
      }
    });

    const user = await User.findByIdAndUpdate(userId, safeUpdate, {
      new: true,
      runValidators: true,
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // 若修改了学院或专业，同步更新所有在售商品
    if (safeUpdate.department || safeUpdate.major) {
      const updateFields = {};
      if (safeUpdate.department) {
        updateFields["uploadedBy.department"] = safeUpdate.department;
        updateFields.listedByDepartment = safeUpdate.department;
      }
      if (safeUpdate.major) {
        updateFields["uploadedBy.major"] = safeUpdate.major;
        updateFields.listedByMajor = safeUpdate.major;
      }
      await Product.updateMany(
        { "uploadedBy.id": userId, status: { $nin: ["sold_out", "inactive"] } },
        { $set: updateFields }
      );
    }

    res.json(user);
  } catch (error) {
    // Check for specific validation errors
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.deleteUser = async (req, res) => {
  const { userId } = req.params;
  try {
    // ⚠️ 越权检查：只能删除自己的账户
    if (req.user._id.toString() !== userId) {
      return res.status(403).json({ message: "无权删除他人账户" });
    }

    // 级联处理：将该用户的所有商品标记为 inactive，避免成为"孤儿商品"
    await Product.updateMany(
      { "uploadedBy.id": userId },
      { $set: { status: "inactive", delistReason: "卖家已注销账户" } }
    );

    const user = await User.findByIdAndDelete(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json({ message: "User and associated products deactivated" });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};
