# Second-Hand 校园二手交易平台

面向江西省38所高校的校园二手交易平台，支持商品发布、浏览搜索、购买、购物车、AI辅助描述生成等功能。

---

## 线上地址

**http://freevian.top:5000**

---

## 技术栈

| 层级 | 技术 | 说明 |
|------|------|------|
| **前端** | React 18 + Tailwind CSS + React Router v6 | 函数组件 + Hooks |
| **后端** | Node.js + Express 4 + Mongoose 7 | RESTful API |
| **数据库** | MongoDB 7.0 (Docker) | Decimal128 价格精度 |
| **认证** | JWT (jsonwebtoken + bcryptjs) | Token 过期 1 天 |
| **AI** | 通义千问 Qwen API (dashscope) | 描述生成 + 分类推荐 |
| **部署** | Docker Compose (3容器) + Nginx 反向代理 | 阿里云 ECS 2GB |

---

## 功能一览

1. ✅ **用户注册/登录** — JWT 认证，邮箱+密码
2. ✅ **商品发布** — 图片上传（自动压缩 >1MB -> ~200KB）、规格参数、AI 分类推荐
3. ✅ **商品列表** — Grid 响应式布局，分页、搜索（关键字/学校/分类/价格）、排序
4. ✅ **商品详情** — 图片轮播、描述、规格、库存状态、双按钮（加入购物车 + 立即购买）
5. ✅ **购买功能** — 原子操作减库存（`findOneAndUpdate` + `$inc`），防超卖
6. ✅ **购物车** — 添加/移除/修改数量/清空/批量结算
7. ✅ **商品推荐** — 商品详情页底部"猜你喜欢"（五级漏斗规则引擎）
8. ✅ **个人中心** — 编辑资料、发布记录、购买记录、购物车
9. ✅ **AI 辅助** — 通义千问生成商品描述、推荐分类
10. ✅ **学院模糊搜索** — 支持 $regex 模糊匹配（输入"师范"搜到江西师范大学等）

---

## 快速开始

### 本地开发

```bash
# 1. 安装依赖
cd Client && npm install
cd ../Server && npm install

# 2. 配置环境变量
# Server/.env 中配置：
# MONGODB_URI=mongodb://localhost:27017/second-hand
# JWT_SECRET=your-secret-key
# QWEN_API_KEY=your-api-key

# 3. 启动后端
cd Server && node server

# 4. 启动前端（另一个终端）
cd Client && npm start
```

### 部署

```bash
# 1. 本地构建前端
cd Client && npm run build

# 2. 提交代码
git add . && git commit -m "描述" && git push

# 3. 服务器部署
ssh root@8.162.24.145
cd /www/wwwroot/Second-Hand-main
git pull
docker compose up -d --build
```

---

## 项目结构

```
d:\Second-Hand-main\
├── docker-compose.yml          # Docker 编排（mongodb / backend / frontend）
├── Client/                     # 前端 React
│   ├── Dockerfile              # nginx:alpine，COPY build/
│   ├── nginx.conf              # 反向代理 /api/ → backend:8000
│   └── src/
│       ├── App.js              # 路由配置
│       ├── context/authContext.js   # JWT 认证上下文
│       └── components/         # 全部 React 组件
└── Server/                     # 后端 Express
    ├── Dockerfile              # node:18-alpine
    ├── server.js               # 入口
    ├── config/                 # 数据库 + JWT 配置
    ├── middleware/             # authMiddleware.js
    ├── models/                 # User.js + Product.js
    ├── controllers/           # user / product / ai / cart
    ├── routes/                # user / product / ai / cart / upload
    └── services/              # aiService.js
```

---

## API 概览

| 模块 | 路径 | 主要接口 |
|------|------|---------|
| 用户 | `/api/users` | 注册、登录、CRUD |
| 商品 | `/api/products` | CRUD、购买、推荐、搜索筛选分页 |
| 购物车 | `/api/cart` | 添加、移除、修改数量、清空、结算 |
| AI | `/api/ai` | 生成描述、推荐分类 |
| 上传 | `/api/upload` | 图片上传（multer） |

---

## ⚠️ 注意事项

- **服务器仅 2GB 内存** — 不要在服务器上 `npm run build`，会 OOM
- **前端构建** — 在本地执行 `cd Client && npm run build`，只上传 `build/` 文件夹
- **MongoDB 密码** — `@` 字符在 URI 中需编码为 `%40`
- **图片持久化** — `Server/uploads/` 通过 Docker bind mount 持久化
- **图片访问** — Nginx 代理 `/uploads/` → 后端，前端直接用 `/uploads/xxx.jpg`
- **bcrypt 替换** — 因内存限制，使用 bcryptjs + 8 轮盐代替 bcrypt 12 轮

---

## 许可证

MIT License
