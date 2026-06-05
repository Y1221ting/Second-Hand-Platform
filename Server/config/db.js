require("dotenv").config({ path: require("path").join(__dirname, "..", "..", ".env") });
const mongoose = require("mongoose");
const logger = require("./logger");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
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
