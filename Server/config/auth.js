const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const SECRET = process.env.JWT_SECRET || "your-secret-key"; // Use environment variable for security

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
