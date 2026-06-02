const User = require("../models/User");
const Product = require("../models/Product");
const { hashPassword, verifyPassword, createToken } = require("../config/auth");
const { checkBanned } = require("../config/bannedKeywords");

// Register a user
exports.registerUser = async (req, res) => {
  try {
    // 1. 邮箱类型校验（防 NoSQL 注入：$ne/$regex 等操作符对象）
    if (typeof req.body.email !== "string" || !req.body.email.trim()) {
      return res.status(400).json({ message: "邮箱格式不正确" });
    }
    const email = req.body.email.trim().toLowerCase();

    // 2. Check password length before hashing
    if (req.body.password && req.body.password.length < 8) {
      return res.status(400).json({ message: "密码至少需要8位" });
    }

    // Check if the email already exists（防枚举：不告知具体原因）
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "注册失败，请检查填写信息" });
    }

    // Check if the phone number already exists
    if (req.body.phoneNo) {
      const existingPhone = await User.findOne({ phoneNo: req.body.phoneNo });
      if (existingPhone) {
        return res.status(400).json({ message: "该手机号已注册，请直接登录" });
      }
    }

    // 3. 违禁词检查（用户资料字段）
    const profileHit = checkBanned([req.body.fullName, req.body.wechat, req.body.qq].filter(Boolean).join(" "));
    if (profileHit) {
      return res.status(400).json({ message: "个人信息包含违规内容，请修改后重新提交" });
    }

    // Create a new user（单校版：college 写死为南昌师范学院）
    const newUser = new User({
      email,
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
    await newUser.save({ validateModifiedOnly: true });

    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    console.error(error);
    // 手机号重复（MongoDB 唯一索引冲突）
    if (error.code === 11000 && error.keyPattern?.phoneNo) {
      return res.status(400).json({ message: "该手机号已注册，请直接登录" });
    }
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: "输入数据格式不正确" });
    }
    res.status(500).json({ message: "Internal server error" });
  }
};

// Login a user
exports.loginUser = async (req, res) => {
  try {
    // 空值 + 类型校验（防 NoSQL 注入：$ne/$regex 等操作符对象）
    if (typeof req.body.email !== "string" || !req.body.email.trim() || !req.body.password) {
      return res.status(400).json({ message: "邮箱和密码不能为空" });
    }
    const email = req.body.email.trim().toLowerCase();

    const existingUser = await User.findOne({ email });
    if (!existingUser) {
      // 防用户枚举：统一返回模糊错误
      return res.status(400).json({ message: "邮箱或密码错误" });
    }

    // 账户锁定检查
    if (existingUser.lockUntil && existingUser.lockUntil > new Date()) {
      return res.status(429).json({ message: "账户已锁定，请稍后重试" });
    }

    // 封禁检查
    if (existingUser.status === "banned") {
      return res.status(403).json({ message: "该账号已被封禁" });
    }

    // 待审核用户不允许登录 — 必须等管理员审核通过
    if (existingUser.status === "inactive") {
      return res.status(403).json({ message: "您的账号正在等待管理员审核，审核通过后即可登录" });
    }

    // Check if the password is correct
    const isPasswordValid = await verifyPassword(req.body.password, existingUser.password);
    if (!isPasswordValid) {
      // 记录失败次数，5 次后锁定 15 分钟
      existingUser.loginAttempts = (existingUser.loginAttempts || 0) + 1;
      if (existingUser.loginAttempts >= 5) {
        existingUser.lockUntil = new Date(Date.now() + 15 * 60 * 1000);
      }
      await existingUser.save({ validateModifiedOnly: true });
      if (existingUser.loginAttempts >= 5) {
        return res.status(429).json({ message: "账户已锁定，请稍后重试" });
      }
      return res.status(400).json({ message: "邮箱或密码错误" });
    }

    // 登录成功 → 重置锁定计数
    if (existingUser.loginAttempts !== 0 || existingUser.lockUntil) {
      existingUser.loginAttempts = 0;
      existingUser.lockUntil = null;
      await existingUser.save({ validateModifiedOnly: true });
    }

    // 签发 JWT token（7 天有效期）
    const token = createToken(existingUser._id.toString(), existingUser.tokenVersion || 0);

    // 返回前移除 password 字段
    const userData = existingUser.toObject();
    delete userData.password;

    // 未激活用户也能登录，但前端根据 status 限制发布功能
    const pendingApproval = existingUser.status === "inactive";
    res.status(200).json({ token, user: userData, pendingApproval });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Logout — 递增 tokenVersion 使所有旧 token 立即失效
exports.logoutUser = async (req, res) => {
  try {
    req.user.tokenVersion = (req.user.tokenVersion || 0) + 1;
    await req.user.save({ validateModifiedOnly: true });
    res.json({ message: "已登出" });
  } catch (error) {
    console.error("登出失败:", error);
    res.status(500).json({ message: "服务器内部错误" });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const [users, total] = await Promise.all([
      User.find()
        .select("-password -cart")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      User.countDocuments(),
    ]);
    res.json({ users, total, page, totalPages: Math.ceil(total / limit) });
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
    const allowedFields = ["fullName", "phoneNo", "department", "major", "dormitory", "address", "wechat", "qq"];
    const safeUpdate = {};
    allowedFields.forEach(field => {
      if (body[field] !== undefined) {
        safeUpdate[field] = body[field];
      }
    });

    // 违禁词检查（用户可编辑的文本字段）
    const profileHit = checkBanned([safeUpdate.fullName, safeUpdate.wechat, safeUpdate.qq].filter(Boolean).join(" "));
    if (profileHit) {
      return res.status(400).json({ message: "个人信息包含违规内容，请修改后重新提交" });
    }

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

    // 返回前移除 password
    const result = user.toObject();
    delete result.password;
    res.json(result);
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: "输入数据格式不正确" });
    }
    res.status(500).json({ message: "Internal server error" });
  }
};

// Change password
exports.changePassword = async (req, res) => {
  const { userId } = req.params;
  const { oldPassword, newPassword } = req.body;

  try {
    // 越权检查：只能修改自己的密码
    if (req.user._id.toString() !== userId) {
      return res.status(403).json({ message: "无权修改他人密码" });
    }

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ message: "旧密码和新密码不能为空" });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ message: "新密码至少需要8位" });
    }

    if (!/[a-zA-Z]/.test(newPassword) || !/\d/.test(newPassword)) {
      return res.status(400).json({ message: "新密码必须包含字母和数字" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "用户不存在" });
    }

    // 验证旧密码
    const isMatch = await verifyPassword(oldPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "旧密码错误" });
    }

    // 更新密码 + 递增 tokenVersion 使所有旧 token 立即失效
    user.password = await hashPassword(newPassword);
    user.tokenVersion = (user.tokenVersion || 0) + 1;
    await user.save({ validateModifiedOnly: true });

    // 签发新 token
    const token = createToken(user._id.toString(), user.tokenVersion);

    res.json({ message: "密码修改成功，请使用新密码重新登录", token });
  } catch (error) {
    console.error("修改密码失败:", error);
    res.status(500).json({ message: "服务器内部错误" });
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
