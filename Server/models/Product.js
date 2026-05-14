const mongoose = require("mongoose");

const SellerSchema = new mongoose.Schema({
  id: String,
  name: String,
  college: String,
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
    enum: ["electronics", "furniture", "clothing", "books", "sports", "food", "transportation", "beauty", "home", "other"],
    default: "other",
    required: true,
  },
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

const Product = mongoose.model("Product", ProductSchema);

module.exports = Product;
