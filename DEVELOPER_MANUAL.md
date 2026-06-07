# 校园二手交易平台 — 新手开发手册

> 最后更新：2026-06-02 | 当前版本：v2.5.0（审计修复版）

---

## 目录

1. [项目速览](#1-项目速览)
2. [环境搭建](#2-环境搭建)
3. [项目架构深入](#3-项目架构深入)
4. [开发工作流](#4-开发工作流)
5. [后端开发指南](#5-后端开发指南)
6. [前端开发指南](#6-前端开发指南)
7. [安全开发铁律](#7-安全开发铁律)
8. [API 速查](#8-api-速查)
9. [Docker 部署](#9-docker-部署)
10. [常见问题与排查](#10-常见问题与排查)
11. [附录：关键文件索引](#11-附录关键文件索引)

---

## 1. 项目速览

**Second-Hand** 是面向大学生的校园二手交易平台，MERN 全栈（MongoDB + Express + React + Node.js）。

| 信息 | 详情 |
|------|------|
| 线上地址 | http://freevian.top:5000 |
| GitHub | https://github.com/Y1221ting/Second-Hand-Platform.git |
| 服务器 | 阿里云 ECS，2核2GB |
| 部署方式 | Docker Compose（3 容器：MongoDB + Backend + Frontend） |
| 当前分支 | `refactor/v3-simplify` |

### 核心功能一览

| 模块 | 功能 |
|------|------|
| 用户系统 | 注册/登录/登出、JWT 认证、密码修改、资料编辑、账号注销 |
| 商品系统 | 发布/编辑/删除、搜索/筛选/排序、推荐、规格参数、多图上传 |
| 交易系统 | 直接购买（原子减库存）、购物车批量结算 |
| 订单系统 | 购买记录、售出记录、订单状态管理 |
| 内容治理 | 举报处理、违禁词过滤（50+关键词）、管理员后台 |
| 消息通知 | 系统通知、未读角标、管理员警告 |
| 求购广场 | 发布求购、浏览求购列表 |
| 安全防护 | NoSQL 注入防护、PII 脱敏、CSP 安全头、文件 magic bytes 验证、防爆库 maxlength、tokenVersion 吊销 |

---

## 2. 环境搭建

### 2.1 本地开发环境

```bash
# 1. 克隆项目
git clone https://github.com/Y1221ting/Second-Hand-Platform.git
cd Second-Hand-Platform
git checkout refactor/v3-simplify

# 2. 配置环境变量
cp .env.example .env   # 如果没有 .env.example，手动创建 .env
# 编辑 .env，至少设置：
#   JWT_SECRET=<64位随机hex>
#   MONGO_INITDB_ROOT_PASSWORD=<密码>
#   MONGODB_URI_FULL=mongodb://admin:<密码>@localhost:27017/second-hand?authSource=admin
#   CLIENT_URL=http://localhost:3000

# 3. 安装依赖
cd Server && npm install
cd ../Client && npm install

# 4. 启动 MongoDB（需要本地安装或 Docker）
docker run -d --name mongo-dev -p 27017:27017 \
  -e MONGO_INITDB_ROOT_USERNAME=admin \
  -e MONGO_INITDB_ROOT_PASSWORD=<密码> \
  mongo:7

# 5. 启动后端
cd Server
node server.js          # 或 npx nodemon server.js

# 6. 启动前端
cd Client
npm start               # 开发服务器 localhost:3000
```

### 2.2 关键软件版本

```
Node.js 18+
MongoDB 7.0
Docker Engine 20.10+
React 18
Express 4
Mongoose 7
```

---

## 3. 项目架构深入

### 3.1 目录结构

```
Second-Hand-main/
├── Server/                        # Express 后端（端口 8000）
│   ├── config/
│   │   ├── auth.js                # JWT 签发/验证 + bcrypt 密码哈希
│   │   ├── db.js                  # MongoDB 连接池
│   │   ├── bannedKeywords.js      # 违禁词列表 + checkBanned() 公共函数
│   │   ├── rateLimiter.js         # 登录/注册独立限流
│   │   └── majorMap.js            # 学院→专业映射表
│   ├── controllers/               # 业务逻辑层
│   │   ├── userController.js      # 注册/登录/登出/改密/CRUD
│   │   ├── productController.js   # 商品CRUD/搜索/推荐/购买/状态机
│   │   ├── cartController.js      # 购物车CRUD/批量结算
│   │   ├── orderController.js     # 订单创建/查询/状态更新
│   │   └── uploadController.js    # 图片上传+magic bytes验证
│   ├── middleware/
│   │   └── authMiddleware.js      # JWT认证 + tokenVersion校验 + optionalAuth
│   ├── models/                    # Mongoose Schema（6个模型）
│   │   ├── User.js                # 用户（含loginAttempts/lockUntil/tokenVersion）
│   │   ├── Product.js             # 商品（含SellerSchema/6个复合索引）
│   │   ├── Order.js               # 订单（含productSnapshot快照）
│   │   ├── Wanted.js              # 求购帖
│   │   ├── Report.js              # 举报
│   │   └── Message.js             # 系统通知
│   ├── routes/                    # 路由层（9个模块）
│   │   ├── userRoutes.js          # /api/users
│   │   ├── productRoutes.js       # /api/products
│   │   ├── cartRoutes.js          # /api/cart
│   │   ├── orderRoutes.js         # /api/orders
│   │   ├── wantedRoutes.js        # /api/wanted
│   │   ├── reportRoutes.js        # /api/reports
│   │   ├── adminRoutes.js         # /api/admin
│   │   ├── messageRoutes.js       # /api/messages
│   │   └── uploadRoutes.js        # /api/upload
│   ├── scripts/
│   │   └── seed.js                # 24条种子商品数据
│   ├── uploads/                   # 商品图片存储
│   ├── Dockerfile
│   └── server.js                  # 入口文件（中间件栈 + 路由挂载）
├── Client/                        # React 18 前端
│   ├── public/
│   ├── src/
│   │   ├── App.js                 # 路由定义 + 代码分割
│   │   ├── context/
│   │   │   ├── authContext.js     # 认证状态（login/logout/isAdmin）
│   │   │   └── NotificationContext.js  # 未读消息轮询
│   │   └── components/
│   │       ├── Home.js            # 首页（搜索+筛选+商品列表）
│   │       ├── AddProduct.js      # 发布商品（含求购Tab）
│   │       ├── EditProduct.js     # 编辑商品（上传→URL，非base64）
│   │       ├── ProductPage.js     # 商品详情
│   │       ├── Cart.js            # 购物车
│   │       ├── UserProfile.js     # 个人中心
│   │       ├── Warnings.js        # 消息通知
│   │       ├── Login.js / Register.js
│   │       ├── ProtectedRoute.js  # 路由守卫
│   │       ├── Admin/             # 管理后台（Dashboard/Reports/Products/Users）
│   │       ├── Home/              # 首页子组件
│   │       ├── Product_Details/   # 商品详情子组件
│   │       ├── Profile/          # 个人中心子组件
│   │       ├── Edit_Product/     # 编辑商品子组件
│   │       └── Utility/          # 通用组件（Navbar/Footer/ProductCard等）
│   ├── Dockerfile
│   ├── nginx.conf                 # Nginx静态缓存 + API代理
│   └── tailwind.config.js
├── docker-compose.yml             # 3容器编排（mongodb + backend + frontend）
├── .env                           # 密钥配置（不提交git）
├── .gitignore
├── STUDY.md                       # 学习指南（比赛演示用）
├── CHANGELOG.md                   # 版本变更日志
└── backup.sh                      # MongoDB备份脚本
```

### 3.2 中间件加载顺序（Server/server.js）

```
请求 → trust proxy → compression(gzip) → helmet(CSP) → bodyParser(10MB)
     → CORS(白名单) → rate-limit(100次/分) → 路由模块 × 9
     → 静态文件(uploads) → 全局错误处理
```

### 3.3 数据模型关系

```
User ─1:N─→ Product (上传)       User.uploadedBy.id → Product
User ─1:N─→ Order (买/卖)        User._id → Order.buyer / Order.seller
User ─1:N─→ Wanted (求购)        User._id → Wanted.postedBy.id
User ─1:N─→ Report (举报)        User._id → Report.reporterId
User ─1:N─→ Message (通知)       User._id → Message.userId
Product ─1:1─→ Order(快照)       Product._id → Order.product
购物车嵌入 User.cart[]           不用独立 Collection
```

---

## 4. 开发工作流

### 4.1 标准开发流程

```bash
# 1. 写代码（本地开发）
#    - 后端改 Server/ 下的文件
#    - 前端改 Client/src/ 下的文件

# 2. 后端语法检查
cd Server
node --check server.js
node --check controllers/productController.js
# ... 对所有修改过的 .js 执行

# 3. 前端构建验证
cd Client
npm run build        # 必须零 error 通过

# 4. 本地功能测试
#    - 启动后端 + 前端，走通完整业务流程
#    - 测试正常路径 + 异常路径（错误输入/越权/并发）

# 5. 提交代码
git add <具体文件>    # 不要用 git add . 或 git add -A
git commit -m "类型: 描述"
git push origin refactor/v3-simplify

# 6. 服务器部署
#    - ssh 登录服务器
#    - git pull
#    - docker compose build backend frontend
#    - docker compose up -d --no-deps backend frontend
```

### 4.2 Commit 规范

```
fix:     修复 bug
feat:    新增功能
refactor: 重构（不改功能）
chore:   构建/配置/依赖变更
docs:    文档更新
```

### 4.3 严禁操作

- **严禁 `git add .`** — 可能误提交 .env、node_modules、uploads 图片。请用 `git add <具体文件>`
- **严禁 `git push --force`** — 会覆盖远程历史
- **严禁 `npm install` 新包不经过评审** — 每个新依赖都增加安全面和资源消耗
- **严禁将 .env 内容发给任何人** — 包括截图、日志、代码片段
- **严禁在代码中硬编码密钥/密码/令牌**

---

## 5. 后端开发指南

### 5.1 新增一个 API 端点的标准步骤

以"新增用户收藏功能"为例：

**Step 1 — Model（如需新字段）**
```javascript
// Server/models/User.js — 在 userSchema 中添加
favorites: [{
  productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
  addedAt: { type: Date, default: Date.now }
}]
```

**Step 2 — Controller（业务逻辑）**
```javascript
// Server/controllers/userController.js
exports.addFavorite = async (req, res) => {
  try {
    const { productId } = req.body;
    // ⚠️ 类型校验
    if (typeof productId !== "string" || !productId) {
      return res.status(400).json({ message: "商品ID无效" });
    }
    // ⚠️ 使用 $addToSet 防重复（原子操作）
    await User.findByIdAndUpdate(req.user._id, {
      $addToSet: { favorites: { productId, addedAt: new Date() } }
    });
    res.json({ message: "已收藏" });
  } catch (error) {
    console.error("收藏失败:", error);
    res.status(500).json({ message: "服务器内部错误" });
  }
};
```

**Step 3 — Route（挂载路由）**
```javascript
// Server/routes/userRoutes.js
router.post("/favorites", authMiddleware, userController.addFavorite);
```

### 5.2 后端编码规范

**1. 所有 query 参数必须做类型校验（防 NoSQL 注入）**
```javascript
// ✅ 正确
const search = typeof req.query.search === "string" ? req.query.search : "";
const page = parseInt(req.query.page) || 1;

// ❌ 错误 — query string 可以被解析为对象 {$gt: ""}
const search = req.query.search || "";
```

**2. 所有分页 limit 必须设上限**
```javascript
// ✅ 正确
const limit = Math.min(parseInt(req.query.limit) || 20, 100);

// ❌ 错误 — 攻击者可以传 limit=9999999 打爆数据库
const limit = parseInt(req.query.limit) || 20;
```

**3. 所有用户输入字段必须白名单过滤**
```javascript
// ✅ 正确 — 只允许特定字段通过 req.body
const allowedFields = ["name", "description", "price", "category"];
const safeUpdate = {};
allowedFields.forEach(f => { if (req.body[f] !== undefined) safeUpdate[f] = req.body[f]; });

// ❌ 错误 — 攻击者可以覆盖 status/role/uploadedBy
const product = await Product.findByIdAndUpdate(id, req.body);
```

**4. ValidationError 返回通用消息（不泄露内部细节）**
```javascript
// ✅ 正确
if (error.name === "ValidationError") {
  return res.status(400).json({ message: "输入数据格式不正确" });
}

// ❌ 错误 — 泄露 Schema 字段名和校验规则
if (error.name === "ValidationError") {
  return res.status(400).json({ message: error.message });
}
```

**5. 写操作必须校验所有权**
```javascript
// ✅ 正确
if (product.uploadedBy.id !== req.user._id.toString()) {
  return res.status(403).json({ message: "无权操作" });
}
```

**6. 所有 String Schema 字段加 maxlength（防 DB 膨胀 DoS）**
```javascript
// ✅ 正确
name: { type: String, required: true, maxlength: [200, "名称过长"] }

// ❌ 错误 — 攻击者可以灌入 MB 级别的文本
name: { type: String, required: true }
```

### 5.3 关键设计模式

**状态机模式（Product）**
```javascript
// Server/controllers/productController.js
const VALID_TRANSITIONS = {
  unsold:   ["sold_out", "inactive"],   // 在售 → 售罄/下架
  sold_out: ["unsold"],                  // 售罄 → 重新上架
  inactive: ["unsold"],                  // 下架 → 重新上架
  sold:     [],                          // 暂未使用
};
// 使用：if (!VALID_TRANSITIONS[currentStatus].includes(newStatus)) return 400;
```

**状态机模式（Order）**
```
pending → completed（卖家确认完成）
pending → cancelled（买家/卖家取消）
completed / cancelled → 终态，不可再变
```

**原子购买（防超卖）**
```javascript
// 使用 findOneAndUpdate + 条件查询，非"查→判断→改"两步操作
const product = await Product.findOneAndUpdate(
  { _id: id, quantity: { $gt: 0 }, status: { $nin: ["sold_out", "inactive"] } },
  { $inc: { quantity: -1 }, $set: { purchasedBy: {...} } },
  { new: true }
);
```

**PII 脱敏（三层策略）**
```javascript
// Server/controllers/productController.js — sanitizeProduct()
// - 未认证用户：隐藏 phone/wechat/qq/dormitory
// - 认证非交易方：隐藏 phone/wechat/qq，保留 dormitory
// - 卖家或买家本人：保留全部
```

**tokenVersion 吊销机制**
```javascript
// 登出/改密/封禁时 tokenVersion + 1
// authMiddleware 校验时比对 decoded.tv vs user.tokenVersion
// 不匹配 → 401，所有旧 token 立即失效
```

### 5.4 违禁词过滤接入

```javascript
// Server/config/bannedKeywords.js
const { checkBanned } = require("../config/bannedKeywords");

// 在任何需要检查用户文本的地方调用
const hit = checkBanned(userInput);
if (hit) {
  return res.status(400).json({ message: "内容包含违规词，请修改后重新提交" });
}
```

**已接入位置：**
- 商品发布/编辑（name + description）
- 商品规格添加/编辑（key + value）
- 用户注册/资料编辑（fullName + wechat + qq）
- 求购发布（name + description）

---

## 6. 前端开发指南

### 6.1 新增一个页面的标准步骤

```bash
# 1. 创建组件文件
touch Client/src/components/NewPage.js

# 2. 在 App.js 添加路由
# 3. 如果是需要登录的页面，用 ProtectedRoute 包裹
# 4. 如果页面较大，用 React.lazy 懒加载
```

### 6.2 前端编码规范

**1. 图片上传必须走 /api/upload，禁止 base64**
```javascript
// ✅ 正确 — AddProduct.js / EditProduct.js 的标准做法
const fd = new FormData();
files.forEach(f => fd.append("images", f));
const res = await fetch("/api/upload", {
  method: "POST",
  headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
  body: fd,
});
const { urls } = await res.json();
// 然后用 urls（服务器路径）创建/更新商品

// ❌ 错误 — base64 会把数 MB 的字符串存入 MongoDB
const reader = new FileReader();
reader.readAsDataURL(file);
reader.onload = () => {
  setFormData({ ...formData, images: [...formData.images, reader.result] });
};
```

**2. API 调用模板**
```javascript
const token = localStorage.getItem("token");
try {
  const res = await fetch("/api/products", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(formData),
  });
  if (res.ok) {
    // 成功
  } else {
    const data = await res.json();
    // 处理业务错误（data.message）
    if (res.status === 401) {
      // token 过期 → 跳转登录
      navigate("/login");
    }
  }
} catch (err) {
  // 处理网络错误
  alert("网络错误，请稍后重试");
}
```

**3. PII 可见性控制（前端端）**
```jsx
{/* 宿舍楼：仅买家和卖家可见 */}
{productDetails.uploadedBy?.dormitory && (
  <p>
    宿舍楼：{" "}
    {!user
      ? "登录后查看"
      : (isBuyer || isSeller)
        ? productDetails.uploadedBy.dormitory
        : "购买后查看"}
  </p>
)}

{/* 手机号：买家和卖家完整可见，其他人脱敏 */}
{productDetails.uploadedBy?.phone && (
  <p>
    联系电话：{" "}
    {!user
      ? "登录后查看联系方式"
      : (isBuyer || isSeller)
        ? productDetails.uploadedBy.phone
        : phone.replace(/(\d{3})\d{4}(\d{4})/, "$1****$2") + " [购买后查看完整号码]"}
  </p>
)}
```

**4. 表单校验统一用内联提示，不用 alert()**
```jsx
// ✅ 正确
const [priceError, setPriceError] = useState("");
// ...
<input onChange={(e) => {
  if (Number(e.target.value) > 9999.9) setPriceError("价格不能超过 ¥9999.9");
  else setPriceError("");
}} />
{priceError && <p className="text-red-500 text-sm">{priceError}</p>}

// ❌ 错误
if (price > 9999.9) { alert("价格太高"); return; }
```

### 6.3 路由守卫（ProtectedRoute）

```javascript
// Client/src/components/ProtectedRoute.js
// 三种保护等级：
// 1. 普通登录保护：<ProtectedRoute><Component /></ProtectedRoute>
// 2. 管理员保护：<ProtectedRoute requireAdmin><AdminComponent /></ProtectedRoute>
// 3. 封禁用户会被自动登出并重定向
```

### 6.4 认证状态管理

```javascript
// Client/src/context/authContext.js
// login(user, token) — 存入 localStorage
// logout() — 清除 localStorage + 内存状态
// useAuth() — 获取 { user, isAuthenticated, isAdmin, login, logout }

// 使用示例：
import { useAuth } from "../context/authContext";
const { user, isAuthenticated, logout } = useAuth();
```

---

## 7. 安全开发铁律

### 7.1 必须遵守（违反 = 阻断上线）

| # | 规则 | 错误示例 | 正确做法 |
|---|------|---------|---------|
| 1 | query 参数必须 typeof 校验 | `req.query.search` 直接使用 | `typeof req.query.search === "string" ? req.query.search : ""` |
| 2 | req.body 必须字段白名单 | `Product.findByIdAndUpdate(id, req.body)` | 定义 `allowedFields[]`，逐字段复制 |
| 3 | 分页 limit 必须上限 | `parseInt(req.query.limit)` | `Math.min(parseInt(req.query.limit) \|\| 20, 100)` |
| 4 | 图片必须 upload-first | `reader.readAsDataURL(file)` | `FormData → POST /api/upload → 用返回的 URL` |
| 5 | String Schema 加 maxlength | `name: String` | `name: { type: String, maxlength: 200 }` |
| 6 | 写操作校验所有权 | 不检查直接改 | `if (ownerId !== req.user._id) return 403` |
| 7 | 错误消息不泄露内部细节 | `{ message: error.message }` | `{ message: "输入数据格式不正确" }` |
| 8 | 密码绝不回传 | `res.json(user)` | `delete user.password; res.json(user)` |
| 9 | .env 绝不提交 git | — | 已在 .gitignore 中 |
| 10 | JWT_SECRET 使用强随机值 | `change-me-in-production` | `crypto.randomBytes(64).toString("hex")` |

### 7.2 理解为什么

**NoSQL 注入原理：**
```javascript
// 攻击者发送：GET /api/products?search[$gt]=
// Express 的 qs 解析器会把 query string 解析为对象：{ search: { $gt: "" } }
// 如果直接放进 MongoDB 查询：Product.find({ name: { $regex: { $gt: "" } } })
// → 这不会匹配任何文档，但 typeof 检查可以防御
// 更危险的是 $where 注入（本项目未使用 $where，所以实际风险低）
```

**tokenVersion 设计原理：**
```
时间线：
T0: 用户登录，JWT 含 { userId: "abc", tv: 3 }
T1: 用户改密码 → DB 中 tokenVersion 变为 4
T2: 攻击者用旧 JWT (tv:3) 请求 → authMiddleware 比对 tv 不匹配 → 401
→ 不需要服务端维护 token 黑名单，JWT 本身无状态
```

### 7.3 新增代码安全自查清单

每次写完一个新功能，对照检查：

```
[ ] 所有 req.query 参数都有 typeof 校验？
[ ] 所有 req.body 字段都经过白名单过滤？
[ ] 所有分页接口的 limit 都有限上限？
[ ] 所有 String Schema 字段都加了 maxlength？
[ ] 所有写操作都校验了所有权？
[ ] 所有 try-catch 的 ValidationError 都用了通用消息？
[ ] 用户输入的文本调用了 checkBanned()？
[ ] 返回的 JSON 中没有 password 字段？
[ ] 没有 console.log 打印敏感信息（密钥、密码）？
[ ] 新增字段在 sanitizeProduct() 的白名单中考虑过？
```

---

## 8. API 速查

### 8.1 路由总览

| 前缀 | 文件 | 主要端点 | 认证要求 |
|------|------|---------|---------|
| `/api/users` | userRoutes.js | register, login, logout, profile, update, delete, changePassword | 混合 |
| `/api/products` | productRoutes.js | CRUD, search, recommendations, purchase, status | 混合（读公开，写需登录） |
| `/api/cart` | cartRoutes.js | get, add, updateQty, remove, clear, checkout | 全部需登录 |
| `/api/orders` | orderRoutes.js | buyOrders, sellOrders, updateStatus | 全部需登录 |
| `/api/wanted` | wantedRoutes.js | create, list | 创建需登录，列表公开 |
| `/api/reports` | reportRoutes.js | create | 需登录 |
| `/api/admin` | adminRoutes.js | stats, manage reports/products/users/warnings | 需登录 + admin 角色 |
| `/api/upload` | uploadRoutes.js | 多图上传 (max 9张, 单张20MB) | 需登录 |
| `/api/messages` | messageRoutes.js | list, markRead, unreadCount | 需登录 |
| `/api/health` | server.js | 健康检查 | 公开 |
| `/api/stats` | server.js | 首页统计 | 公开（60s 缓存） |
| `/api/majorMap` | server.js | 学院-专业映射 | 公开（1h 缓存） |

### 8.2 关键端点详情

**POST /api/users/login**
```json
// Request
{ "email": "user@example.com", "password": "mypassword123" }

// Response 200
{ "token": "eyJ...", "user": { "_id": "...", "fullName": "...", "role": "user", ... }, "pendingApproval": false }

// Response 400（密码错误 ≥5次 → 429 锁定）
{ "message": "邮箱或密码错误" }

// Response 429（账户锁定）
{ "message": "账户已锁定，请稍后重试" }
```

**POST /api/products**
```json
// Request（需先 POST /api/upload 获取图片 URL）
{
  "name": "二手教材",
  "category": "教材教辅",
  "description": "九成新，只用了一学期",
  "price": 15.5,
  "images": ["/uploads/1234567890-123456.jpg"],
  "specifications": [{ "key": "作者", "value": "张三" }],
  "quantity": 1
}

// Response 201 — 返回完整 Product 文档
```

**POST /api/products/:id/purchase**（原子购买）
```
原子操作：findOneAndUpdate + quantity > 0 + $inc quantity -1
返回 200 + orderId（购买成功）
返回 400（库存不足/已下架/不能买自己的）
```

**PUT /api/users/:id/password**（修改密码）
```json
// Request
{ "oldPassword": "old123", "newPassword": "new456" }

// Response 200 — 返回新 JWT token，旧 token 全部失效
{ "message": "密码修改成功，请使用新密码重新登录", "token": "eyJ..." }
```

### 8.3 HTTP 状态码约定

| 状态码 | 含义 | 示例场景 |
|--------|------|---------|
| 200 | 成功 | 查询/更新成功 |
| 201 | 创建成功 | 注册/发布商品 |
| 400 | 请求错误 | 参数缺失/格式错误/违禁词命中 |
| 401 | 未认证 | token 缺失/过期/版本不匹配 |
| 403 | 无权限 | 越权操作/非管理员 |
| 404 | 不存在 | 商品/用户不存在 |
| 429 | 限流 | 登录锁定/频率过高 |
| 500 | 服务器错误 | 数据库异常/未知错误 |

---

## 9. Docker 部署

### 9.1 架构

```
外网 → Frontend(Nginx:5000) → /api/* → Backend(Node:8000) → MongoDB(27017)
                              → /* → React build 静态文件
```

### 9.2 容器资源限制

| 容器 | CPU | 内存 | 说明 |
|------|-----|------|------|
| MongoDB | 1.0 核 | 384 MB | WiredTiger cache 150MB |
| Backend | 1.0 核 | 256 MB | Node heap 200MB |
| Frontend | 0.5 核 | 64 MB | Nginx 1 worker |

### 9.3 首次部署

```bash
# 1. 确认 .env 配置正确
cat .env  # JWT_SECRET, MONGO_INITDB_ROOT_PASSWORD, MONGODB_URI_FULL

# 2. 构建启动
docker compose up -d --build

# 3. 等待健康检查通过
docker compose ps  # 全部状态为 healthy

# 4. 初始化种子数据
docker exec second-hand-backend node scripts/seed.js

# 5. 验证
curl http://localhost:8000/api/health  # → {"status":"ok"}
curl http://localhost:5000/            # → HTML 首页
```

### 9.4 更新部署

```bash
git pull origin refactor/v3-simplify
docker compose build backend frontend
docker compose up -d --no-deps backend frontend
docker compose ps   # 确认正常
```

### 9.5 常用运维命令

```bash
# 查看日志
docker compose logs --tail 50 backend

# 重启服务
docker compose restart backend

# 进入 MongoDB
docker exec -it second-hand-mongodb mongosh -u admin -p <密码> --authenticationDatabase admin second-hand

# 备份数据库
docker exec second-hand-mongodb mongodump --username admin --password <密码> --authenticationDatabase admin --archive=/tmp/backup.archive
docker cp second-hand-mongodb:/tmp/backup.archive ./backup_$(date +%Y%m%d).archive

# 查看资源使用
docker stats --no-stream
```

---

## 10. 常见问题与排查

### 10.1 开发阶段

**Q: 后端改了代码没生效？**
```
如果用的是 node server.js（非 nodemon），需要手动重启。
建议开发时用 npx nodemon server.js 自动重启。
```

**Q: 前端 build 报错？**
```bash
cd Client
npm run build
# 看报错信息逐条修复。常见原因：
# - import 路径不对
# - 引用的组件/变量不存在
# - JSX 语法错误
```

**Q: MongoDB 连不上？**
```
1. 确认 MongoDB 是否在运行：docker ps | grep mongo
2. 确认连接字符串正确：检查 .env 中 MONGODB_URI_FULL
3. 确认密码中 @ 编码为 %40
```

### 10.2 安全相关

**Q: JWT_SECRET 忘记是什么了？**
```
重新生成：node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
将输出写入 .env，然后重建容器。
注意：更换 JWT_SECRET 后所有用户需要重新登录。
```

**Q: 用户被封了怎么解封？**
```
管理员后台 → 用户管理 → 设为"active"
或者直接操作数据库：
db.users.updateOne({email:"xxx@xxx.com"}, {$set:{status:"active"}, $inc:{tokenVersion:1}})
```

**Q: 发现新的违禁词需要加？**
```
编辑 Server/config/bannedKeywords.js，在 bannedKeywords 数组里追加。
重新构建部署后端即可生效，不需要改前端。
```

### 10.3 性能相关

**Q: 首页加载慢（>2s）？**
```
1. 检查 MongoDB 慢查询：docker compose logs mongodb | grep slow
2. 检查是否缺索引：db.products.getIndexes()
3. 检查图片是否过大
```

**Q: 服务器内存不够了？**
```bash
# 查看各容器内存
docker stats --no-stream

# MongoDB 内存超了 → 降低 cacheSizeGB（docker-compose.yml 中 --wiredTigerCacheSizeGB）
# Node 内存超了 → 减少 maxPoolSize（Server/config/db.js）
```

### 10.4 数据相关

**Q: 图片上传了但显示不出来？**
```
1. 确认 uploads/ 目录权限
2. 确认 docker-compose.yml volumes 挂载：./Server/uploads:/app/uploads
3. 确认图片 URL 格式：/uploads/xxx.jpg
```

**Q: 首页没商品（冷启动）？**
```bash
docker exec second-hand-backend node scripts/seed.js  # 24条种子数据
```

---

## 11. 附录：关键文件索引

### 按功能查文件

| 我要做什么 | 改哪个文件 |
|-----------|-----------|
| 加/改 API 端点 | `Server/routes/` + `Server/controllers/` |
| 改数据库结构 | `Server/models/` |
| 改认证逻辑 | `Server/middleware/authMiddleware.js` + `Server/config/auth.js` |
| 加违禁词 | `Server/config/bannedKeywords.js` |
| 改前端页面 | `Client/src/components/` |
| 改路由 | `Client/src/App.js` |
| 改样式 | Tailwind className 直接写在组件里 |
| 改部署配置 | `docker-compose.yml` |
| 改环境变量 | `.env`（不提交） |
| 改安全策略 | `Server/server.js`（CSP/CORS/限流） |
| 改 Nginx 配置 | `Client/nginx.conf` |
| 改密码规则 | `Server/models/User.js` + `Server/controllers/userController.js` |

### 参考文档

| 文档 | 位置 | 用途 |
|------|------|------|
| 上线开发文档 | `上线开发文档.md` | 生产上线 9 模块清单（安全检查/HTTPS/备份/应急等） |
| 变更日志 | `CHANGELOG.md` | 版本历史 |
| 项目总结 | `PROJECT_SUMMARY.md` | 项目概述 |
| 发展方向 | `development.md` | 下阶段规划 |

### 记忆目录

```
C:\Users\杨婷\.claude\projects\D--Second-Hand-main\memory\
├── MEMORY.md                       # 记忆索引
├── project-overview.md             # 项目架构概述
├── security-fix-plan.md            # 安全修复4 Phase计划
├── comprehensive-audit-report.md   # 全量审计报告（7致命+12高危+10中等）
├── user-profile.md                 # 用户偏好
└── feedback-*.md                   # 用户反馈记录
```

---

## 设计铁律

1. **适配 2核2G** — 任何方案必须在此约束下运行
2. **不做大厂功能拷贝** — 校园场景优先微信/QQ 沟通、当面交易
3. **优先做减法** — 砍功能比加功能更有价值
4. **无外部依赖** — 不引入第三方 API、不新增 npm 包（除非必要）、不新增 Docker 容器
5. **安全不可妥协** — 第 7 节 10 条铁律任何一条违反都阻断上线
6. **构建验证必备** — `node --check` + `npm run build` 必须通过
