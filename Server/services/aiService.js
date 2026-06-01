const axios = require("axios");

const generateDescription = async (productName, category) => {
  try {
    const response = await axios.post(
      "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions",
      {
        model: "qwen-plus",
        messages: [
          {
            role: "system",
            content: "你是南昌师范学院校园二手平台的描述助手。请根据商品名称和分类，用亲切的同学间对话语气生成一段商品描述（80-150字）。描述应包含：成色（几成新）、使用时间、购买渠道或原价。教材类说明适用课程或考试，电子产品说明型号和电池情况，最后可提示当面交易。直接返回描述，不加前缀。",
          },
          {
            role: "user",
            content: `请为以下二手商品生成描述：\n商品名称：${productName}\n分类：${category}`,
          },
        ],
      },
      {
        headers: {
          "Authorization": `Bearer ${process.env.QWEN_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    return response.data.choices[0].message.content;
  } catch (error) {
    console.error("AI生成描述失败:", error.response?.data || error.message);
    throw new Error("AI生成描述失败，请稍后重试");
  }
};

const recommendCategory = async (productName) => {
  try {
    const response = await axios.post(
      "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions",
      {
        model: "qwen-plus",
        messages: [
          {
            role: "system",
            content: "你是一个校园二手商品分类助手。请根据商品名称，从以下分类中选择最合适的一个：教材教辅、电子数码、生活用品、体育用品、服饰美妆、文具办公、宿舍神器、乐器爱好、其他。只返回分类的中文名称，不要加任何解释。",
          },
          {
            role: "user",
            content: `请为以下商品推荐分类：${productName}`,
          },
        ],
      },
      {
        headers: {
          "Authorization": `Bearer ${process.env.QWEN_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    return response.data.choices[0].message.content.trim();
  } catch (error) {
    console.error("AI推荐分类失败:", error.response?.data || error.message);
    throw new Error("AI推荐分类失败，请稍后重试");
  }
};

module.exports = {
  generateDescription,
  recommendCategory,
};
