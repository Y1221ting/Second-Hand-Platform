const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

if (!process.env.JWT_SECRET || process.env.JWT_SECRET === "change-me-in-production") {
  console.error("FATAL: JWT_SECRET 环境变量未设置，拒绝启动");
  process.exit(1);
}
const SECRET = process.env.JWT_SECRET;

async function hashPassword(password) {
  return await bcrypt.hash(password, 8); // bcryptjs 纯JS实现，8轮适配 2GB 低内存服务器
}

async function verifyPassword(password, hashedPassword) {
  return await bcrypt.compare(password, hashedPassword);
}

// 签发 JWT token（7 天有效期，含 tokenVersion 用于吊销）
function createToken(userId, tokenVersion) {
  return jwt.sign({ userId, tv: tokenVersion || 0 }, SECRET, { expiresIn: "7d" });
}

module.exports = {
  SECRET,
  hashPassword,
  verifyPassword,
  createToken,
};
