const Order = require("../models/Order");

// 内部函数：创建订单（purchaseProduct 和 checkoutCart 共用）
exports.createOrder = async ({ buyer, seller, product, quantity, buyerInfo }) => {
  const order = await Order.create({
    buyer: buyer._id,
    seller: seller._id || seller,
    product: product._id,
    productSnapshot: {
      name: product.name,
      price: product.price,
      image: product.images?.[0] || "",
    },
    quantity,
    totalAmount: product.price * quantity,
    buyerInfo: {
      name: buyer.fullName,
      phone: buyer.phoneNo || "",
      dormitory: buyer.dormitory || "",
      department: buyer.department || "",
    },
  });
  return order;
};

// 1. 我的购买订单（作为买家）
exports.getBuyOrders = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const [orders, total] = await Promise.all([
      Order.find({ buyer: req.user._id })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate("product", "name images price status"),
      Order.countDocuments({ buyer: req.user._id }),
    ]);
    res.json({ orders, total, page, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    console.error("获取购买订单失败:", error);
    res.status(500).json({ message: "服务器内部错误" });
  }
};

// 2. 我的售出订单（作为卖家）
exports.getSellOrders = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const [orders, total] = await Promise.all([
      Order.find({ seller: req.user._id })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate("product", "name images price status"),
      Order.countDocuments({ seller: req.user._id }),
    ]);
    res.json({ orders, total, page, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    console.error("获取售出订单失败:", error);
    res.status(500).json({ message: "服务器内部错误" });
  }
};

// 3. 更新订单状态（卖家确认完成 / 取消）
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!["completed", "cancelled"].includes(status)) {
      return res.status(400).json({ message: "无效的状态值" });
    }

    // 状态机约束：pending → completed/cancelled，不允许从其他状态跳转
    const allowedFrom = status === "completed" ? ["pending"] : ["pending"];
    const order = await Order.findOneAndUpdate(
      { _id: req.params.id, seller: req.user._id, status: { $in: allowedFrom } },
      { $set: { status } },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ message: "订单不存在或无权操作" });
    }

    res.json({ message: "订单状态已更新", order });
  } catch (error) {
    console.error("更新订单状态失败:", error);
    res.status(500).json({ message: "服务器内部错误" });
  }
};
