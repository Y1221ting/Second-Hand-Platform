const mongoose = require("mongoose");

const wantedSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  budget: {
    type: mongoose.Types.Decimal128,
    required: true,
    validate: {
      validator: function (value) {
        return value > 0;
      },
      message: "预算必须大于0",
    },
  },
  description: {
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

wantedSchema.set("toJSON", {
  transform: (doc, ret) => {
    if (ret.budget && typeof ret.budget === "object" && ret.budget.$numberDecimal) {
      ret.budget = ret.budget.$numberDecimal;
    }
    return ret;
  },
});
wantedSchema.set("toObject", {
  transform: (doc, ret) => {
    if (ret.budget && typeof ret.budget === "object" && ret.budget.$numberDecimal) {
      ret.budget = ret.budget.$numberDecimal;
    }
    return ret;
  },
});

wantedSchema.index({ createdAt: -1 }); // 求购列表按时间排序

module.exports = mongoose.model("Wanted", wantedSchema);
