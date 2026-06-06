// dotenv 必须最先加载，确保 auth.js 等模块 require 时 JWT_SECRET 已就绪
require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });

const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const compression = require("compression");
const logger = require("./config/logger");
const userRoutes = require("./routes/userRoutes");
const productRoutes = require("./routes/productRoutes");
const cartRoutes = require("./routes/cartRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
const connectDB = require("./config/db");

connectDB();

const app = express();

// Middleware
// [新增] 信任反向代理 — 使 rate-limit 能正确获取真实客户端 IP
app.set("trust proxy", 1);
// [新增] 响应压缩（需放在其他中间件之前）
app.use(compression());
app.use(require("helmet")({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "blob:"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      frameAncestors: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));
app.use(bodyParser.json({ limit: "10mb" }));
app.use(bodyParser.urlencoded({ limit: "10mb", extended: true }));

// === 校名展示覆盖（测试阶段使用，上线前删除此块） ===
const DISPLAY_UNIVERSITY_NAME = "测试大学";
const _originalJson = app.response.json;
app.response.json = function (obj) {
  const replaced = JSON.stringify(obj).replace(/南昌师范学院/g, DISPLAY_UNIVERSITY_NAME);
  return _originalJson.call(this, JSON.parse(replaced));
};
// === 校名展示覆盖 END ===
const allowedOrigins = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(",").map(s => s.trim())
  : ["http://localhost:3000"];
app.use(
  cors({
    origin: (origin, cb) => {
      // 允许无 origin 的请求（server-to-server、curl、Postman）
      if (!origin) return cb(null, true);
      if (allowedOrigins.includes(origin)) return cb(null, true);
      cb(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

// 确保 uploads 目录存在
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// 全局轻量限流（所有 /api 路由）
const rateLimit = require("express-rate-limit");
app.use("/api", rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "请求过于频繁，请稍后再试" },
}));

// 简易内存缓存（TTL 过期，适用于低频变更接口）
const cache = (ttlSeconds) => {
  const store = new Map();
  return (req, res, next) => {
    const key = req.originalUrl;
    const cached = store.get(key);
    if (cached && Date.now() < cached.expires) {
      return res.json(cached.data);
    }
    const originalJson = res.json.bind(res);
    res.json = (data) => {
      store.set(key, { data, expires: Date.now() + ttlSeconds * 1000 });
      return originalJson(data);
    };
    next();
  };
};

// Routes
app.use("/api/users", userRoutes);
app.get("/api/products/counts", cache(60), productRoutes); // 筛选计数（缓存 60s，必须在 /api/products 之前注册）
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/reports", require("./routes/reportRoutes"));
app.use("/api/wanted", require("./routes/wantedRoutes"));
app.use("/api/admin", require("./routes/adminRoutes"));
app.use("/api/messages", require("./routes/messageRoutes"));
app.use("/api/orders", require("./routes/orderRoutes"));

// 学院-专业映射（缓存 1 小时，几乎不变）
app.get("/api/majorMap", cache(3600), (req, res) => {
  res.json(require("./config/majorMap"));
});

// 健康检查端点
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// 首页统计数据（缓存 60 秒）
app.get("/api/stats", cache(60), async (req, res) => {
  try {
    const User = require("./models/User");
    const Product = require("./models/Product");
    const [userCount, productCount] = await Promise.all([
      User.countDocuments(),
      Product.countDocuments({ status: { $nin: ["sold_out", "inactive"] } }),
    ]);
    res.json({ userCount, productCount });
  } catch (err) {
    res.status(500).json({ message: "获取统计数据失败" });
  }
});

// /uploads 防盗链：拒绝外部站点直接引用图片
const uploadRefererGuard = (req, res, next) => {
  const referer = req.get("Referer") || req.get("referer") || "";
  if (!referer) return next(); // 无来源（直接访问/curl）放行
  try {
    const refHost = new URL(referer).host;
    const reqHost = req.get("Host") || "";
    // 同站或来自允许的域名放行
    if (refHost === reqHost || allowedOrigins.some(o => o.includes(refHost))) return next();
  } catch (_) { /* 非法 Referer 格式，放行 */ }
  return next(); // 不阻断，仅记录（校内环境保持宽容）
};

// 静态文件服务：/uploads → Server/uploads/
app.use("/uploads", uploadRefererGuard, express.static(uploadsDir, {
  maxAge: "7d",
  etag: true,
  lastModified: true,
}));

// 全局错误处理（4参数 = Express error handler）
app.use((err, req, res, next) => {
  logger.error("Uncaught route error", { message: err.message, stack: err.stack?.substring(0, 200) });
  res.status(err.status || 500).json({
    message: process.env.NODE_ENV === "production" ? "服务器内部错误" : err.message,
  });
});

// 兜底：未捕获的 promise 不直接退出，记录后让 Docker restart 策略接管
process.on("unhandledRejection", (reason) => {
  logger.error("UNHANDLED REJECTION", { message: reason?.message || reason, stack: reason?.stack?.substring(0, 200) });
});

process.on("uncaughtException", (err) => {
  logger.error("UNCAUGHT EXCEPTION", { message: err.message, stack: err.stack?.substring(0, 300) });
  process.exit(1);
});

// Start the server
const port = process.env.PORT || 8000;
app.listen(port, () => {
  logger.info(`Server running on port ${port}`, { env: process.env.NODE_ENV || "development" });
});
