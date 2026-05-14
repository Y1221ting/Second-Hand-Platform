const multer = require("multer");
const path = require("path");

// 配置磁盘存储
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../uploads"));
  },
  filename: (req, file, cb) => {
    // 生成唯一文件名，避免中文乱码
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, uniqueSuffix + ext);
  },
});

// 只允许图片文件
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("只允许上传图片文件"), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 单张 5MB
});

exports.uploadMiddleware = upload.array("images", 9); // 最多 9 张

exports.uploadImages = (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "请选择图片" });
    }
    const urls = req.files.map((f) => `/uploads/${f.filename}`);
    res.json({ urls });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "上传失败" });
  }
};
