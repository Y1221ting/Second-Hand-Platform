const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { SECRET } = require("../config/auth");

const authMiddleware = async (req, res, next) => {
  try {
    // 1. Get token from header
    const token = req.header("Authorization")?.replace("Bearer ", "");
    
    if (!token) {
      return res.status(401).json({ message: "No token, authorization denied" });
    }

    // 2. Verify token — 统一从 config/auth.js 读取密钥
    const decoded = jwt.verify(token, SECRET);
    
    // 3. Find user
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ message: "Token is not valid" });
    }

    // 4. Attach user to request
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: "Token is not valid" });
  }
};

module.exports = authMiddleware;
