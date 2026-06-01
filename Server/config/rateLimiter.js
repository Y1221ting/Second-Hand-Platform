const rateLimit = require("express-rate-limit");

// 登录限流：20次/15分钟/IP
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "登录请求过于频繁，请15分钟后再试" },
});

// 注册限流：5次/小时/IP
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "注册请求过于频繁，请1小时后再试" },
});

module.exports = { loginLimiter, registerLimiter };
