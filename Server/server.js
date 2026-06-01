const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
// [新增] Gzip 压缩中间件，减少 API 响应体积约 40%
const compression = require("compression");
const userRoutes = require("./routes/userRoutes");
const productRoutes = require("./routes/productRoutes");
const cartRoutes = require("./routes/cartRoutes");
const aiRoutes = require("./routes/aiRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
const connectDB = require("./config/db");

connectDB();
const app = express();

// Middleware
// [新增] 响应压缩（需放在其他中间件之前）
app.use(compression());
app.use(bodyParser.json({ limit: "10mb" }));
app.use(bodyParser.urlencoded({ limit: "10mb", extended: true }));
app.use(express.json());
app.use(
  cors({
    origin: process.env.CLIENT_URL || "*",
  })
);

// 确保 uploads 目录存在
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Routes
app.use("/api/users", userRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/upload", uploadRoutes);

// 学院-专业映射（南昌师范学院单校版）
app.get("/api/majorMap", (req, res) => {
  res.json(require("./config/majorMap"));
});

// 静态文件服务：/uploads → Server/uploads/
app.use("/uploads", express.static(uploadsDir));

// Start the server
const port = process.env.PORT || 8000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
