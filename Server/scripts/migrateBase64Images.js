/**
 * 迁移旧商品的 base64 图片到文件存储
 *
 * 用法：
 *   1. 在服务器上：cd /www/wwwroot/Second-Hand-main/Server
 *   2. node scripts/migrateBase64Images.js
 *
 * 会将所有以 "data:image" 开头的图片字段转为文件，
 * 存到 uploads/ 目录，同时更新数据库中的图片路径。
 */

const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

// 数据库连接（优先读取环境变量，否则用默认值）
const MONGODB_URI =
  process.env.MONGODB_URI ||
  "mongodb://admin:@Yt1221wz@localhost:27017/second-hand?authSource=admin";

const UPLOADS_DIR = path.join(__dirname, "..", "uploads");

// 连接数据库
async function connect() {
  await mongoose.connect(MONGODB_URI);
  console.log("✓ 已连接 MongoDB");
}

// 定义简版 Product 模型（避免依赖不一致）
const ProductSchema = new mongoose.Schema({}, { strict: false });
const Product = mongoose.model("Product", ProductSchema);

// 将 base64 字符串转为文件，返回相对路径
function saveBase64AsFile(base64Str, index) {
  // 匹配格式: data:image/png;base64,iVBOR...
  const matches = base64Str.match(/^data:image\/(\w+);base64,(.+)$/);
  if (!matches) return null; // 不是 base64 图片，跳过

  const ext = matches[1] === "jpeg" ? "jpg" : matches[1];
  const data = Buffer.from(matches[2], "base64");

  // 生成唯一文件名：随机哈希 + 序号
  const hash = crypto.createHash("md5").update(data).digest("hex").slice(0, 10);
  const filename = `migrate_${hash}_${index}.${ext}`;
  const filepath = path.join(UPLOADS_DIR, filename);

  // 写文件（已存在则跳过）
  if (!fs.existsSync(filepath)) {
    fs.writeFileSync(filepath, data);
  }

  return `/uploads/${filename}`;
}

// 主流程
async function migrate() {
  // 确保上传目录存在
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }

  // 查出所有包含 base64 图片的商品
  const products = await Product.find({
    images: { $regex: "^data:image" },
  });

  console.log(`找到 ${products.length} 个含 base64 图片的商品`);

  let totalConverted = 0;
  let totalFreed = 0;

  for (const product of products) {
    const oldImages = product.images || [];
    const newImages = [];
    let productFreed = 0;

    for (let i = 0; i < oldImages.length; i++) {
      const img = oldImages[i];

      if (typeof img === "string" && img.startsWith("data:image")) {
        const url = saveBase64AsFile(img, i);
        if (url) {
          newImages.push(url);
          // 估算释放的空间（base64 比原始二进制大约 33%）
          productFreed += Math.round((img.length * 3) / 4);
          totalConverted++;
        } else {
          newImages.push(img); // 转不了就保留原值
        }
      } else {
        newImages.push(img); // 已经是路径的保留
      }
    }

    // 更新数据库
    await Product.findByIdAndUpdate(product._id, { images: newImages });
    totalFreed += productFreed;

    console.log(
      `  ✔ ${product.name || product._id}: ${oldImages.length} 图 → ${newImages.length} 图，释放约 ${(productFreed / 1024 / 1024).toFixed(2)} MB`
    );
  }

  console.log("\n========== 迁移完成 ==========");
  console.log(`转换图片: ${totalConverted} 张`);
  console.log(`涉及商品: ${products.length} 个`);
  console.log(`释放空间: ${(totalFreed / 1024 / 1024).toFixed(2)} MB`);
  console.log(`图片目录: ${UPLOADS_DIR}`);

  await mongoose.disconnect();
}

connect()
  .then(migrate)
  .catch((err) => {
    console.error("迁移失败:", err);
    process.exit(1);
  });
