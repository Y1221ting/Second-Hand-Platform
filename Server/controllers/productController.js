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

    // 3. Add uploader info from authenticated user
    req.body.uploadedBy = {
      id: req.user._id.toString(),
      name: req.user.fullName,
      college: req.user.college || "",
    };

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
    const college = req.query.college || "";

    let query = {};

    if (search) {
      const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      query.$or = [
        { name: { $regex: escaped, $options: "i" } },
        { "uploadedBy.college": { $regex: escaped, $options: "i" } },
        { "uploadedBy.name": { $regex: escaped, $options: "i" } },
      ];
    }

    if (category) {
      query.category = category;
    }

    if (college) {
      const escaped = college.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      query["uploadedBy.college"] = { $regex: escaped, $options: "i" };
    }

    if (req.query.minPrice || req.query.maxPrice) {
      query.price = {};
      if (req.query.minPrice) query.price.$gte = parseFloat(req.query.minPrice);
      if (req.query.maxPrice) query.price.$lte = parseFloat(req.query.maxPrice);
    }

    let sortObj = {};
    if (sort === "latest") sortObj = { createdAt: -1 };
    else if (sort === "lowestPrice") sortObj = { price: 1 };
    else if (sort === "highestPrice") sortObj = { price: -1 };

    const total = await Product.countDocuments(query);
    const products = await Product.find(query)
      .sort(sortObj)
      .skip((page - 1) * limit)
      .limit(limit)
      .select("name category description price images specifications status quantity purchasedBy createdAt uploadedBy");

    // 优化：列表页只返回第一张图片，减少数据传输量；显式转换 Decimal128 价格为数字
    const optimizedProducts = products.map(product => {
      const productObj = product.toObject();
      productObj.price = Number(productObj.price) || 0;
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
    // 显式转换 Decimal128 价格为数字，避免前端 parseFloat 返回 NaN
    const productObj = product.toObject();
    productObj.price = Number(productObj.price) || 0;
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

    // Validate price if it's being updated
    if (req.body.price !== undefined) {
      if (req.body.price <= 0) {
        return res.status(400).json({ message: "Price must be greater than 0" });
      }
      if (req.body.price > 9999.9) {
        return res.status(400).json({ message: "价格不能超过 ¥9999.9" });
      }
    }

    const updatedProduct = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true, // 确保 price > 0 等校验被触发
    });
    // 显式转换 Decimal128 价格为数字
    const updateResult = updatedProduct.toObject();
    updateResult.price = Number(updateResult.price) || 0;
    res.status(200).json(updateResult);
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

    // 显式转换 Decimal128 价格为数字
    const result = products.map(p => {
      const obj = p.toObject();
      obj.price = Number(obj.price) || 0;
      return obj;
    });
    res.status(200).json(result);
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

    // 显式转换 Decimal128 价格为数字
    const result = products.map(p => {
      const obj = p.toObject();
      obj.price = Number(obj.price) || 0;
      return obj;
    });
    res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching purchased products:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Add an image to a product
