const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, "Email is required"],
    unique: [true, "Email already registered!"],
    trim: true,
    lowercase: true,
    validate: {
      validator: function (value) {
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(value);
      },
      message: "Invalid email address",
    },
  },
  password: {
    type: String,
    required: [true, "Password is required"],
    minlength: 6,
  },
  fullName: {
    type: String,
    required: [true, "Full Name of user is required"],
    trim: true,
  },
  college: {
    type: String,
    required: [true, "College name is required"],
    trim: true,
  },
  phoneNo: {
    type: String,
    trim: true,
    validate: {
      validator: function (value) {
        return /^1[3-9]\d{9}$/.test(value);
      },
      message: "手机号格式不正确，请输入11位中国手机号码（1开头的第二位为3-9）",
    },
    required: [true, "手机号不能为空"],
  },
  department: {
    type: String,
    required: [true, "学院不能为空"],
    enum: [
      "数学与信息科学学院", "教育学院", "文学院", "外国语学院",
      "物理与电子信息学院", "化学与食品科学学院", "音乐舞蹈学院",
      "美术学院", "体育学院", "马克思主义学院", "旅游与经济管理学院",
      "生命科学学院", "其他学院"
    ]
  },
  major: {
    type: String,
    required: [true, "专业不能为空"]
  },
  dormitory: {
    type: String,
    trim: true
  },
  address: {
    type: String,
    required: [true, "地址不能为空"],
    trim: true,
    minlength: [5, "地址至少需要5个字符"],
  },
  cart: [{
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
    },
    quantity: {
      type: Number,
      default: 1,
      min: 1,
    },
    addedAt: {
      type: Date,
      default: Date.now,
    },
  }],
  role: {
    type: String,
    enum: ["user", "admin"],
    default: "user",
  },
  status: {
    type: String,
    enum: ["active", "banned"],
    default: "active",
  },
}, { timestamps: true });

const User = mongoose.model("User", userSchema);

module.exports = User;
