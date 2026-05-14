const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const SECRET = process.env.JWT_SECRET || "your-secret-key"; // Use environment variable for security

async function hashPassword(password) {
  return await bcrypt.hash(password, 12);
}

async function verifyPassword(password, hashedPassword) {
  return await bcrypt.compare(password, hashedPassword);
}

async function createSession(userId) {
  const token = jwt.sign({ userId }, SECRET, {
    expiresIn: "1d", // Adjust the expiration time as needed
  });
  return { token };
}

module.exports = {
  SECRET,
  hashPassword,
  verifyPassword,
  createSession,
};
