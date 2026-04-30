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
        return /^\d{11}$/.test(value);
      },
      message: "Invalid phone number",
    },
    required: [true, "Phone number is required"],
  },
  address: {
    type: String,
    required: [true, "Address is required"],
    trim: true,
  },
});

const User = mongoose.model("User", userSchema);

module.exports = User;
