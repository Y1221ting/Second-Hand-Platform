# Second-Hand 二手交易平台 — 学习指南

> 用于比赛线下演示，助你全面掌握该项目

---

## 目录

1. [项目概览](#1-项目概览)
2. [技术栈详解](#2-技术栈详解)
3. [架构与数据流](#3-架构与数据流)
4. [前端详解](#4-前端详解)
5. [后端详解](#5-后端详解)
6. [数据库模型](#6-数据库模型)
7. [认证流程](#7-认证流程)
8. [关键功能实现](#8-关键功能实现)
9. [Docker 部署架构](#9-docker-部署架构)
10. [学习路线图](#10-学习路线图)
11. [常见面试/演示问题](#11-常见面试演示问题)

---

## 1. 项目概览

**Second-Hand** 是一个面向大学生的校园二手交易电子商务平台。核心功能：

| 功能 | 说明 |
|------|------|
| 用户注册/登录 | JWT 认证，邮箱+密码 |
| 商品发布 | 名称、分类、描述、价格、图片、规格参数 |
| 商品浏览 | 搜索、分类/学校/价格筛选、排序、分页 |
| 商品详情 | 图片、描述、规格、库存、购买按钮 |
| 购买功能 | 原子操作减库存，防超卖 |
| 个人资料 | 编辑信息、查看发布/购买记录 |
| AI 辅助 | 通义千问 API 生成描述、推荐分类 |

**线上地址：** http://freevian.top:5000  
**GitHub：** https://github.com/Y1221ting/Second-Hand-Platform.git

---

## 2. 技术栈详解

### 前端

| 技术 | 用途 | 关键点 |
|------|------|--------|
| **React 18** | UI 框架 | 函数组件 + Hooks |
| **React Router v6** | 路由 | `<Routes>`, `<Route>`, `useNavigate`, `useParams`, `Link` |
| **Tailwind CSS 3** | 样式 | 原子化 CSS，`className` 直接写样式，主色调 `yellow-500` |
| **react-icons** | 图标 | `FaMagic`, `FaEdit`, `FaShoppingCart`, `FaUser`, `FaTimes` |
| **@uiball/loaders** | 加载动画 | `NewtonsCradle` 组件 |
| **Fetch API** | HTTP 请求 | 使用相对路径 `/api/...`，由 Nginx 代理转发 |

### 后端

| 技术 | 用途 | 关键点 |
|------|------|--------|
| **Express 4** | Web 框架 | 路由 + 中间件 |
| **Mongoose 7** | MongoDB ODM | Schema 定义、数据校验、查询 |
| **bcryptjs** | 密码加密 | 8 轮 salt（服务器 2GB 内存限制，使用 bcryptjs 替代 bcrypt） |
| **jsonwebtoken** | JWT 令牌 | `sign({ userId }, SECRET, { expiresIn: "1d" })` |
| **multer** | 文件上传 | 磁盘存储到 `Server/uploads/` |
| **axios** | HTTP 客户端 | 后端调用通义千问 API |

### 部署

| 技术 | 用途 | 关键点 |
|------|------|--------|
| **Docker Compose** | 容器编排 | 3 个服务：mongodb, backend, frontend |
| **Nginx** | 反向代理 | `/api/` → backend:8000，`/uploads/` → backend:8000 |
| **阿里云 ECS** | 服务器 | 2GB RAM，域名: `freevian.top` |
| **MongoDB** | 数据库 | Docker 容器内，密码 `@Yt1221wz`（URI 中`@`编码为`%40`） |

---

## 3. 架构与数据流

### 请求流程

```
浏览器 → Nginx (端口 5000) → 静态页面 /index.html
                         → /api/xxx → backend:8000 → MongoDB
                         → /uploads/xxx → backend:8000 → 文件系统
```

### 数据流示例：浏览商品

```
1. 用户打开 /home
2. React 渲染 Navbar + ProductsList + Footer
3. ProductsList 调用 fetch('/api/products/?page=1&limit=20&sort=latest')
4. Nginx 代理到 backend:8000
5. Express 路由 GET /api/products/ → getAllProducts()
6. Mongoose 查询 MongoDB → Product.find().sort().skip().limit()
7. 返回 JSON → React 渲染 ProductCard 列表
```

### 数据流示例：购买商品

```
1. 用户点击"立即购买"
2. Dialog 弹窗填写收货信息
3. 调用 fetch('/api/products/:id/purchase', POST, JWT Token)
4. 后端 findOneAndUpdate({ $inc: { quantity: -1 } }) — 原子操作
5. 返回成功 → 刷新商品详情
```

---

## 4. 前端详解

### 路由结构 (`App.js`)

```
/                   → Landing.js       (着陆页)
/home               → Home.js          (商品列表)
/product/:id        → ProductPage.js   (商品详情)
/register           → Register.js      (注册)
/login              → Login.js         (登录)

// 以下路由受 ProtectedRoute 保护，未登录自动跳 /login
/add-product        → AddProduct.js    (发布商品)
/product/:id/edit   → EditProduct.js   (编辑商品)
/profile/:id        → UserProfile.js   (个人资料)
```

### 组件层级

```
App
├── Landing.js                      # 着陆页，背景图 + 品牌介绍
├── Login.js / Register.js          # 登录/注册表单
├── Home.js
│   ├── Navbar                      # 导航栏：Logo + 用户头像/登录按钮
│   ├── ProductsList (Home/index.js)
│   │   ├── Filters.js              # 搜索框、学校、分类、排序、价格
│   │   ├── ProductList.js          # ProductCard 列表
│   │   └── Pagination.js           # 分页按钮
│   └── Footer                      # 页脚链接
├── ProductPage.js
│   └── ProductDetails.js           # 图片、价格、描述、规格、购买 + 推荐
│       ├── Recommendations.js      # 猜你喜欢推荐（底部）
│       └── Dialog.js               # 购买确认弹窗（省-市联动）
│           └── FormField.js        # 通用表单字段
├── AddProduct.js                   # 发布商品（含AI功能）
├── EditProduct.js
│   └── ProductForm.js              # 编辑表单（复用）
├── UserProfile.js
│   ├── UserDetails.js              # 用户信息展示/编辑
│   │   └── UserField.js            # 用户字段组件
│   ├── ProductList.js              # 商品列表（含删除按钮）
│   └── ConfirmDialog.js            # 删除确认弹窗
└── Utility/
    ├── Navbar.js
    ├── Footer.js
    ├── Loading.js
    ├── DrawerMenu.js               # 侧边菜单
    └── ProductCard.js              # 商品卡片（懒加载）
```

### 认证上下文 (`authContext.js`)

```javascript
// 提供全局认证状态
const { user, login, logout, isAuthenticated } = useAuth();

// user 对象：{ id, name, college } — 来自 localStorage
// login(user) — 保存到 localStorage 和 state
// logout() — 清除 localStorage 的 user 和 token
// isAuthenticated — !!user 的布尔值
```

### 关键前端模式

| 模式 | 实现位置 | 说明 |
|------|---------|------|
| **图片懒加载** | ProductCard.js | IntersectionObserver，出现在视口200px内才加载 |
| **搜索防抖** | Home/index.js | 800ms 防抖 + composition 事件（拼音输入不触发），Enter 立即搜索 |
| **搜索范围** | ProductController | $regex 模糊匹配 name + 学校 + 发布者，不搜描述 |
| **原子购买** | ProductDetails.js → Dialog.js | 先弹窗收集信息，再发送购买请求 |
| **权限保护** | ProtectedRoute.js | 未登录用户访问敏感路由自动跳转登录 |
| **图片压缩** | AddProduct.js | >1MB 图片自动压缩至 1920px 宽、80% JPEG 质量 |
| **分页** | Home/index.js + Pagination.js | 后端分页，每页20条，URL 参数绑定 |
| **商品推荐** | ProductDetails.js → Recommendations.js | 商品详情页底部"猜你喜欢"，静默模式 |
| **购物车** | Navbar / UserProfile | 双按钮布局，购物车数据在 UserProfile 挂载时即获取 |

---

## 5. 后端详解

### 入口 (`server.js`)

```javascript
// 中间件
app.use(bodyParser.json({ limit: "50mb" }))
app.use(cors({ origin: process.env.CLIENT_URL }))

// 路由
app.use("/api/users", userRoutes)
app.use("/api/products", productRoutes)
app.use("/api/ai", aiRoutes)
app.use("/api/cart", cartRoutes)   // 购物车
app.use("/api/upload", uploadRoutes)

// 静态文件服务
app.use("/uploads", express.static("uploads"))
```

### API 接口一览

#### 用户 `/api/users`

| 方法 | 路径 | 认证 | 说明 |
|------|------|------|------|
| POST | `/register` | ❌ | 注册（邮箱、密码、姓名、学校、电话、地址） |
| POST | `/login` | ❌ | 登录，返回 token + user |
| GET | `/` | ❌ | 获取所有用户 |
| GET | `/:userId` | ❌ | 获取单个用户 |
| PUT | `/:userId` | ✅ | 更新用户（只能改自己的） |
| DELETE | `/:userId` | ✅ | 删除用户（只能删自己的） |

#### 商品 `/api/products`

| 方法 | 路径 | 认证 | 说明 |
|------|------|------|------|
| GET | `/` | ❌ | 获取商品列表（分页、搜索、筛选、排序） |
| GET | `/recommendations` | ❌ | 获取推荐商品（参数：excludeId/category/college/sellerId） |
| GET | `/:id` | ❌ | 获取商品详情 |
| GET | `/user/:userId` | ❌ | 获取用户发布的商品 |
| GET | `/purchased/:userId` | ❌ | 获取用户购买的商品 |
| POST | `/` | ✅ | 创建商品 |
| PUT | `/:id` | ✅ | 更新商品（只能改自己的） |
| DELETE | `/:id` | ✅ | 删除商品 |
| POST | `/:id/purchase` | ✅ | 购买商品（原子操作） |
| PUT | `/:id/update-status` | ✅ | 更新商品状态 |
| POST | `/:id/images` | ✅ | 添加图片 |
| DELETE | `/:id/images/:index` | ✅ | 删除图片 |
| POST | `/:id/specifications` | ✅ | 添加规格 |
| PUT | `/:id/specifications/:specId` | ✅ | 更新规格 |
| DELETE | `/:id/specifications/:specId` | ✅ | 删除规格 |

#### AI `/api/ai`

| 方法 | 路径 | 认证 | 说明 |
|------|------|------|------|
| POST | `/generate-description` | ❌ | 通义千问生成商品描述 |
| POST | `/recommend-category` | ❌ | 通义千问推荐商品分类 |

#### 购物车 `/api/cart`

| 方法 | 路径 | 认证 | 说明 |
|------|------|------|------|
| GET | `/` | ✅ | 获取购物车（populate 商品详情） |
| POST | `/:productId` | ✅ | 添加商品到购物车（可选 quantity，默认1） |
| PUT | `/:productId` | ✅ | 修改购物车商品数量 |
| DELETE | `/:productId` | ✅ | 从购物车移除商品 |
| DELETE | `/` | ✅ | 清空购物车 |
| POST | `/checkout/all` | ✅ | 批量结算（原子操作减库存） |

#### 上传 `/api/upload`

| 方法 | 路径 | 认证 | 说明 |
|------|------|------|------|
| POST | `/` | ✅ | 上传图片（最多9张，单张上限20MB） |

### 后端关键代码

**JWT 认证中间件 (`authMiddleware.js`)：**
```javascript
// 1. 从 Header 取 Token: Authorization: Bearer xxx
// 2. jwt.verify(token, SECRET)
// 3. 查数据库找用户
// 4. req.user = user — 后续接口可用
```

**原子购买 (`purchaseProduct`)：**
```javascript
// 关键：findOneAndUpdate + $inc — 一行原子操作防超卖
const product = await Product.findOneAndUpdate(
  { _id, quantity: { $gt: 0 }, status: { $nin: ["sold_out"] } },
  { $inc: { quantity: -1 }, $set: { purchasedBy, status: "sold" } },
  { new: true }
)
// 如果 product 为 null，说明库存不足或已售罄
```

**商品列表分页 (`getAllProducts`)：**
```javascript
// 支持参数：page, limit, search, category, college, sort, minPrice, maxPrice
// 搜索使用 $regex 模糊匹配 name + uploadedBy.college + uploadedBy.name（不搜索 description）
// 学院筛选也是 $regex 模糊搜索（输入"师范"可搜到江西师范大学等）
// 列表只返回第一张图片减少传输量
// 结果分页，每页20条
```

**商品推荐 (`getRecommendations`)：**
```javascript
// 五级漏斗推荐引擎：
// 第1级：同类目下最新商品（排除自身）
// 第2级：同学校其他商品
// 第3级：同卖家其他商品
// 第4级：同学校用户发布的商品（未购买/已售罄也展示）
// 第5级：最新上架的商品（兜底）
// 每级最多返回4个商品，无数据自动降级到下一级
```

---

## 6. 数据库模型

### User 模型

```javascript
{
  email:     String,   // 必填，唯一，邮箱格式验证
  password:  String,   // 必填，bcryptjs 8轮加密
  fullName:  String,   // 必填
  college:   String,   // 必填（学校）
  phoneNo:   String,   // 必填，11位数字
  address:   String,   // 必填（省市区+详情合并）
  cart: [{             // 购物车
    productId: ObjectId, // 商品ID（ref: Product）
    quantity: Number,    // 数量，最少1
    addedAt: Date        // 添加时间
  }]
}, { timestamps: true }  // 自动记录 createdAt 和 updatedAt
```

### Product 模型

```javascript
{
  name:        String,       // 必填
  uploadedBy:  { id, name, college },  // 卖家信息（嵌入子文档）
  category:    String,       // 枚举10种：electronics/furniture/clothing/books/sports/food/transportation/beauty/home/other
  description: String,       // 必填
  price:       Decimal128,   // 必填，>0（MongoDB 高精度数字）
  images:      [String],     // 图片路径数组 /uploads/xxx.jpg
  specifications: [{ key, value }],  // 规格参数数组（嵌入子文档）
  status:      String,       // "unsold" | "sold" | "sold_out"
  quantity:    Number,       // 库存，默认1
  purchasedBy: { id, name, college },  // 购买者信息
  createdAt:   Date          // 创建时间，自动
}
```

### 关键设计决策

1. **Decimal128 类型**：价格使用 MongoDB 的 Decimal128 确保精度，但序列化 JSON 时会被转为 `{ $numberDecimal: "99.99" }`，后端用 `Number(productObj.price) || 0` 显式转换后再返回
2. **嵌入子文档**：`uploadedBy` 和 `specifications` 使用嵌入式子文档（非引用），读性能好，但更新卖家信息时不同步
3. **搜索方式**：使用 `$regex` 模糊匹配进行搜索，不依赖 MongoDB 文本索引；搜索范围限定为 `name + uploadedBy.college + uploadedBy.name`，不含商品描述
4. **createdAt 索引**：按时间排序的索引，保证列表页性能

---

## 7. 认证流程

### 注册

```
1. 前端填写表单 → POST /api/users/register
2. 后端校验：密码长度 >= 6，邮箱不重复，手机号格式
3. bcrypt.hash(password, 12)
4. Mongoose 校验字段格式 → 保存
5. 返回 { message: "注册成功" }
```

### 登录

```
1. 前端填写邮箱+密码 → POST /api/users/login
2. 后端查邮箱是否存在
3. bcrypt.compare(password, hashedPassword)
4. jwt.sign({ userId }, SECRET, { expiresIn: "1d" })
5. 当前返回 { token: { token: "xxx" }, user: { ... } }  ← ⚠️ 已知问题：返回值嵌套
6. 前端需用 data.token.token 获取实际 Token（待修复为扁平结构 { token: "xxx" }）
   前端保存：localStorage.setItem("token", data.token.token)
                localStorage.setItem("user", JSON.stringify(data.user))
```

### 认证请求

```
// 所有需要登录的接口都在 Header 带 Token
headers: {
  Authorization: `Bearer ${localStorage.getItem("token")}`
}

// 后端解析 — authMiddleware
// 1. 取 Header 中的 Token
// 2. jwt.verify → 得到 userId
// 3. User.findById(userId) → req.user
// 4. next()
```

### 前端认证状态

```
// authContext.js — 全局 Context
// 页面刷新时从 localStorage 恢复用户信息
useEffect(() => {
  const storedUser = localStorage.getItem("user")
  if (storedUser) setUser(JSON.parse(storedUser))
}, [])

// isAuthenticated = !!user
// ProtectedRoute 根据 isAuthenticated 决定是否跳转登录
```

---

## 8. 关键功能实现

### 8.1 商品发布（带图片上传）

```
1. 用户选择图片 → compressImage() 自动压缩（>1MB）
2. POST /api/upload → multer 存到 Server/uploads/，返回 URL 数组
3. POST /api/products → 用 URL 数组创建商品
4. 规格参数需点击"添加"按钮后才加入数组，否则是空数组
```

### 8.2 商品列表搜索

```
1. 顶部搜索框输入关键词 → 800ms 防抖 / Enter 立即搜索 → 调用 API
2. 后端 MongoDB 使用 $regex 模糊匹配 name + uploadedBy.college + uploadedBy.name（不搜索 description）
3. 学院筛选改为 $regex 模糊搜索（输入"师范"即可搜到江西师范大学等）
4. 同时支持分类、学校、价格范围、排序筛选
5. 搜索后保留输入内容，空搜索跳转 /home 重置为全部商品
6. 分页页码绑定 URL 参数 ?page=，刷新不丢失
7. 结果每页20条，列表只返回第一张图片减少传输量
```

### 8.3 购买（防超卖）

```javascript
// 原子操作，防竞态
const product = await Product.findOneAndUpdate(
  {
    _id: req.params.id,
    quantity: { $gt: 0 },                   // 库存 > 0
    status: { $nin: ["sold_out", "inactive"] }, // 未售罄
    "uploadedBy.id": { $ne: req.user._id.toString() }, // 不能买自己的
  },
  {
    $inc: { quantity: -1 },                 // 减库存
    $set: { purchasedBy: {...}, status: "sold" },
  },
  { new: true }
)
```

### 8.4 购物车批量结算

```javascript
// cartController.checkoutCart — 遍历购物车逐个购买
// 对购物车中每个商品执行与单个购买相同的原子操作
// 部分成功/部分失败时，返回成功列表和失败原因
// 成功购买的商品从购物车移除，失败的保留
```

### 8.5 AI 辅助功能

```
// 调用通义千问 qwen-plus 模型
POST https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions

// 生描述：System Prompt 设定角色为"二手商品描述生成助手"
// 推荐分类：System Prompt 设定从10种分类中选择，只返回英文名
```

### 8.5 商品分类（10种）

| 分类 key | 中文名 |
|----------|--------|
| electronics | 电子产品 |
| furniture | 家具 |
| clothing | 服装鞋帽 |
| books | 书籍教材 |
| sports | 运动户外 |
| food | 食品生鲜 |
| transportation | 交通工具 |
| beauty | 美妆个护 |
| home | 家居日用 |
| other | 其他 |

---

## 9. Docker 部署架构

### 容器结构

```
second-hand-mongodb  ← MongoDB 7.0，数据卷 mongodb_data 持久化
second-hand-backend   ← Node 18，端口 8000，依赖 mongodb
second-hand-frontend  ← Nginx，端口 5000 → 80，依赖 backend
```

### docker-compose.yml 要点

```yaml
# 网络
networks:
  second-hand-network:  # 三个容器在同一个 bridge 网络

# 数据持久化
volumes:
  mongodb_data:         # MongoDB 数据

# 后端环境变量
MONGODB_URI: mongodb://admin:%40Yt1221wz@second-hand-mongodb:27017/second-hand
JWT_SECRET: second-hand-jwt-secret-2024
QWEN_API_KEY: sk-8b143f7aef8a4d16ad7d00365486d2f6
```

### 部署步骤

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

### ⚠️ 注意事项

- **服务器只有 2GB 内存**，绝不能在服务器上构建前端（会 OOM）
- bcrypt 替换为 bcryptjs，盐轮数从 12 降至 8，适配低内存环境
- 前端 Dockerfile 直接 `COPY build/`，不跑 `npm run build`
- Nginx 代理了 `/api/` 和 `/uploads/` 到后端，前端直接用 `/api/xxx` 相对路径
- MongoDB 密码中的 `@` 在 URI 中需编码为 `%40`
- 图片存在 `Server/uploads/`（被 Docker bind mount 持久化）

---

## 10. 学习路线图

### 第一阶段：环境搭建（1天）

- [ ] 本地启动项目：`Client/npm install` → `Server/npm install`
- [ ] 理解 docker-compose.yml 三个服务的关系
- [ ] 本地构建前端：`cd Client && npm run build`
- [ ] 访问 http://localhost:5000 看效果

### 第二阶段：前端理解（2天）

- [ ] 阅读 `App.js` 路由，理解所有页面路径
- [ ] 阅读 `authContext.js`，理解认证状态管理
- [ ] 按组件树逐一阅读每个组件，理解 props 传递
- [ ] 重点理解 ProductCard.js 的懒加载、Home/index.js 的搜索防抖

### 第三阶段：后端理解（2天）

- [ ] 阅读 `server.js` 入口，理解中间件和路由挂载
- [ ] 阅读 `authMiddleware.js`，理解 JWT 验证
- [ ] 阅读 `productController.js`，理解全部 CRUD 和 `getRecommendations` 五级漏斗
- [ ] 阅读 `cartController.js`，理解购物车 6 个接口
- [ ] 重点理解 `purchaseProduct` 的原子操作和 `checkoutCart` 的批量结算

### 第四阶段：数据库（1天）

- [ ] 理解 User 和 Product 两个 Schema
- [ ] 理解 Decimal128、嵌入子文档、文本索引
- [ ] 学习用 `mongosh` 或 MongoDB Compass 连接数据库查询

### 第五阶段：部署理解（1天）

- [ ] 理解 Nginx 反向代理配置
- [ ] 理解 Docker Compose 网络和卷
- [ ] 模拟一次完整部署流程

### 第六阶段：模拟演示（1天）

- [ ] 准备演示脚本：注册 → 登录 → 发布商品 → 浏览 → 购买
- [ ] 展示 AI 功能：生成描述、推荐分类
- [ ] 准备回答技术问题

---

## 11. 常见面试/演示问题

### Q: 这个项目用了什么技术栈？
A: 前端 React 18 + Tailwind CSS + React Router v6，后端 Express + Mongoose，数据库 MongoDB 7.0，认证 JWT，部署 Docker Compose + Nginx，AI 通义千问 API。

### Q: 如何防止商品超卖？
A: 使用 MongoDB 的 `findOneAndUpdate` + `$inc: { quantity: -1 }` 原子操作。查询条件包含 `quantity: { $gt: 0 }`，同时只减库存一条记录。如果返回 null 说明库存不足，避免了先查后改的竞态条件。

### Q: 图片是怎么存储的？
A: 最初用 base64 存数据库导致 MongoDB 文档超 16MB 崩溃。现在改用 multer 上传到服务器的 `Server/uploads/` 目录，数据库只存 `/uploads/xxx.jpg` 路径字符串，Nginx 代理 `/uploads/` 到后端提供静态访问。

### Q: 搜索功能怎么实现的？
A: 前端 800ms 防抖延迟 + composition 事件（拼音输入不触发），Enter 键立即搜索。后端使用 `$regex` 模糊匹配搜索 `name`、`uploadedBy.college`（学校）、`uploadedBy.name`（发布者），不搜索描述。学院筛选也改为 `$regex` 模糊搜索（输入"师范"即可搜到江西师范大学等）。同时支持分类、学校、价格范围、排序等多个筛选条件组合。分页页码绑定 URL 参数 `?page=`，刷新不丢失。

### Q: 为什么前端要在本地构建？
A: 服务器只有 2GB 内存，`npm run build` 需要大量内存，在服务器上构建会导致 OOM 崩溃。所以前端在本地构建后，只上传 `build/` 文件夹到服务器。

### Q: JWT 认证过程是怎样的？
A: 登录时后端生成 `jwt.sign({ userId }, SECRET, { expiresIn: "1d" })` 返回前端。前端存 localStorage。后续请求在 Header 带 `Authorization: Bearer token`。后端 `authMiddleware` 解析 token → 查数据库 → `req.user` 供后续使用。

### Q: 商品价格为什么用 Decimal128？
A: 普通浮点数有精度问题（如 0.1+0.2≠0.3），涉及金钱必须精确。Decimal128 是 MongoDB 的高精度十进制类型。但序列化为 JSON 时会变成 `{ $numberDecimal: "99.99" }`，前端需用 toJSON transform 统一处理为字符串。

### Q: AI 功能怎么实现的？
A: 调用阿里云通义千问的 dashscope API。两个功能：1）根据商品名称和分类生成描述文字；2）根据商品名称推荐最合适的分类。使用 `qwen-plus` 模型，System Prompt 限定角色和输出格式。

### Q: 购物车是怎么实现的？
A: 购物车数据直接存在 User 模型的 `cart` 数组字段中（`[{productId, quantity, addedAt}]`），无需单独的购物车表。后端提供 6 个接口：获取（populate 商品详情）、添加（支持可选 quantity 参数）、修改数量、移除单个、清空、批量结算。结算时遍历购物车商品逐个执行原子购买操作，部分成功时返回成功列表和失败原因。

### Q: 商品推荐是怎么实现的？
A: 采用五级漏斗规则引擎（阶段一）：第1级同类目最新商品→第2级同校其他商品→第3级同卖家其他商品→第4级同校用户发布的商品→第5级最新上架兜底。每级最多返回4个，无数据自动降级。后期可升级为协同过滤或用户行为学习模型。

---

## 附录：项目文件速查

```
d:\Second-Hand-main\
├── docker-compose.yml          # Docker 编排
├── PROJECT_SUMMARY.md           # 项目文档（含API和模型说明）
├── CHANGELOG.md                 # 版本历史
├── Client/                      # 前端
│   ├── Dockerfile               # nginx:alpine
│   ├── nginx.conf               # 反向代理配置
│   ├── tailwind.config.js
│   └── src/
│       ├── App.js               # 路由配置
│       ├── index.js             # 入口
│       ├── index.css            # Tailwind 指令
│       ├── context/
│       │   └── authContext.js   # 认证上下文
│       └── components/          # 全部组件
└── Server/
    ├── Dockerfile               # node:18-alpine
    ├── server.js                # 入口
    ├── config/
    │   ├── db.js                # MongoDB 连接
    │   └── auth.js              # JWT + bcrypt
    ├── middleware/
    │   └── authMiddleware.js    # JWT 认证
    ├── models/
    │   ├── User.js              # 用户模型
    │   └── Product.js           # 商品模型
    ├── controllers/
    │   ├── userController.js
    │   ├── productController.js   # + 推荐引擎
    │   ├── aiController.js
    │   ├── cartController.js      # 购物车
    │   └── uploadController.js
    ├── routes/
    │   ├── userRoutes.js
    │   ├── productRoutes.js
    │   ├── aiRoutes.js
    │   ├── cartRoutes.js          # 购物车路由
    │   └── uploadRoutes.js
    └── services/
        └── aiService.js           # 通义千问调用
```
