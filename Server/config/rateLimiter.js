// 降级容错：express-rate-limit 未安装时跳过限流，不影响登录/注册
let rateLimit;
try {
  rateLimit = require("express-rate-limit");
} catch (_) {
  rateLimit = null;
  console.warn("[rateLimiter] express-rate-limit 未安装，跳过限流");
}

function passthrough(req, res, next) {
  next();
}

// 登录限流：20次/15分钟/IP
const loginLimiter = rateLimit
  ? rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 20,
      standardHeaders: true,
      legacyHeaders: false,
      message: { message: "登录请求过于频繁，请15分钟后再试" },
    })
  : passthrough;

// 注册限流：5次/小时/IP
const registerLimiter = rateLimit
  ? rateLimit({
      windowMs: 60 * 60 * 1000,
      max: 5,
      standardHeaders: true,
      legacyHeaders: false,
      message: { message: "注册请求过于频繁，请1小时后再试" },
    })
  : passthrough;

module.exports = { loginLimiter, registerLimiter };
