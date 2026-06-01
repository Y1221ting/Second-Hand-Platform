const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { SECRET } = require("../config/auth");

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({ message: "请先登录", code: "NO_TOKEN" });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, SECRET);
    } catch (jwtError) {
      if (jwtError.name === "TokenExpiredError") {
        return res.status(401).json({ message: "登录已过期，请重新登录", code: "TOKEN_EXPIRED" });
      }
      return res.status(401).json({ message: "登录无效，请重新登录", code: "JWT_INVALID" });
    }

    const user = await User.findById(decoded.userId).select("-password");
    if (!user) {
      return res.status(401).json({ message: "用户不存在", code: "USER_NOT_FOUND" });
    }

    if (user.status === "banned") {
      return res.status(403).json({ message: "账号已被封禁", code: "USER_BANNED" });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("authMiddleware 错误:", error);
    res.status(500).json({ message: "服务器错误" });
  }
};

module.exports = authMiddleware;
