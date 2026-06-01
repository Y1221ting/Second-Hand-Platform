const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

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

async function createSession(userId) {
  const sessionId = crypto.randomUUID();
  const token = jwt.sign({ userId, sessionId }, SECRET, {
    expiresIn: "1d", // Adjust the expiration time as needed
  });
  return { token, sessionId };
}

module.exports = {
  SECRET,
  hashPassword,
  verifyPassword,
  createSession,
};
