const mongoose = require("mongoose");

const SellerSchema = new mongoose.Schema({
  id:         String,
  name:       String,
  college:    String,
  department: String,
  major:      String,
  dormitory:  String,
  phone:      String,
});

// Define the specifications schema
const SpecificationSchema = new mongoose.Schema({
  key: String,
  value: String,
});

// Define the product schema
const ProductSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  uploadedBy: {
    type: SellerSchema,
    required: true,
  },
  category: {
    type: String,
    enum: ["教材教辅", "电子数码", "生活用品", "体育用品", "服饰美妆", "文具办公", "宿舍神器", "乐器爱好", "其他"],
    default: "其他",
    required: true,
  },
  listedByDepartment: String,
  listedByMajor: String,
  description: {
    type: String,
    required: true,
  },
  price: {
    type: mongoose.Types.Decimal128,
    required: true,
    validate: {
      validator: function (value) {
        return value > 0;
      },
      message: "Price cannot be negative.",
    },
  },
  images: {
    type: [String],
    required: true,
  },
  specifications: [SpecificationSchema], // Embed specifications as an array of objects
  status: {
    type: String,
    enum: ["unsold", "sold", "sold_out"],
    default: "unsold",
    required: true,
  },
  quantity: {
    type: Number,
    default: 1,
    min: 0,
  },
  purchasedBy: {
    type: SellerSchema,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// 索引定义必须在 model() 之前才生效
ProductSchema.index({ name: "text", description: "text" });
ProductSchema.index({ createdAt: -1 });

// 确保 Decimal128 类型的 price 始终以字符串形式输出
ProductSchema.set("toJSON", {
  transform: (doc, ret) => {
    if (ret.price && typeof ret.price === "object" && ret.price.$numberDecimal) {
      ret.price = ret.price.$numberDecimal;
    }
    return ret;
  },
});
ProductSchema.set("toObject", {
  transform: (doc, ret) => {
    if (ret.price && typeof ret.price === "object" && ret.price.$numberDecimal) {
      ret.price = ret.price.$numberDecimal;
    }
    return ret;
  },
});

const Product = mongoose.model("Product", ProductSchema);

module.exports = Product;
