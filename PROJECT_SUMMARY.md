# Second-Hand 二手交易平台 - 项目完整文档

## 技术栈
- **前端**: React 18 + Tailwind CSS + React Router v6
- **后端**: Node.js + Express 4
- **数据库**: MongoDB 7.0 (Mongoose)
- **认证**: JWT (jsonwebtoken + bcrypt)
- **部署**: Docker Compose (3个容器)
- **AI**: 通义千问 Qwen API (dashscope)

## 服务器信息
- **域名**: `freevian.top`
- **前端地址**: `http://freevian.top:5000`
- **后端地址**: `http://freevian.top:8000`
- **MongoDB**: 容器内 `second-hand-mongodb:27017`
- **GitHub**: `https://github.com/Y1221ting/Second-Hand-Platform.git`

---

## 项目目录结构

```
d:\Second-Hand-main\
├── docker-compose.yml          # Docker编排（3个服务）
├── .gitignore                  # 忽略 .env, node_modules, build
├── Client/                     # 前端 React
│   ├── Dockerfile              # 使用 nginx:alpine，直接 COPY build/
│   ├── nginx.conf              # 代理 /api/ → backend:8000
│   ├── .gitignore              # 忽略 /node_modules, /build, .env
│   ├── package.json
│   ├── public/
│   └── src/
│       ├── App.js
│       ├── index.js
│       ├── index.css           # Tailwind CSS
│       ├── context/
│       │   └── authContext.js  # 用户认证上下文
│       └── components/
│           ├── Home/
│           │   ├── index.js        # 商品列表页
│           │   ├── Filters.js      # 筛选组件
│           │   ├── ProductList.js  # 商品卡片列表
│           │   └── Pagination.js   # 分页
│           ├── Product_Details/
│           │   ├── ProductDetails.js  # 商品详情
│           │   ├── Recommendations.js # 猜你喜欢推荐
│           │   ├── Dialog.js         # 购买确认弹窗
│           │   └── FormField.js      # 表单字段组件
│           ├── Profile/
│           │   ├── UserDetails.js    # 用户信息展示
│           │   ├── ProductList.js    # 用户商品列表
│           │   ├── UserField.js      # 用户字段编辑
│           │   └── ConfirmDialog.js  # 删除确认弹窗
│           ├── Utility/
│           │   ├── Navbar.js
│           │   ├── Footer.js
│           │   ├── Loading.js
│           │   ├── DrawerMenu.js
│           │   └── ProductCard.js
│           ├── AddProduct.js     # 发布商品（含AI功能）
│           ├── EditProduct.js    # 编辑商品
│           ├── Edit_Product/
│           │   └── ProductForm.js
│           ├── Home.js
│           ├── Landing.js
│           ├── Login.js
│           ├── Register.js
│           ├── ProductPage.js
│           └── UserProfile.js    # 个人资料（含购买记录）
└── Server/                     # 后端 Express
    ├── Dockerfile              # node:18-alpine
    ├── package.json
    ├── server.js               # 入口文件
    ├── config/
    │   ├── db.js               # MongoDB连接
    │   └── auth.js             # JWT + bcrypt工具
    ├── middleware/
    │   └── authMiddleware.js   # JWT认证中间件
    ├── models/
    │   ├── User.js             # 用户模型
    │   └── Product.js          # 商品模型
    ├── controllers/
    │   ├── userController.js   # 用户CRUD
    │   ├── productController.js# 商品CRUD + 购买 + 推荐
    │   ├── aiController.js     # AI接口
    │   └── cartController.js   # 购物车CRUD
    ├── routes/
    │   ├── userRoutes.js       # /api/users
    │   ├── productRoutes.js    # /api/products（含推荐 /recommendations）
    │   ├── aiRoutes.js         # /api/ai
    │   ├── cartRoutes.js       # /api/cart
    │   └── uploadRoutes.js     # /api/upload
    └── services/
        └── aiService.js        # 通义千问API调用
```

---

## 后端 API 接口

### 用户 `/api/users`
| 方法 | 路径 | 认证 | 说明 |
|------|------|------|------|
| POST | `/api/users/register` | ❌ | 注册 |
| POST | `/api/users/login` | ❌ | 登录 |
| GET | `/api/users/` | ❌ | 获取所有用户 |
| GET | `/api/users/:userId` | ❌ | 获取用户详情 |
| PUT | `/api/users/:userId` | ✅ | 更新用户 |
| DELETE | `/api/users/:userId` | ❌ | 删除用户 |

