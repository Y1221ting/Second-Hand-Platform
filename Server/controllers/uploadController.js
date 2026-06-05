const multer = require("multer");
const path = require("path");
const fs = require("fs");
const logger = require("../config/logger");

// 魔法字节验证：读取文件头 4 字节，匹配已知图片格式签名
function verifyImageMagicBytes(filepath) {
  try {
    const buf = Buffer.alloc(4);
    const fd = fs.openSync(filepath, "r");
    fs.readSync(fd, buf, 0, 4, 0);
    fs.closeSync(fd);
    // JPEG: FF D8 FF
    if (buf[0] === 0xFF && buf[1] === 0xD8 && buf[2] === 0xFF) return "jpg";
    // PNG: 89 50 4E 47
    if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4E && buf[3] === 0x47) return "png";
    // GIF: 47 49 46 38
    if (buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x38) return "gif";
    // WebP: RIFF....WEBP
    if (buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46) {
      const buf2 = Buffer.alloc(4);
      const fd2 = fs.openSync(filepath, "r");
      fs.readSync(fd2, buf2, 0, 4, 8);
      fs.closeSync(fd2);
      if (buf2[0] === 0x57 && buf2[1] === 0x45 && buf2[2] === 0x42 && buf2[3] === 0x50) return "webp";
    }
    return null;
  } catch (_) {
    return null;
  }
}

// 配置磁盘存储
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../uploads"));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, uniqueSuffix + ext);
  },
});

// 第一道防线：MIME 类型过滤（仅放行 image/*，拒绝 SVG）
const fileFilter = (req, file, cb) => {
  if (!file.mimetype.startsWith("image/")) {
    cb(new Error("只允许上传图片文件"), false);
    return;
  }
  // SVG 可嵌入 JS/XSS，拒绝
  if (file.mimetype === "image/svg+xml") {
    cb(new Error("不支持 SVG 格式，请上传 JPG/PNG/GIF/WebP"), false);
    return;
  }
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 20 * 1024 * 1024 }, // 单张 20MB（前端已压缩，这个只是兜底）
});

exports.uploadMiddleware = upload.array("images", 9); // 最多 9 张

exports.uploadImages = (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "请选择图片" });
    }

    // 第二道防线：魔法字节验证，删除伪装文件
    const urls = [];
    for (const f of req.files) {
      const ext = verifyImageMagicBytes(f.path);
      if (!ext) {
        fs.unlinkSync(f.path); // 删除非图片文件
        return res.status(400).json({ message: "文件类型校验失败，请上传真实的 JPG/PNG/GIF/WebP 图片" });
      }
      // 统一扩展名为实际类型，防止 .exe 伪装
      if (path.extname(f.filename).toLowerCase() !== `.${ext}`) {
        const newName = f.filename.replace(/\.[^.]+$/, `.${ext}`);
        const newPath = path.join(path.dirname(f.path), newName);
        fs.renameSync(f.path, newPath);
        urls.push(`/uploads/${newName}`);
      } else {
        urls.push(`/uploads/${f.filename}`);
      }
    }
    res.json({ urls });
  } catch (error) {
    logger.error("上传失败", { message: error.message });
    res.status(500).json({ message: "上传失败" });
  }
};
