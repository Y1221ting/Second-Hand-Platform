const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

if (!process.env.JWT_SECRET || process.env.JWT_SECRET === "change-me-in-production") {
  console.error("FATAL: JWT_SECRET 环境变量未设置，拒绝启动");
  process.exit(1);
}
const SECRET = process.env.JWT_SECRET;

async function hashPassword(password) {
  return await bcrypt.hash(password, 8);
}

async function verifyPassword(password, hashedPassword) {
  return await bcrypt.compare(password, hashedPassword);
}

// 签发 JWT token（7 天有效期，免去频繁登录）
function createToken(userId) {
  return jwt.sign({ userId }, SECRET, { expiresIn: "7d" });
}

module.exports = {
  SECRET,
  hashPassword,
  verifyPassword,
  createToken,
};
