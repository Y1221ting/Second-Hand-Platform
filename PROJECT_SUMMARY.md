# Second-Hand 二手交易平台 - 项目完整文档

## 技术栈
- **前端**: React 18 + Tailwind CSS + React Router v6
- **后端**: Node.js + Express 4
- **数据库**: MongoDB 7.0 (Mongoose)
- **认证**: JWT (jsonwebtoken + bcrypt)
- **部署**: Docker Compose (3个容器)
- **AI**: 通义千问 Qwen API (dashscope)

## 服务器信息
- **IP**: `8.162.24.145`
- **前端地址**: `http://8.162.24.145:5000`
- **后端地址**: `http://8.162.24.145:8000`
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
    │   ├── productController.js# 商品CRUD + 购买
    │   └── aiController.js     # AI接口
    ├── routes/
    │   ├── userRoutes.js       # /api/users
    │   ├── productRoutes.js    # /api/products
    │   └── aiRoutes.js         # /api/ai
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
| GET | `/api/products/` | ❌ | 获取所有商品 |
| GET | `/api/products/:id` | ❌ | 获取商品详情 |
| GET | `/api/products/user/:userId` | ❌ | 获取用户发布的商品 |
| GET | `/api/products/purchased/:userId` | ❌ | 获取用户购买的商品 |
| POST | `/api/products/` | ✅ | 创建商品 |
| PUT | `/api/products/:id` | ✅ | 更新商品 |
| DELETE | `/api/products/:id` | ✅ | 删除商品 |
| POST | `/api/products/:id/purchase` | ✅ | 购买商品 |
| PUT | `/api/products/:id/update-status` | ✅ | 更新商品状态 |

### AI `/api/ai`
| 方法 | 路径 | 认证 | 说明 |
|------|------|------|------|
| POST | `/api/ai/generate-description` | ❌ | AI生成商品描述 |
| POST | `/api/ai/recommend-category` | ❌ | AI推荐分类 |

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
  address: String       // 必填
}
```

### Product 模型
```javascript
{
  name: String,                    // 必填
  uploadedBy: { id, name, college }, // 卖家信息
  category: String,                // 枚举10种
  description: String,             // 必填
  price: Decimal128,               // 必填，>0
  images: [String],                // base64数组
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
3. **密码**: bcrypt 12轮加密，JWT密钥 `"your-secret-key"`
4. **图片**: base64格式存储，请求体限制50mb
5. **价格**: MongoDB Decimal128 类型

---

## Docker 部署

### docker-compose.yml 关键配置
```yaml
# 3个服务：mongodb, backend, frontend
# 网络：second-hand-network (bridge)
# 数据卷：mongodb_data（持久化MongoDB数据）

# 后端环境变量
MONGODB_URI=mongodb://admin:%40Yt1221wz@second-hand-mongodb:27017/second-hand?authSource=admin
PORT=8000
CLIENT_URL=http://8.162.24.145:5000
QWEN_API_KEY=sk-8b143f7aef8a4d16ad7d00365486d2f6

# 前端构建参数
REACT_APP_BASE_URL=http://8.162.24.145:8000
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

### 注意事项
- 服务器内存2GB，**不要在服务器上构建前端**（会卡死）
- 前端Dockerfile已改为直接使用本地构建的 `build/` 文件夹
- 前端通过 nginx 代理 `/api/` 和 `/uploads/` 到后端，无需CORS
- MongoDB数据通过Docker卷持久化，重启不会丢失
- 上传的图片存在 `Server/uploads/`（已被 bind mount 持久化，重启不丢失）
- nginx 配置同时代理了 `/uploads/` 到后端，前端可直接用 `/uploads/xxx.jpg` 访问图片

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

## 待优化/已知问题

1. **Dialog.js 404错误** - 购买弹窗获取用户信息时可能404（`/api/users/:id`），需要确认用户ID有效性
2. **购买记录** - 新功能刚上线，旧商品的 `purchasedBy` 字段为空
3. **图片存储** - ✅ 已从 base64 改为本地文件存储（`Server/uploads/`），数据库只存 `/uploads/xxx.jpg` 路径，大幅降低 MongoDB 压力。后续可迁移到对象存储（OSS）
4. **分页** - 商品列表目前是前端分页，商品多时建议改为后端分页
5. **搜索** - 目前是前端搜索，建议改为后端搜索（MongoDB索引）

---

## 🚨 数据库崩溃高危原因（已修复 + 仍需注意）

### ✅ 已修复（本次修改）

| 问题 | 危险等级 | 说明 |
|------|---------|------|
| **DELETE /api/users/:userId 无认证** | 🔴致命 | 任何人可删除任意用户，已加 authMiddleware + 本人校验 |
| **PUT /api/users/:userId 越权** | 🔴致命 | 用户A登录后可改用户B资料，已加 userId 比对 |
| **JWT 密钥两处硬编码** | 🟡中 | auth.js 和 authMiddleware.js 各有 fallback，已统一从 config/auth.js 引入 |
| **Product 索引未生效** | 🟡中 | ProductSchema.index() 定义在 model() 之后，已调整顺序并新增 createdAt 排序索引 |
| **购买弹窗数据丢失** | 🟡中 | Dialog 表单数据收集后未发送到后端，已补上 body: JSON.stringify(userData) |
| **购买竞态条件** | 🔴致命 | 多人同时购买最后一件商品会超卖（quantity 变负），已改为 findOneAndUpdate + $inc 原子操作 |
| **base64 图片撑爆 16MB** | 🔴致命 | 商品图片直接存 MongoDB，多图超限即崩溃，已改为文件存储，数据库只存路径 |
| **updateProductById 缺少校验** | 🟢低 | findByIdAndUpdate 未启用 runValidators，已补上 |

### ⚠️ 仍需注意的数据库风险

| 风险 | 等级 | 解释 |
|------|------|------|
| **base64 图片超限** | 🔴致命 | 单个 MongoDB document 上限 16MB，多张大 base64 图片容易撑爆。商品发布时报错 "BulkWriteError: BSONObj size exceeds limit" 就是这个原因 |
| **并发购买竞态** | 🔴致命 | `purchaseProduct` 先查后改，没有原子操作。两人同时点"立即购买"可能都成功，导致 quantity 变负数或重复扣库存 |
| **Docker volume 覆盖 node_modules** | 🟡中 | `./Server:/app` 挂载会把宿主机目录覆盖进容器，如果宿主机没有 node_modules 或版本不一致，后端启动失败导致 MongoDB 连接泄漏 |
| **MongoDB 密码含特殊字符** | 🟡中 | 密码 `@Yt1221wz` 中的 `@` 在 URI 中用 `%40` 编码，如果忘记编码直接拼入 URI 会导致连接失败 |
| **getAllUsers / getUserById 无认证** | 🟡中 | 任何人都能枚举所有用户信息（含邮箱、电话），存在数据泄露风险 |
| **无数据库连接池监控** | 🟢低 | 后端崩溃时 MongoDB 连接不会自动释放，长期运行可能耗尽连接数 |

### 🛠 建议优先修复

1. **迁移图片到对象存储（OSS/COS）** — 最核心，当前项目最可能的崩溃元凶
2. **购买加事务/原子操作** — `findByIdAndUpdate` 结合 `$inc: {quantity: -1}`，一行原子操作搞定
3. **getAllUsers 加认证** — 只在管理员功能开放
4. **移除 Docker bind mount** — 生产环境用 `COPY` 而非 `volumes: - ./Server:/app`