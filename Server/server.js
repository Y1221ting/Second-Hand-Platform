const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const userRoutes = require("./routes/userRoutes");
const productRoutes = require("./routes/productRoutes");
const aiRoutes = require("./routes/aiRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
const connectDB = require("./config/db");

connectDB();
const app = express();

// Middleware
app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));
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
app.use("/api/ai", aiRoutes);
app.use("/api/upload", uploadRoutes);

// 静态文件服务：/uploads → Server/uploads/
app.use("/uploads", express.static(uploadsDir));

// Start the server
const port = process.env.PORT || 8000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