### 商品 `/api/products`
| 方法 | 路径 | 认证 | 说明 |
|------|------|------|------|
| GET | `/api/products/` | ❌ | 获取所有商品（分页/搜索/筛选/排序） |
| GET | `/api/products/recommendations` | ❌ | 获取推荐商品（参数：excludeId/category/college/sellerId） |
| GET | `/api/products/:id` | ❌ | 获取商品详情 |
| GET | `/api/products/user/:userId` | ❌ | 获取用户发布的商品 |
| GET | `/api/products/purchased/:userId` | ❌ | 获取用户购买的商品 |
| POST | `/api/products/` | ✅ | 创建商品 |
| PUT | `/api/products/:id` | ✅ | 更新商品 |
| DELETE | `/api/products/:id` | ✅ | 删除商品 |
| POST | `/api/products/:id/purchase` | ✅ | 购买商品 |
| PUT | `/api/products/:id/update-status` | ✅ | 更新商品状态 |
| POST | `/api/products/:id/images` | ✅ | 添加图片 |
| DELETE | `/api/products/:id/images/:index` | ✅ | 删除图片 |
| POST | `/api/products/:id/specifications` | ✅ | 添加规格 |
| PUT | `/api/products/:id/specifications/:specId` | ✅ | 更新规格 |
| DELETE | `/api/products/:id/specifications/:specId` | ✅ | 删除规格 |

### AI `/api/ai`
| 方法 | 路径 | 认证 | 说明 |
|------|------|------|------|
| POST | `/api/ai/generate-description` | ❌ | AI生成商品描述 |
| POST | `/api/ai/recommend-category` | ❌ | AI推荐分类 |

### 购物车 `/api/cart`
| 方法 | 路径 | 认证 | 说明 |
|------|------|------|------|
| GET | `/api/cart/` | ✅ | 获取购物车（populate 商品详情） |
| POST | `/api/cart/:productId` | ✅ | 添加商品到购物车（可选 quantity，默认1） |
| PUT | `/api/cart/:productId` | ✅ | 修改购物车商品数量 |
| DELETE | `/api/cart/:productId` | ✅ | 从购物车移除商品 |
| DELETE | `/api/cart/` | ✅ | 清空购物车 |
| POST | `/api/cart/checkout/all` | ✅ | 批量结算购物车 |

### 上传 `/api/upload`
| 方法 | 路径 | 认证 | 说明 |
|------|------|------|------|
| POST | `/api/upload/` | ✅ | 上传图片（最多9张，单张上限20MB） |

---

## 数据模型

### User 模型
```javascript
{
  email: String,        // 必填，唯一，邮箱格式验证
  password: String,     // 必填，最少6位，bcrypt加密
  fullName: String,     // 必填
  college: String,      // 必填
  phoneNo: String,      // 必填，11位数字
  address: String,      // 必填（省市区+详情合并）
  cart: [{              // 购物车
    productId: ObjectId, // 商品ID
    quantity: Number,    // 数量
    addedAt: Date        // 添加时间
  }]
}
// timestamps: true — 自动记录 createdAt 和 updatedAt
```

### Product 模型
```javascript
{
  name: String,                    // 必填
  uploadedBy: { id, name, college }, // 卖家信息
  category: String,                // 枚举10种
  description: String,             // 必填
  price: Decimal128,               // 必填，>0
  images: [String],                // 图片路径数组 /uploads/xxx.jpg
  specifications: [{ key, value }], // 规格参数
  status: String,                  // "unsold" | "sold" | "sold_out"
  quantity: Number,                // 库存，默认1
  purchasedBy: { id, name, college }, // 购买者
  createdAt: Date
}
```

### 商品分类（10种）
```
electronics  → 电子产品
furniture    → 家具
clothing     → 服装鞋帽
books        → 书籍教材
sports       → 运动户外
food         → 食品生鲜
transportation → 交通工具
beauty       → 美妆个护
home         → 家居日用
other        → 其他
```

---

## 代码规范

