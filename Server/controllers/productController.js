const Product = require("../models/Product");

// Create a product
exports.createProduct = async (req, res) => {
  try {
    // 1. Validate required fields
    if (!req.body.name || !req.body.description || !req.body.price || !req.body.images) {
      return res.status(400).json({ message: "Missing required fields: name, description, price, images" });
    }

    // 2. Validate price is positive and within limit
    if (req.body.price <= 0) {
      return res.status(400).json({ message: "Price must be greater than 0" });
    }
    if (req.body.price > 9999.9) {
      return res.status(400).json({ message: "价格不能超过 ¥9999.9" });
    }

    // 3. Add uploader info from authenticated user（单校版：college写死，自动带入学院/专业）
    req.body.uploadedBy = {
      id:         req.user._id.toString(),
      name:       req.user.fullName,
      college:    "南昌师范学院",
      department: req.user.department || "",
      major:      req.user.major || "",
      dormitory:  req.user.dormitory || "",
      phone:      req.user.phoneNo || "",
      wechat:     req.user.wechat || "",
      qq:         req.user.qq || "",
    };
    req.body.listedByDepartment = req.user.department || "";
    req.body.listedByMajor = req.user.major || "";

    const product = new Product(req.body);
    await product.save();
    res.status(201).json(product);
  } catch (error) {
    console.error(error);
    // Handle validation errors
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get all products with pagination, search, and filtering
exports.getAllProducts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const search = req.query.search || "";
    const category = req.query.category || "";
    const sort = req.query.sort || "latest";

    const department = req.query.department || "";
    const userDepartment = req.query.userDepartment || "";

    let query = {};

    if (search) {
      // $text 搜索：利用 { name: "text", description: "text" } 索引，比 $regex 快 10-100 倍
      query.$text = { $search: search };
    }

    if (category) {
      query.category = category;
    }

    if (department) {
      query["uploadedBy.department"] = department;
    }

    if (req.query.minPrice || req.query.maxPrice) {
      query.price = {};
      if (req.query.minPrice) query.price.$gte = parseFloat(req.query.minPrice);
      if (req.query.maxPrice) query.price.$lte = parseFloat(req.query.maxPrice);
    }

    // 默认排除已售罄和已下架商品
    query.status = { $nin: ["sold_out", "inactive"] };

    let sortObj = {};
    if (search) {
      // 搜索时按文本相关性排序（带 score 字段）
      sortObj = { score: { $meta: "textScore" } };
    } else if (sort === "latest") sortObj = { createdAt: -1 };
    else if (sort === "lowestPrice") sortObj = { price: 1 };
    else if (sort === "highestPrice") sortObj = { price: -1 };
    else if (sort === "closest" && userDepartment) {
      sortObj = {
        "uploadedBy.department": userDepartment === "$natural" ? -1 : 1,
        createdAt: -1
      };
    } else {
      sortObj = { createdAt: -1 };
    }

    const total = await Product.countDocuments(query);
    const fields = "name category description price images specifications status quantity purchasedBy createdAt uploadedBy";
    const products = await Product.find(query, search ? { score: { $meta: "textScore" } } : {})
      .sort(sortObj)
      .skip((page - 1) * limit)
      .limit(limit)
      .select(fields);

    // 优化：列表页只返回第一张图片，减少数据传输量
    const optimizedProducts = products.map(product => {
      const productObj = product.toObject();
      if (productObj.images && productObj.images.length > 0) {
        productObj.images = [productObj.images[0]];
      }
      return productObj;
    });

    res.status(200).json({
      products: optimizedProducts,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get a single product by ID
exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    const productObj = product.toObject();
    res.status(200).json(productObj);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Update a product by ID
exports.updateProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Check if the user is the owner of the product
    if (product.uploadedBy.id !== req.user._id.toString()) {
      return res.status(403).json({ message: "Forbidden: You can only update your own products" });
    }

    // 字段白名单：防止通过 req.body 修改 status/purchasedBy/uploadedBy 等敏感字段
    const allowedFields = ["name", "description", "price", "category", "images", "specifications", "quantity"];
    const safeUpdate = {};
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        safeUpdate[field] = req.body[field];
      }
    });

    // Validate price if it's being updated
    if (safeUpdate.price !== undefined) {
      if (safeUpdate.price <= 0) {
        return res.status(400).json({ message: "Price must be greater than 0" });
      }
      if (safeUpdate.price > 9999.9) {
        return res.status(400).json({ message: "价格不能超过 ¥9999.9" });
      }
    }

    const updatedProduct = await Product.findByIdAndUpdate(req.params.id, safeUpdate, {
      new: true,
      runValidators: true,
    });
    res.status(200).json(updatedProduct);
  } catch (error) {
    console.error(error);
    // Handle validation errors
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: "Internal server error" });
  }
};

