const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { SECRET } = require("../config/auth");
const logger = require("../config/logger");

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

    // tokenVersion 校验：用户修改密码/被封禁后旧 token 自动失效
    if ((decoded.tv || 0) !== (user.tokenVersion || 0)) {
      return res.status(401).json({ message: "密码已修改，请重新登录", code: "TOKEN_VERSION_MISMATCH" });
    }

    if (user.status === "banned") {
      return res.status(403).json({ message: "账号已被封禁", code: "USER_BANNED" });
    }

    req.user = user;
    next();
  } catch (error) {
    logger.error("authMiddleware 错误", { message: error.message });
    res.status(500).json({ message: "服务器错误" });
  }
};

// 可选认证：有 token 则解析用户，无 token 也放行（用于公开路由的 PII 脱敏判断）
const optionalAuth = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");
    if (!token) return next();
    const decoded = jwt.verify(token, SECRET);
    const user = await User.findById(decoded.userId).select("-password");
    if (user && (decoded.tv || 0) === (user.tokenVersion || 0) && user.status !== "banned") {
      req.user = user;
    }
  } catch (_) {
    // token 无效或无 token，正常放行
  }
  next();
};

module.exports = authMiddleware;
module.exports.optionalAuth = optionalAuth;