### 前端规范
1. **API请求**: 使用相对路径 `/api/...`（nginx代理转发）
2. **认证**: JWT token 存 `localStorage("token")`，请求头 `Authorization: Bearer ${token}`
3. **用户信息**: 存 `localStorage("user")`，通过 `useAuth()` 获取
4. **样式**: Tailwind CSS，颜色主色调 `yellow-500`
5. **图标**: `react-icons` (FaMagic, FaEdit, FaShoppingCart, FaTimes等)
6. **路由**: React Router v6，`useNavigate`, `useParams`, `Link`
7. **状态管理**: React Context (authContext)
8. **构建**: `npm run build` → 生成 `build/` 文件夹

### 后端规范
1. **错误处理**: try-catch，返回 `{ message: "..." }` 或 `{ error: "..." }`
2. **认证中间件**: `authMiddleware` 解析JWT，`req.user` 挂载用户对象
3. **密码**: bcryptjs 8轮加密（服务器2GB限制），JWT密钥从环境变量 `JWT_SECRET` 读取
4. **图片**: 文件存储（multer → `Server/uploads/`），数据库只存路径，请求体限制10mb
5. **价格**: MongoDB Decimal128 类型，后端 `Number(productObj.price) || 0` 转数字

---

## Docker 部署

### docker-compose.yml 关键配置
```yaml
# 3个服务：mongodb, backend, frontend
# 网络：second-hand-network (bridge)
# 数据卷：mongodb_data（持久化MongoDB数据）

# 密钥通过 .env 文件注入（.gitignore，不提交到 Git）
# .env 文件包含：MONGO_INITDB_ROOT_PASSWORD, QWEN_API_KEY, JWT_SECRET, MONGODB_URI_FULL
# Docker Compose 自动读取同目录下的 .env 文件做变量替换

# 后端环境变量
MONGODB_URI=${MONGODB_URI_FULL}
PORT=8000
CLIENT_URL=http://freevian.top:5000
QWEN_API_KEY=${QWEN_API_KEY}
JWT_SECRET=${JWT_SECRET}
```

### 部署命令
```bash
# 本地构建前端
cd Client && npm run build && cd ..

# 推送代码
git add .
git commit -m "描述"
git push

# 服务器部署
ssh root@8.162.24.145
cd /www/wwwroot/Second-Hand-main
git pull
docker compose up -d --build

# 单独部署某个服务
docker compose up -d --build backend
docker compose up -d --build frontend
```

### ⚠️ 注意事项
- 服务器内存2GB，**不要在服务器上构建前端**（会卡死）
- 前端Dockerfile已改为直接使用本地构建的 `build/` 文件夹
- 前端通过 nginx 代理 `/api/` 和 `/uploads/` 到后端，无需CORS
- MongoDB数据通过Docker卷持久化，重启不会丢失
- 上传的图片存在 `Server/uploads/`（已被 bind mount 持久化，重启不丢失）
- nginx 配置同时代理了 `/uploads/` 到后端，前端可直接用 `/uploads/xxx.jpg` 访问图片
- bcrypt 替换为 bcryptjs + 盐轮数 8 以适配 2GB 内存限制

---

### 前端性能优化（v1.18.0）
- **代码分割** — `React.lazy` + `Suspense` 路由级懒加载 UserProfile/AddProduct/EditProduct/Cart；Login/Register 保持同步加载（高频入口）
- **ErrorBoundary 兜底** — chunk 加载失败时显示"页面加载失败"界面 + 刷新按钮
- **Nginx Gzip** — 启用 gzip，超过 1KB 的 JS/CSS/JSON 自动压缩
- **Nginx 强缓存** — JS/CSS（带 content hash）缓存 1 年 + `immutable`；图片缓存 30 天
- **原生懒加载** — `<img loading="lazy">` 替代自定义 IntersectionObserver，首屏图片不再被 JS 推迟下载
- **CLS 修复** — 商品图片设 `width`/`height` + `aspectRatio` 容器，消除图片加载后的布局偏移
- **无障碍修复** — 按钮对比度（黄底白字→黄底深灰字 2.3:1→5.5:1）、表单标签关联、aria-label、`<main>` landmark

---

## 当前已完成的功能

