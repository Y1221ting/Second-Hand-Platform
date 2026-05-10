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
            content: "你是一个专业的二手商品描述生成助手。请根据商品名称和分类，生成一段简洁、吸引人的商品描述（100-200字）。描述应包含商品特点、使用状况、适合人群等信息。直接返回描述内容，不要加任何前缀或解释。",
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

module.exports = {
  generateDescription,
};