// Delete a product by ID
exports.deleteProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Check if the user is the owner of the product
    if (product.uploadedBy.id !== req.user._id.toString()) {
      return res.status(403).json({ message: "Forbidden: You can only delete your own products" });
    }

    await Product.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Product successfully deleted" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.getProductsByUser = async (req, res) => {
  try {
    const userId = req.params.userId;
    
    // Validate userId format
    if (!userId || userId.length !== 24) {
      return res.status(400).json({ message: "Invalid user ID format" });
    }

    // Fetch products listed by the user
    const products = await Product.find({ "uploadedBy.id": userId });

    res.status(200).json(products);
  } catch (error) {
    console.error("Error fetching user products:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.getPurchasedProducts = async (req, res) => {
  try {
    const userId = req.params.userId;
    
    if (!userId || userId.length !== 24) {
      return res.status(400).json({ message: "Invalid user ID format" });
    }

    // 获取用户购买的商品，排除用户自己发布的商品
    const products = await Product.find({
      "purchasedBy.id": userId,
      "uploadedBy.id": { $ne: userId }
    });

    res.status(200).json(products);
  } catch (error) {
    console.error("Error fetching purchased products:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Check product ownership helper
function checkOwnership(product, userId, res) {
  if (product.uploadedBy.id !== userId) {
    res.status(403).json({ message: "Forbidden" });
    return false;
  }
  return true;
}

// Add an image to a product
exports.addImageToProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    if (!checkOwnership(product, req.user._id.toString(), res)) return;
    product.images.push(req.body.imageUrl);
    await product.save();
    res.status(200).json(product);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Remove an image from a product
exports.removeImageFromProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    if (!checkOwnership(product, req.user._id.toString(), res)) return;
    product.images.splice(req.params.imageIndex, 1);
    await product.save();
    res.status(200).json(product);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Add a specification to a product
exports.addSpecificationToProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    if (!checkOwnership(product, req.user._id.toString(), res)) return;
    product.specifications.push(req.body);
    await product.save();
    res.status(200).json(product);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Update a specification of a product
exports.updateProductSpecification = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    if (!checkOwnership(product, req.user._id.toString(), res)) return;
    const specification = product.specifications.id(req.params.specificationId);
    if (!specification) {
      return res.status(404).json({ message: "Specification not found" });
    }
    specification.key = req.body.key;
    specification.value = req.body.value;
    await product.save();
    res.status(200).json(product);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Remove a specification from a product
exports.removeProductSpecification = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    if (!checkOwnership(product, req.user._id.toString(), res)) return;
    const specification = product.specifications.id(req.params.specificationId);
    if (!specification) {
      return res.status(404).json({ message: "Specification not found" });
    }
    product.specifications.pull(specification);
    await product.save();
    res.status(200).json(product);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// 推荐算法：同类目 → 同校 → 同卖家 → 最新兜底
exports.getRecommendations = async (req, res) => {
  try {
    const userId = req.query.userId || "";
    const limit = Math.min(parseInt(req.query.limit) || 6, 20);
    const excludeId = req.query.excludeId || "";
    const department = req.query.department || "";

    const exclusions = excludeId ? [excludeId] : [];
    const baseFilter = {
      _id: { $nin: exclusions },
      status: { $nin: ["sold_out", "inactive"] },
    };
    if (userId) baseFilter["uploadedBy.id"] = { $ne: userId };

    const usedIds = [...exclusions];
    let remaining = limit;

    // 第 1 层：同学院商品
    let departmentProducts = [];
    if (department && remaining > 0) {
      departmentProducts = await Product.find({
        ...baseFilter,
        _id: { $nin: usedIds },
        "uploadedBy.department": department,
      })
        .sort({ createdAt: -1 })
        .limit(remaining)
        .select("name images price uploadedBy category status quantity createdAt");
      usedIds.push(...departmentProducts.map(p => p._id));
      remaining = limit - departmentProducts.length;
    }

    // 第 2 层：最新商品兜底
    let fillProducts = [];
    if (remaining > 0) {
      fillProducts = await Product.find({
        ...baseFilter,
        _id: { $nin: usedIds },
      })
        .sort({ createdAt: -1 })
        .limit(remaining)
        .select("name images price uploadedBy category status quantity createdAt");
    }

    const combined = [
      ...departmentProducts,
      ...fillProducts,
    ];

    // 列表页只返回首张图片
    const result = combined.map(p => {
      const obj = p.toObject();
      if (obj.images && obj.images.length > 0) {
        obj.images = [obj.images[0]];
      }
      return obj;
    });

    res.status(200).json(result);
  } catch (error) {
    console.error("获取推荐失败:", error);
    res.status(200).json([]);
  }
};

exports.updateProductStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    // 所有权校验：只能修改自己的商品
    if (product.uploadedBy.id !== req.user._id.toString()) {
      return res.status(403).json({ error: "Forbidden" });
    }

    product.status = status;
    await product.save();

    res.json(product);
  } catch (error) {
    console.error("Error updating product status: ", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Purchase a product (atomic operation, prevents race condition / 防竞态)
exports.purchaseProduct = async (req, res) => {
  try {
    // 原子操作：findOneAndUpdate + $inc 确保并发下不会超卖
    const product = await Product.findOneAndUpdate(
      {
        _id: req.params.id,
        quantity: { $gt: 0 },
        status: { $nin: ["sold_out", "inactive"] },
        "uploadedBy.id": { $ne: req.user._id.toString() },
      },
      {
        $inc: { quantity: -1 },
        $set: {
          purchasedBy: {
            id:         req.user._id.toString(),
            name:       req.user.fullName,
            college:    "南昌师范学院",
            department: req.user.department || "",
            major:      req.user.major || "",
            dormitory:  req.user.dormitory || "",
            phone:      req.user.phoneNo || "",
          },
        },
      },
      { new: true }
    );

    if (!product) {
      const existing = await Product.findById(req.params.id);
      if (!existing) return res.status(404).json({ message: "商品不存在" });
      if (existing.uploadedBy.id === req.user._id.toString())
        return res.status(400).json({ message: "不能购买自己的商品" });
      return res.status(400).json({ message: "库存不足或商品已下架" });
    }

    // 库存归零 → 售罄；仍有库存 → 保持可购买
    if (product.quantity === 0) {
      await Product.findByIdAndUpdate(product._id, { status: "sold_out" });
    }

    // 创建订单记录（非关键路径：失败了也不影响已成功的购买）
    try {
      const { createOrder } = require("./orderController");
      const order = await createOrder({
        buyer: req.user,
        seller: product.uploadedBy.id,
        product,
        quantity: 1,
        buyerInfo: {
          name: req.user.fullName,
          phone: req.user.phoneNo || "",
          dormitory: req.user.dormitory || "",
          department: req.user.department || "",
        },
      });
      return res.status(200).json({ message: "购买成功", product, orderId: order._id });
    } catch (orderErr) {
      console.error("创建订单失败（购买已成功）:", orderErr);
      return res.status(200).json({ message: "购买成功", product });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "服务器内部错误" });
  }
};