exports.addImageToProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
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
    const limit = parseInt(req.query.limit) || 6;
    const excludeId = req.query.excludeId || "";
    const category = req.query.category || "";
    const college = req.query.college || "";
    const sellerId = req.query.sellerId || "";

    const exclusions = [];
    if (excludeId) exclusions.push(excludeId);
    const baseFilter = {
      _id: { $nin: exclusions },
      status: { $nin: ["sold_out", "inactive"] },
    };
    if (userId) baseFilter["uploadedBy.id"] = { $ne: userId };

    // 1）同类目商品（详情页场景 — 当前商品的分类）
    let categoryProducts = [];
    if (category) {
      categoryProducts = await Product.find({ ...baseFilter, category })
        .sort({ createdAt: -1 })
        .limit(limit)
        .select("name images price uploadedBy category status quantity createdAt");
    }

    const usedIds = categoryProducts.map(p => p._id);
    let remaining = limit - categoryProducts.length;

    // 2）同校商品（详情页场景 — 从当前商品的学校）
    let collegeProducts = [];
    if (college && remaining > 0) {
      collegeProducts = await Product.find({
        _id: { $nin: [...exclusions, ...usedIds] },
        "uploadedBy.college": college,
        "uploadedBy.id": userId ? { $ne: userId } : undefined,
        status: { $nin: ["sold_out", "inactive"] },
      })
        .sort({ createdAt: -1 })
        .limit(remaining)
        .select("name images price uploadedBy category status quantity createdAt");

      usedIds.push(...collegeProducts.map(p => p._id));
      remaining = limit - categoryProducts.length - collegeProducts.length;
    }

    // 3）同发布者其他商品
    let sellerProducts = [];
    if (sellerId && remaining > 0) {
      sellerProducts = await Product.find({
        _id: { $nin: [...exclusions, ...usedIds] },
        "uploadedBy.id": sellerId,
        status: { $nin: ["sold_out", "inactive"] },
      })
        .sort({ createdAt: -1 })
        .limit(remaining)
        .select("name images price uploadedBy category status quantity createdAt");

      usedIds.push(...sellerProducts.map(p => p._id));
      remaining = limit - categoryProducts.length - collegeProducts.length - sellerProducts.length;
    }

    // 4）如果传了 userId，找用户同校商品（列表页场景 — 从登录用户）
    let sameCollegeProducts = [];
    if (userId && remaining > 0) {
      const allUsed = [...exclusions, ...usedIds];
      const User = require("../models/User");
      const user = await User.findById(userId);
      if (user && user.college) {
        sameCollegeProducts = await Product.find({
          _id: { $nin: allUsed },
          "uploadedBy.college": user.college,
          "uploadedBy.id": { $ne: userId },
          status: { $nin: ["sold_out", "inactive"] },
        })
          .sort({ createdAt: -1 })
          .limit(remaining)
          .select("name images price uploadedBy status quantity createdAt");

        usedIds.push(...sameCollegeProducts.map(p => p._id));
        remaining = limit - categoryProducts.length - collegeProducts.length - sellerProducts.length - sameCollegeProducts.length;
      }
    }

    // 5）填充最新商品兜底
    let fillProducts = [];
    if (remaining > 0) {
      fillProducts = await Product.find({
        _id: { $nin: excludeId ? [excludeId, ...usedIds] : usedIds },
        status: { $nin: ["sold_out", "inactive"] },
        ...(userId ? { "uploadedBy.id": { $ne: userId } } : {}),
      })
        .sort({ createdAt: -1 })
        .limit(remaining)
        .select("name images price uploadedBy category status quantity createdAt");
    }

    const combined = [
      ...categoryProducts.map(p => ({ ...p.toObject(), aiReason: "同类商品AI智能匹配" })),
      ...collegeProducts.map(p => ({ ...p.toObject(), aiReason: "同校同学发布的AI推荐" })),
      ...sellerProducts.map(p => ({ ...p.toObject(), aiReason: "该卖家其他商品AI推荐" })),
      ...sameCollegeProducts.map(p => ({ ...p.toObject(), aiReason: "基于同校偏好的AI推荐" })),
      ...fillProducts.map(p => ({ ...p.toObject(), aiReason: "热门商品AI推荐" })),
    ];

    // 转换 Decimal128 价格为数字
    const result = combined.map(p => {
      const obj = { ...p };
      obj.price = Number(obj.price) || 0;
      if (obj.images && obj.images.length > 0) {
        obj.images = [obj.images[0]];
      }
      return obj;
    });

    res.status(200).json(result);
  } catch (error) {
    console.error("获取推荐失败:", error);
    res.status(200).json([]); // 静默失败，不影响主流程
  }
};

exports.updateProductStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    // Find the product by ID
    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    // Update the status of the product
    product.status = status;

    // Save the updated product
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
            id: req.user._id.toString(),
            name: req.user.fullName,
            college: req.user.college || "",
          },
          status: "sold",
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

    // 如果库存归零，更新状态为售罄（非关键路径，可容忍两次写入）
    if (product.quantity === 0) {
      await Product.findByIdAndUpdate(product._id, { status: "sold_out" });
    }

    // 显式转换 Decimal128 价格为数字
    const purchaseResult = product.toObject();
    purchaseResult.price = Number(purchaseResult.price) || 0;

    res.status(200).json({ message: "购买成功", product: purchaseResult });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "服务器内部错误" });
  }
};
