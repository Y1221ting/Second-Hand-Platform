const mongoose = require("mongoose");

const wantedSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    maxlength: [200, "商品名称不能超过200个字符"],
  },
  budget: {
    type: Number,
    required: true,
    min: 0,
    max: 9999.9,
  },
  description: {
    type: String,
    default: "",
    maxlength: [2000, "描述不能超过2000个字符"],
  },
  contact: {
    type: String,
    default: "",
  },
  postedBy: {
    id:         String,
    name:       String,
    department: String,
    major:      String,
    phone:      String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

wantedSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Wanted", wantedSchema);
