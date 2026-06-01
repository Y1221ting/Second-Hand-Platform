const Product = require("../models/Product");
const User = require("../models/User");

// 1. 获取我的购物车
exports.getCart = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate("cart.productId");
    if (!user) {
      return res.status(404).json({ message: "用户不存在" });
    }

    // 过滤掉已被删除的商品，同时清理购物车中的脏数据
    const validItems = user.cart.filter((item) => item.productId != null);
    if (validItems.length !== user.cart.length) {
      user.cart = validItems;
      await user.save();
    }

    // 将购物车转为纯对象并显式转换 Decimal128 价格为数字，防止前端 parseFloat NaN
    const cart = validItems.map(item => {
      const obj = item.toObject();
      if (obj.productId && obj.productId.price) {
        obj.productId.price = Number(obj.productId.price) || 0;
      }
      return obj;
    });

    res.status(200).json({ cart });
  } catch (error) {
    console.error("获取购物车失败:", error);
    res.status(500).json({ message: "服务器内部错误" });
  }
};

// 2. 加入购物车
exports.addToCart = async (req, res) => {
  try {
    const { productId } = req.params;
    let { quantity } = req.body;

    // 处理可选的 quantity 参数，默认 1
    if (quantity === undefined || quantity === null) {
      quantity = 1;
    }

    // 校验数量必须为正整数
    if (!Number.isInteger(quantity) || quantity < 1) {
      return res.status(400).json({ message: "数量必须为正整数" });
    }

    // 1. 检查商品是否存在
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "商品不存在" });
    }

    // 2. 不能加自己的商品
    if (product.uploadedBy.id === req.user._id.toString()) {
      return res.status(400).json({ message: "不能将自有商品加入购物车" });
    }

    // 3. 检查商品状态
    if (product.status === "sold_out" || product.status === "inactive") {
      return res.status(400).json({ message: "该商品已下架或售罄" });
    }

    if (product.quantity <= 0) {
      return res.status(400).json({ message: "该商品库存不足" });
    }

    // 4. 检查请求数量是否超过库存
    if (quantity > product.quantity) {
      return res
        .status(400)
        .json({ message: `库存不足，当前库存 ${product.quantity} 件` });
    }

    // 5. 检查是否已在购物车中
    const user = await User.findById(req.user._id);
    const existingItem = user.cart.find(
      (item) => item.productId.toString() === productId
    );

    if (existingItem) {
      // 已在购物车中，检查加上现有数量是否超库存
      const totalQuantity = existingItem.quantity + quantity;
      if (totalQuantity > product.quantity) {
        return res.status(400).json({
          message: `购物车已有 ${existingItem.quantity} 件，再添加 ${quantity} 件将超过库存 ${product.quantity} 件`,
        });
      }
      existingItem.quantity = totalQuantity;
    } else {
      // 不在购物车中，新增
      user.cart.push({
        productId: product._id,
        quantity: quantity,
        addedAt: new Date(),
      });
    }

    await user.save();
    res.status(200).json({ message: "已加入购物车", cart: user.cart });
  } catch (error) {
    console.error("加入购物车失败:", error);
    if (error.name === "CastError") {
      return res.status(400).json({ message: "无效的商品 ID" });
    }
    res.status(500).json({ message: "服务器内部错误" });
  }
};

// 3. 从购物车移除商品
exports.removeFromCart = async (req, res) => {
  try {
    const { productId } = req.params;

    const user = await User.findById(req.user._id);
    const beforeCount = user.cart.length;

    user.cart = user.cart.filter(
      (item) => item.productId.toString() !== productId
    );

    if (user.cart.length === beforeCount) {
      return res.status(404).json({ message: "购物车中未找到该商品" });
    }

    await user.save();

    // 重新 populate 后返回
    await user.populate("cart.productId");
    const cart = user.cart.map(item => {
      const obj = item.toObject();
      if (obj.productId && obj.productId.price) {
        obj.productId.price = Number(obj.productId.price) || 0;
      }
      return obj;
    });

    res.status(200).json({ message: "已移除", cart });
  } catch (error) {
    console.error("移除购物车商品失败:", error);
    res.status(500).json({ message: "服务器内部错误" });
  }
};

// 4. 修改购物车商品数量
exports.updateQuantity = async (req, res) => {
  try {
    const { productId } = req.params;
    const { quantity } = req.body;

    // 校验数量
    if (!Number.isInteger(quantity) || quantity < 1) {
      return res.status(400).json({ message: "数量必须为正整数" });
    }

    // 检查商品库存
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "商品不存在" });
    }
    if (quantity > product.quantity) {
      return res
        .status(400)
        .json({ message: `库存不足，当前库存 ${product.quantity} 件` });
    }

    const user = await User.findById(req.user._id);
    const item = user.cart.find(
      (item) => item.productId.toString() === productId
    );

    if (!item) {
      return res.status(404).json({ message: "购物车中未找到该商品" });
    }

    item.quantity = quantity;
    await user.save();

    // 重新 populate 后返回
    await user.populate("cart.productId");
    const cart = user.cart.map(item => {
      const obj = item.toObject();
      if (obj.productId && obj.productId.price) {
        obj.productId.price = Number(obj.productId.price) || 0;
      }
      return obj;
    });

    res.status(200).json({ message: "数量已更新", cart });
  } catch (error) {
    console.error("更新购物车数量失败:", error);
    res.status(500).json({ message: "服务器内部错误" });
  }
};

// 5. 清空购物车
exports.clearCart = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.cart = [];
    await user.save();

    res.status(200).json({ message: "购物车已清空" });
  } catch (error) {
    console.error("清空购物车失败:", error);
    res.status(500).json({ message: "服务器内部错误" });
  }
};

// 6. 批量结算
exports.checkoutCart = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user.cart || user.cart.length === 0) {
      return res.status(400).json({ message: "购物车为空" });
    }

    const results = { success: [], failed: [] };

    // 逐个结算购物车中的商品
    for (const item of user.cart) {
      try {
        const product = await Product.findOneAndUpdate(
          {
            _id: item.productId,
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
              status: "sold",
            },
          },
          { new: true }
        );

        if (product) {
          results.success.push({
            productId: item.productId,
            name: product.name,
            price: Number(product.price) || 0,
          });

          // 库存归零时更新售罄状态
          if (product.quantity === 0) {
            await Product.findByIdAndUpdate(product._id, {
              status: "sold_out",
            });
          }
        } else {
          const existing = await Product.findById(item.productId);
          const reason = existing
            ? existing.uploadedBy.id === req.user._id.toString()
              ? "不能购买自己的商品"
              : "库存不足或已下架"
            : "商品不存在";
          results.failed.push({ productId: item.productId, reason });
        }
      } catch (err) {
        results.failed.push({ productId: item.productId, reason: err.message });
      }
    }

    // 清空购物车
    user.cart = [];
    await user.save();

    res.status(200).json({
      message: `结算完成：成功 ${results.success.length} 件，失败 ${results.failed.length} 件`,
      results,
    });
  } catch (error) {
    console.error("购物车结算失败:", error);
    res.status(500).json({ message: "服务器内部错误" });
  }
};
