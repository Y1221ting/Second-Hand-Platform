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
}, { timestamps: true });

const User = mongoose.model("User", userSchema);

module.exports = User;
