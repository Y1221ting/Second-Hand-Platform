require("dotenv").config({ path: require("path").join(__dirname, "..", "..", ".env") });
const mongoose = require("mongoose");
const logger = require("./logger");

const connectDB = async () => {
  try {
    // 优先容器内部地址，本地开发回退 MONGODB_URI（仅连 localhost）
    const mongoURI = process.env.MONGODB_URI_FULL || process.env.MONGODB_URI;
    if (!mongoURI) {
      logger.error("MongoDB 连接串未配置（需设置 MONGODB_URI_FULL 或 MONGODB_URI）");
      process.exit(1);
    }
    await mongoose.connect(mongoURI, {
      maxPoolSize: 10,
      minPoolSize: 2,
      serverSelectionTimeoutMS: 5000,
    });
    logger.info("MongoDB 连接成功");
  } catch (error) {
    logger.error("MongoDB 连接失败", { message: error.message });
    process.exit(1);
  }
};

module.exports = connectDB;
