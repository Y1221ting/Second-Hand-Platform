const winston = require("winston");
const path = require("path");
const fs = require("fs");

// 确保日志目录存在
const logDir = path.join(__dirname, "..", "logs");
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// 日志格式
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaStr = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : "";
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${metaStr}`;
  })
);

// 判断开发环境
const isDev = process.env.NODE_ENV !== "production";

// 传输器列表
const transports = [
  // 所有日志 → app.log（5MB 上限，保留 5 个文件）
  new winston.transports.File({
    filename: path.join(logDir, "app.log"),
    maxsize: 5 * 1024 * 1024, // 5MB
    maxFiles: 5,
    format: logFormat,
  }),
  // 错误日志 → error.log（仅 error 级别）
  new winston.transports.File({
    filename: path.join(logDir, "error.log"),
    level: "error",
    maxsize: 5 * 1024 * 1024,
    maxFiles: 5,
    format: logFormat,
  }),
];

// 开发环境同时打印到控制台
if (isDev) {
  transports.push(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.timestamp({ format: "HH:mm:ss" }),
        winston.format.printf(({ timestamp, level, message, ...meta }) => {
          const metaStr = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : "";
          return `[${timestamp}] ${level} ${message}${metaStr}`;
        })
      ),
    })
  );
}

const logger = winston.createLogger({
  level: isDev ? "info" : "info",
  transports,
});

module.exports = logger;
