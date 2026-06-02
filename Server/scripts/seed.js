// 种子数据：初始化 24 条模拟商品，让平台上线时首页不空
// 执行：node Server/scripts/seed.js
require("dotenv").config({ path: require("path").join(__dirname, "..", "..", ".env") });
const mongoose = require("mongoose");
const Product = require("../models/Product");
const User = require("../models/User");

const seedUser = {
  id: "000000000000000000000000",
  name: "管理员(种子数据)",
  college: "南昌师范学院",
  department: "数学与信息科学学院",
  major: "计算机科学与技术",
  dormitory: "1栋302",
  phone: "13800000000",
  wechat: "",
  qq: "",
};

const products = [
  { name: "高等数学（第七版）上册", category: "教材教辅", price: 25, quantity: 1,
    description: "九成新，只有第一章有少量笔记，其他部分几乎全新。同济大学版，计算机专业必修课教材。",
    department: "数学与信息科学学院", major: "计算机科学与技术" },
  { name: "大学英语四级真题 2024版", category: "教材教辅", price: 15, quantity: 1,
    description: "做了一半，后面都是空白的。附赠听力光盘未拆封。",
    department: "外国语学院", major: "英语" },
  { name: "iPad 第九代 64GB 深空灰", category: "电子数码", price: 1200, quantity: 1,
    description: "去年双十一买的，用了一年换了新的。平时带着壳+膜，屏幕无划痕，电池健康 92%。配件齐全，原装充电器+数据线。",
    department: "物理与电子信息学院", major: "电子信息工程" },
  { name: "床上小桌子 折叠款", category: "宿舍神器", price: 30, quantity: 2,
    description: "木质的折叠床上桌，很结实。毕业了带不走，便宜出。",
    department: "教育学院", major: "学前教育" },
  { name: "罗技 K380 蓝牙键盘", category: "电子数码", price: 80, quantity: 1,
    description: "买来配 iPad 用的，很新，包装盒还在。支持三个设备一键切换。",
    department: "文学院", major: "汉语言文学" },
  { name: "台灯 LED 护眼", category: "宿舍神器", price: 35, quantity: 1,
    description: "三档调光，USB 充电，可以夹在床头上。用了一年，功能完好。",
    department: "化学与食品科学学院", major: "化学" },
  { name: "线性代数 同济第六版", category: "教材教辅", price: 18, quantity: 1,
    description: "课本保存得很好，没有涂画，封面有点磨损。",
    department: "数学与信息科学学院", major: "数学与应用数学" },
  { name: "小米手环 7 NFC版", category: "电子数码", price: 120, quantity: 1,
    description: "戴了半年，换了 Apple Watch 所以出。表带有使用痕迹，功能一切正常。",
    department: "体育学院", major: "体育教育" },
  { name: "瑜伽垫 加厚 10mm", category: "体育用品", price: 25, quantity: 1,
    description: "买了两张，出一张。加厚款，做瑜伽和拉伸都很舒服。九成新。",
    department: "音乐舞蹈学院", major: "舞蹈学" },
  { name: "四六级词汇闪过 2025版", category: "教材教辅", price: 10, quantity: 2,
    description: "全新未拆封，买多了。高频词+中频词+低频词分类记忆，非常好用。",
    department: "外国语学院", major: "英语" },
  { name: "耳机架 + 鼠标垫 套装", category: "生活用品", price: 15, quantity: 1,
    description: "桌面收纳好帮手。耳机架是铝合金的，鼠标垫 80×30cm 超大号。",
    department: "美术与设计学院", major: "视觉传达设计" },
  { name: "电风扇 USB 桌面小风扇", category: "生活用品", price: 20, quantity: 3,
    description: "三档风力，静音电机。夏天宿舍必备。全新，买多了几台。",
    department: "生命科学学院", major: "生物科学" },
  { name: "数据结构 C语言版 严蔚敏", category: "教材教辅", price: 22, quantity: 1,
    description: "考研必备，书内有少量标注，不影响使用。",
    department: "数学与信息科学学院", major: "计算机科学与技术" },
  { name: "羽毛球拍一对 + 3个球", category: "体育用品", price: 60, quantity: 1,
    description: "入门级球拍，适合平时打着玩。碳素材质，很轻。",
    department: "体育学院", major: "社会体育指导与管理" },
  { name: "衣架 20个装 不锈钢", category: "生活用品", price: 10, quantity: 2,
    description: "不锈钢防锈衣架，买了太多用不完。全新未拆。",
    department: "旅游与经济管理学院", major: "旅游管理" },
  { name: "水彩颜料 24色 马利牌", category: "文具办公", price: 35, quantity: 1,
    description: "上水彩课买的，就用了几次。颜色齐全，附赠调色盘和两支画笔。",
    department: "美术与设计学院", major: "美术学" },
  { name: "牛津高阶英汉双解词典 第9版", category: "教材教辅", price: 45, quantity: 1,
    description: "英语专业必备，九成新，带保护套。",
    department: "外国语学院", major: "英语" },
  { name: "加热鼠标垫 冬日暖手宝", category: "宿舍神器", price: 18, quantity: 1,
    description: "冬天写作业手冷？这个超好用！三档温度，自动定时关闭，安全可靠。",
    department: "马克思主义学院", major: "思想政治教育" },
  { name: "蓝牙音箱 便携式", category: "电子数码", price: 55, quantity: 1,
    description: "JBL GO3 同款造型，音质不错。洗澡/跑步带着听歌。续航约5小时。",
    department: "音乐舞蹈学院", major: "音乐学" },
  { name: "考研政治 肖秀荣 1000题", category: "教材教辅", price: 20, quantity: 1,
    description: "去年考研用的，选择题做了一遍，解析很详细。附赠知识点提要一本。",
    department: "马克思主义学院", major: "思想政治教育" },
  { name: "床上三件套 纯棉 1.2m", category: "生活用品", price: 40, quantity: 1,
    description: "学校床铺尺寸刚好。蓝灰色格子款，洗过两次，干净整洁。含床单+被套+枕套。",
    department: "教育学院", major: "小学教育" },
  { name: "考研数学一 李永乐复习全书", category: "教材教辅", price: 28, quantity: 1,
    description: "基础篇+提高篇两本。有少量笔记，重点题目已标注。",
    department: "数学与信息科学学院", major: "数学与应用数学" },
  { name: "床头收纳篮 挂式", category: "宿舍神器", price: 12, quantity: 2,
    description: "挂在床沿的铁丝篮，放手机/充电器/眼镜超方便。黑白两色可选。",
    department: "文学院", major: "汉语言文学" },
  { name: "手工羊毛围巾 红色", category: "服饰美妆", price: 30, quantity: 1,
    description: "自己织的围巾，纯羊毛，很暖和。织了两条出一条。冬天必备。",
    department: "美术与设计学院", major: "服装与服饰设计" },
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/second-hand");
    console.log("已连接数据库");

    // 检查是否已有种子数据
    const count = await Product.countDocuments({ "uploadedBy.id": seedUser.id });
    if (count > 0) {
      console.log(`已有 ${count} 条种子数据，跳过（如需重新生成请先删除）`);
      process.exit(0);
    }

    const inserted = [];
    for (const p of products) {
      const product = new Product({
        ...p,
        images: [], // 种子数据暂无真实图片
        uploadedBy: seedUser,
        listedByDepartment: p.department,
        listedByMajor: p.major,
        status: "unsold",
        specifications: [],
      });
      await product.save();
      inserted.push(product.name);
    }

    console.log(`成功插入 ${inserted.length} 条种子商品：`);
    inserted.forEach((name, i) => console.log(`  ${i + 1}. ${name}`));
    process.exit(0);
  } catch (err) {
    console.error("种子数据插入失败:", err.message);
    process.exit(1);
  }
}

seed();
