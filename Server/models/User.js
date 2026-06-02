const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, "Email is required"],
    unique: [true, "Email already registered!"],
    trim: true,
    lowercase: true,
    maxlength: [254, "邮箱地址过长"],
    validate: {
      validator: function (value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(value);
      },
      message: "Invalid email address",
    },
  },
  password: {
    type: String,
    required: [true, "Password is required"],
    minlength: [8, "密码至少 8 位"],
    validate: {
      validator: function (v) {
        // 必须包含字母 + 数字
        return /[a-zA-Z]/.test(v) && /\d/.test(v);
      },
      message: "密码必须包含字母和数字",
    },
  },
  fullName: {
    type: String,
    required: [true, "Full Name of user is required"],
    trim: true,
    maxlength: [50, "姓名不能超过50个字符"],
  },
  college: {
    type: String,
    default: "南昌师范学院",
  },
  phoneNo: {
    type: String,
    trim: true,
    maxlength: [11, "手机号应为11位"],
    validate: {
      validator: function (value) {
        return /^1[3-9]\d{9}$/.test(value);
      },
      message: "手机号格式不正确，请输入11位中国手机号码",
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
    ],
  },
  major: {
    type: String,
    required: [true, "专业不能为空"],
    maxlength: [100, "专业名称过长"],
  },
  dormitory: {
    type: String,
    trim: true,
    maxlength: [100, "宿舍楼信息过长"],
    default: "",
  },
  wechat: {
    type: String,
    trim: true,
    maxlength: [50, "微信号过长"],
    default: "",
  },
  qq: {
    type: String,
    trim: true,
    maxlength: [20, "QQ号过长"],
    default: "",
  },
  address: {
    type: String,
    trim: true,
    maxlength: [200, "地址过长"],
    default: "南昌师范学院",
  },
  cart: [{
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
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
  loginAttempts: {
    type: Number,
    default: 0,
  },
  lockUntil: {
    type: Date,
    default: null,
  },
  tokenVersion: {
    type: Number,
    default: 0,
  },
  role: {
    type: String,
    enum: ["user", "admin"],
    default: "user",
  },
  status: {
    type: String,
    enum: ["active", "banned", "inactive"],
    default: "inactive",
  },
}, { timestamps: true });

userSchema.index({ status: 1 });
userSchema.index({ role: 1 });

const User = mongoose.model("User", userSchema);

module.exports = User;
