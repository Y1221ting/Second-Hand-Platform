const mongoose = require("mongoose");

const SellerSchema = new mongoose.Schema({
  id:         String,
  name:       { type: String, maxlength: 50 },
  college:    String,
  department: { type: String, maxlength: 100 },
  major:      { type: String, maxlength: 100 },
  dormitory:  { type: String, maxlength: 100 },
  phone:      { type: String, maxlength: 11 },
  wechat:     { type: String, maxlength: 50 },
  qq:         { type: String, maxlength: 20 },
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
    maxlength: [200, "商品名称不能超过200个字符"],
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
    maxlength: [2000, "商品描述不能超过2000个字符"],
  },
  price: {
    type: Number,
    required: true,
    min: 0,
    max: 9999.9,
  },
  images: {
    type: [String],
    required: true,
  },
  specifications: [SpecificationSchema], // Embed specifications as an array of objects
  status: {
    type: String,
    enum: ["unsold", "sold", "sold_out", "inactive"],
    default: "unsold",
    required: true,
  },
  quantity: {
    type: Number,
    default: 1,
    min: 0,
  },
  delistReason: {
    type: String,
    default: "",
  },
  purchasedBy: {
    type: SellerSchema,
    default: null,
  },
  views: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// 索引定义必须在 model() 之前才生效
ProductSchema.index({ name: "text", description: "text" });
ProductSchema.index({ createdAt: -1 });
// 复合索引：覆盖常见筛选 + 排序组合
ProductSchema.index({ status: 1, category: 1, createdAt: -1 });         // 分类筛选 + 最新
ProductSchema.index({ status: 1, "uploadedBy.department": 1, createdAt: -1 }); // 学院排序
ProductSchema.index({ "uploadedBy.id": 1, status: 1 });                 // 用户商品列表
ProductSchema.index({ "purchasedBy.id": 1 });                           // 已购商品列表


const Product = mongoose.model("Product", ProductSchema);

module.exports = Product;
