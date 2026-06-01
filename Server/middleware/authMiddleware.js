const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { SECRET } = require("../config/auth");

const authMiddleware = async (req, res, next) => {
  try {
    // 1. Get token from header
    const token = req.header("Authorization")?.replace("Bearer ", "");
    
    if (!token) {
      return res.status(401).json({ message: "未提供Token，请先登录", code: "NO_TOKEN" });
    }

    // 2. Verify token — 统一从 config/auth.js 读取密钥
    let decoded;
    try {
      decoded = jwt.verify(token, SECRET);
    } catch (jwtError) {
      if (jwtError.name === "TokenExpiredError") {
        return res.status(401).json({ message: "Token已过期，请重新登录", code: "TOKEN_EXPIRED" });
      }
      return res.status(401).json({ message: "Token无效，JWT验证失败", code: "JWT_INVALID" });
    }

    // 3. Find user
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ message: "Token无效，用户不存在", code: "USER_NOT_FOUND" });
    }

    // 3.5 检查 session 是否仍然有效（防多设备同时登录）
    if (decoded.sessionId) {
      const sessionActive = user.activeSessions.some(
        (s) => s.sessionId === decoded.sessionId
      );
      if (!sessionActive) {
        return res.status(401).json({
          message: "账号已在其他设备登录，请重新登录",
          code: "SESSION_EXPIRED",
        });
      }
    }

    // 4. Attach user and sessionId to request
    req.user = user;
    req.sessionId = decoded.sessionId || null;
    next();
  } catch (error) {
    console.error("authMiddleware未知错误:", error);
    res.status(401).json({ message: "认证失败", code: "AUTH_UNKNOWN" });
  }
};

module.exports = authMiddleware;
