const Product = require("../models/Product");

// Create a product
exports.createProduct = async (req, res) => {
  try {
    // 1. Validate required fields
    if (!req.body.name || !req.body.description || !req.body.price || !req.body.images) {
      return res.status(400).json({ message: "Missing required fields: name, description, price, images" });
    }

    // 2. Validate price is positive
    if (req.body.price <= 0) {
      return res.status(400).json({ message: "Price must be greater than 0" });
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
      query.$text = { $search: search };
    }

    if (category) {
      query.category = category;
    }

    if (college) {
      query["uploadedBy.college"] = college;
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
      .limit(limit);

    res.status(200).json({
      products,
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
    res.status(200).json(product);
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
    if (req.body.price !== undefined && req.body.price <= 0) {
      return res.status(400).json({ message: "Price must be greater than 0" });
    }

    const updatedProduct = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
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

    // Return the products in the response
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

    const products = await Product.find({ "purchasedBy.id": userId });

    res.status(200).json(products);
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

// Purchase a product (handle inventory)
exports.purchaseProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Check if product is active and has stock
    if (product.status === "inactive") {
      return res.status(400).json({ message: "Product is inactive" });
    }
    if (product.status === "sold_out" || product.quantity <= 0) {
      return res.status(400).json({ message: "Product is sold out" });
    }

    // Check if buyer is the owner
    if (product.uploadedBy.id === req.user._id.toString()) {
      return res.status(400).json({ message: "不能购买自己的商品" });
    }

    // Decrease quantity
    product.quantity -= 1;

    // Record buyer info
    product.purchasedBy = {
      id: req.user._id.toString(),
      name: req.user.fullName,
      college: req.user.college || "",
    };

    // If quantity reaches 0, mark as sold_out
    if (product.quantity === 0) {
      product.status = "sold_out";
    } else {
      product.status = "sold";
    }

    await product.save();

    res.status(200).json({ message: "Purchase successful", product });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};
