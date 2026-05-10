const { generateDescription, recommendCategory } = require("../services/aiService");

const generateProductDescription = async (req, res) => {
  try {
    const { productName, category } = req.body;

    if (!productName) {
      return res.status(400).json({ message: "商品名称不能为空" });
    }

    const description = await generateDescription(
      productName,
      category || "其他"
    );

    res.json({ description });
  } catch (error) {
    console.error("生成商品描述失败:", error);
    res.status(500).json({ message: error.message });
  }
};

const recommendProductCategory = async (req, res) => {
  try {
    const { productName } = req.body;

    if (!productName) {
      return res.status(400).json({ message: "商品名称不能为空" });
    }

    const category = await recommendCategory(productName);

    res.json({ category });
  } catch (error) {
    console.error("推荐商品分类失败:", error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  generateProductDescription,
  recommendProductCategory,
};