1. ✅ **用户注册/登录** - JWT认证
2. ✅ **商品发布** - 含图片（改用文件存储，不再存 base64）、规格参数
3. ✅ **商品列表** - 搜索、筛选（分类/学校/价格）、排序
4. ✅ **商品详情** - 图片、描述、规格、购买按钮
5. ✅ **购买功能** - 减库存、记录购买者、标记售罄
6. ✅ **个人资料** - 编辑信息、查看发布/购买记录
7. ✅ **AI生成描述** - 通义千问API
8. ✅ **AI推荐分类** - 通义千问API
9. ✅ **界面中文** - 全界面已汉化
10. ✅ **商品分类** - 扩展为10种
11. ✅ **购物车系统** - 添加/移除/修改数量/清空/批量结算
12. ✅ **商品推荐** - 规则引擎（同类目→同校→同卖家→同校用户→最新兜底）
13. ✅ **学院模糊搜索** - 支持 $regex 模糊匹配
14. ✅ **搜索优化** - 关键词搜索保留输入内容，空搜索重置；分页页码绑定 URL 参数刷新不丢失
15. ✅ **价格上限 9999.9** - 前后端双重校验，角为单位，超出内联提示
16. ✅ **搜索范围优化** - 从搜索 name+description 改为 name+学校+发布者
17. ✅ **移动端搜索** - Navbar 右侧搜索图标按钮，点击展开输入框
18. ✅ **商品卡片 SPA 跳转** - `<a>` 改为 `<Link>`，无整页刷新
19. ✅ **删除用户级联标记** - 删除用户时自动标记其商品为 inactive
20. ✅ **密钥管理安全** - 全部密钥移入 .env（.gitignore），docker-compose 用 ${变量} 引用
21. ✅ **API 不返回密码哈希** - 登录/列表/详情接口均已移除 password 字段
22. ✅ **auth.js 返回值扁平化** - `createSession` 直接返回 token 字符串，响应变为 `{ token: "xxx" }`

## 待优化/已知问题

1. **购买记录 `purchasedBy` 单对象限制** - Product 模型的 `purchasedBy` 是单个嵌入子文档，多次购买会覆盖旧记录（当前场景下可接受）
2. **商品推荐** - 阶段一为规则引擎，后续可升级为协同过滤或基于用户行为的学习模型
3. **图片底层存储** - 当前本地文件存储（`Server/uploads/`），后续可迁移到对象存储（OSS）

---

## 安全与稳定性审计

### ✅ 已修复汇总

| 问题 | 危险等级 | 说明 |
|------|---------|------|
| **DELETE /api/users/:userId 无认证** | 🔴致命 | 已加 authMiddleware + 本人校验 |
| **PUT /api/users/:userId 越权** | 🔴致命 | 已加 userId 比对 |
| **JWT 密钥两处硬编码** | 🟡中 | 统一从 config/auth.js 引入 + 环境变量 |
| **Product 索引未生效** | 🟡中 | 已调整顺序并新增 createdAt 排序索引 |
| **购买弹窗数据丢失** | 🟡中 | 已补上 body 发送 |
| **购买竞态条件** | 🔴致命 | 已改为 findOneAndUpdate + $inc 原子操作 |
| **base64 图片撑爆 16MB** | 🔴致命 | 已改为文件存储 |
| **updateProductById 缺少校验** | 🟢低 | 已补 runValidators: true |
| **loginUser 返回密码哈希** | 🟡中 | toObject() 后 delete password |
| **getAllUsers/getUserById 无密码保护** | 🟡中 | 已加 .select("-password") 及返回前删除 |
| **docker-compose 密钥硬编码** | 🟡中 | 移入 .env（.gitignore），${变量} 引用 |
| **body-parser 50MB DoS 风险** | 🟡中 | 降为 10MB |
| **删除用户→商品变孤儿** | 🟡中 | 级联标记为 inactive |
| **auth.js 返回值嵌套** | 🟡中 | createSession 直接返回字符串，响应扁平化 |

### ⚠️ 需注意

| 风险 | 等级 | 解释 |
|------|------|------|
| **Docker volume 覆盖 node_modules** | 🟡中 | `./Server:/app` 会覆盖容器内 node_modules |
| **MongoDB 密码含特殊字符** | 🟡中 | 密码中 `@` 在 URI 中需编码为 `%40` |
| **无数据库连接池监控** | 🟢低 | 后端崩溃时连接不会自动释放 |

### 未来建议

1. **迁移图片到对象存储（OSS/COS）** — 当图片量级增长时
2. **移除 Docker bind mount** — 生产环境用 COPY 而非 volumes
3. **商品推荐升级** — 从规则引擎升级为协同过滤