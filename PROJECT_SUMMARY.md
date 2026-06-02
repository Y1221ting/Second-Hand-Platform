# Second-Hand 南昌师范学院校园二手平台 - 项目完整文档

> 最后更新：2026-06-02 | 当前版本：v2.5.0

## 技术栈
- **前端**: React 18 + Tailwind CSS + React Router v6
- **后端**: Node.js + Express 4
- **数据库**: MongoDB 7.0 (Mongoose)
- **认证**: JWT (jsonwebtoken + bcryptjs 12轮)
- **安全**: helmet + express-rate-limit + CORS白名单 + 违禁词过滤
- **部署**: Docker Compose (3容器: mongodb + backend + frontend)

## 服务器信息
- **服务器**: 2核CPU / 2GB内存
- **前端地址**: `http://8.162.24.145:5000`
- **后端地址**: `http://8.162.24.145:8000`
- **MongoDB**: 容器内 `second-hand-mongodb:27017` (仅本机回环, 不暴露公网)

---

## 项目目录结构

```
Second-Hand-main/
├── docker-compose.yml          # Docker编排 (3服务, 资源硬限)
├── .env                        # 密钥配置 (.gitignore)
├── .gitignore
├── CHANGELOG.md
├── PROJECT_SUMMARY.md
├── DEVELOPER_MANUAL.md         # 开发者手册
├── development.md              # 架构决策 + 运营方向
├── backup.sh                   # MongoDB 备份脚本
├── Client/                     # 前端 React
│   ├── Dockerfile              # nginx:alpine, COPY build/
│   ├── nginx.conf              # 静态缓存 + /api/ /uploads/ 代理
│   └── src/
│       ├── App.js
│       ├── context/authContext.js
│       └── components/
│           ├── Home/           # index, HomeBanner, WantedList, Filters, ProductList, Recommendations, Pagination
│           ├── Product_Details/ # ProductDetails, Dialog, FormField
│           ├── Profile/        # UserDetails, ProductList, UserField, ConfirmDialog
│           ├── Admin/          # AdminLayout, Dashboard, Reports, Products, Users
│           ├── Utility/        # Navbar, Footer, Loading, DrawerMenu, ProductCard
│           ├── AddProduct.js
│           ├── EditProduct.js
│           ├── Edit_Product/ProductForm.js
│           ├── Cart.js
│           ├── UserProfile.js
│           ├── Login.js
│           ├── Register.js
│           ├── FAQ.js          # 10问手风琴
│           ├── Privacy.js      # 隐私政策
│           ├── Orders.js
│           ├── ProtectedRoute.js
│           └── ErrorBoundary.js
└── Server/                     # 后端 Express
    ├── Dockerfile              # node:18-alpine
    ├── .dockerignore           # 排除 node_modules/.env/uploads
    ├── server.js               # 入口 (dotenv → helmet → compression → cors → rate-limit → routes)
    ├── config/
    │   ├── auth.js             # JWT签发/验证 + bcryptjs 12轮
    │   ├── db.js               # MongoDB连接池 (maxPoolSize=10)
    │   ├── bannedKeywords.js   # 50+ 违禁词列表
    │   └── majorMap.js         # 13学院→专业映射
    ├── middleware/
    │   └── authMiddleware.js   # JWT + tokenVersion 校验
    ├── models/
    │   ├── User.js             # 用户 (loginAttempts, lockUntil, tokenVersion)
    │   ├── Product.js          # 商品 (6个复合索引, 文本索引)
    │   ├── Order.js            # 订单 (状态机: pending→confirmed→completed/cancelled)
    │   ├── Wanted.js           # 求购
    │   ├── Report.js           # 举报
    │   └── Message.js          # 系统通知 (精简, 只有title+content+isRead)
    ├── controllers/
    │   ├── userController.js   # 注册/登录/资料编辑/注销 (含违禁词检查)
    │   ├── productController.js # 商品CRUD + 购买 + 两层推荐 + 违禁词过滤
    │   ├── orderController.js   # 订单CRUD + 状态流转
    │   ├── cartController.js   # 购物车6操作 + 批量结算
    │   └── uploadController.js # 多图上传 (multer)
    ├── routes/                 # 9个路由模块
    │   ├── userRoutes.js       # /api/users
    │   ├── productRoutes.js    # /api/products
    │   ├── orderRoutes.js      # /api/orders
    │   ├── cartRoutes.js       # /api/cart
    │   ├── wantedRoutes.js     # /api/wanted
    │   ├── reportRoutes.js     # /api/reports
    │   ├── adminRoutes.js      # /api/admin
    │   ├── uploadRoutes.js     # /api/upload
    │   └── messageRoutes.js    # /api/messages (精简版通知)
    ├── scripts/
    │   └── seed.js             # 24条种子商品 (9分类, 13学院, 幂等)
    └── uploads/                # 商品图片存储
```

---

## 后端 API 接口

### 系统
| 方法 | 路径 | 认证 | 说明 |
|------|------|------|------|
| GET | `/api/health` | ❌ | 健康检查 |
| GET | `/api/stats` | ❌ | 首页统计 (userCount + productCount) |
| GET | `/api/majorMap` | ❌ | 学院-专业映射 |

### 用户 `/api/users`
| 方法 | 路径 | 认证 | 说明 |
|------|------|------|------|
| POST | `/api/users/register` | ❌ | 注册 (限流5次/小时) |
| POST | `/api/users/login` | ❌ | 登录 (限流20次/15分钟) |
| POST | `/api/users/logout` | ✅ | 登出 |
| GET | `/api/users/` | ✅ | 用户列表 (分页+脱敏) |
| GET | `/api/users/:userId` | ✅ | 用户详情 |
| PUT | `/api/users/:userId` | ✅ | 编辑资料 (本人校验) |
| DELETE | `/api/users/:userId` | ✅ | 注销账号 (本人校验) |

### 商品 `/api/products`
| 方法 | 路径 | 认证 | 说明 |
|------|------|------|------|
| GET | `/api/products/` | ❌ | 商品列表 (分页/搜索/筛选/排序) |
| GET | `/api/products/recommendations` | ❌ | 推荐 (同学院 + 最新) |
| GET | `/api/products/:id` | ❌ | 商品详情 |
| GET | `/api/products/user/:userId` | ❌ | 用户发布的商品 |
| GET | `/api/products/purchased/:userId` | ❌ | 用户购买的商品 |
| POST | `/api/products/` | ✅ | 发布商品 (违禁词过滤) |
| PUT | `/api/products/:id` | ✅ | 编辑商品 (所有权+白名单+违禁词过滤) |
| DELETE | `/api/products/:id` | ✅ | 删除商品 |
| POST | `/api/products/:id/purchase` | ✅ | 购买 (原子减库存) |

### 订单 `/api/orders`
| 方法 | 路径 | 认证 | 说明 |
|------|------|------|------|
| GET | `/api/orders/buy` | ✅ | 我买的 |
| GET | `/api/orders/sell` | ✅ | 我卖的 |
| PUT | `/api/orders/:id` | ✅ | 更新状态 (confirmed/completed/cancelled) |

### 购物车 `/api/cart`
| 方法 | 路径 | 认证 | 说明 |
|------|------|------|------|
| GET | `/api/cart/` | ✅ | 获取购物车 |
| POST | `/api/cart/:productId` | ✅ | 加入购物车 |
| PUT | `/api/cart/:productId` | ✅ | 修改数量 |
| DELETE | `/api/cart/:productId` | ✅ | 移除商品 |
| DELETE | `/api/cart/` | ✅ | 清空购物车 |
| POST | `/api/cart/checkout/all` | ✅ | 批量结算 |

### 其他
| 方法 | 路径 | 认证 | 说明 |
|------|------|------|------|
| POST | `/api/upload/` | ✅ | 上传图片 (多图, 单张10MB) |
| GET | `/api/wanted/` | ❌ | 求购列表 |
| POST | `/api/wanted/` | ✅ | 发布求购 |
| POST | `/api/reports/` | ✅ | 举报商品 |
| GET | `/api/messages/` | ✅ | 系统通知列表 |
| PUT | `/api/messages/:id/read` | ✅ | 标记已读 |

### 管理后台 `/api/admin`
| 方法 | 路径 | 认证 | 说明 |
|------|------|------|------|
| GET | `/api/admin/stats` | ✅🔑 | 数据概览 |
| GET | `/api/admin/reports` | ✅🔑 | 举报列表 |
| PUT | `/api/admin/reports/:id` | ✅🔑 | 处理举报 |
| GET | `/api/admin/products` | ✅🔑 | 商品管理 |
| PUT | `/api/admin/products/:id` | ✅🔑 | 下架/恢复 |
| GET | `/api/admin/users` | ✅🔑 | 用户管理 |
| PUT | `/api/admin/users/:id` | ✅🔑 | 封禁/解封 |

> ✅ = JWT认证  🔑 = 管理员角色  |  全局限流: 100次/分钟

---

## 数据模型 (6个)

### User
```javascript
{
  email, password (bcryptjs 12轮), fullName,
  college: "南昌师范学院",              // 写死
  department (13学院枚举), major, dormitory,
  phoneNo (11位), wechat, qq, address,
  cart: [{ productId, quantity, addedAt }],
  loginAttempts (5次失败锁15分钟), lockUntil,
  tokenVersion (修改密码/封禁时自增, 旧token立即失效),
  role: "user" | "admin",
  status: "active" | "banned" | "inactive",
}
// 索引: email(unique), status, role
```

### Product
```javascript
{
  name, description, price: Number,       // 不再是 Decimal128
  category (9种中文枚举), images: [String],
  specifications: [{ key, value }],
  status: "unsold" | "sold" | "sold_out" | "inactive",
  quantity, delistReason,
  uploadedBy: { id, name, college, department, major, dormitory, phone, wechat, qq },
  purchasedBy: { id, name, college, department, major, dormitory, phone },
  listedByDepartment, listedByMajor,
}
// 索引: name+description(text), createdAt, status+category+createdAt,
//       status+department+createdAt, uploadedBy.id+status, purchasedBy.id
```

### Order
```javascript
{
  buyer, seller, product (ref),
  productSnapshot: { name, price, image },
  quantity, totalAmount,
  status: "pending" | "completed" | "cancelled",
  buyerInfo: { name, phone, dormitory, department },
  sellerInfo: { name, phone, dormitory, department },
}
// 状态机: pending → completed/cancelled (终态不可逆)
// 索引: buyer+createdAt, seller+createdAt, product
```

### Wanted
```javascript
{
  name, budget: Number, description,
  postedBy: { id, name, department, major, phone },
}
```

### Report
```javascript
{
  productId, reporterId,
  reason: "信息不实" | "违禁品" | "重复发布" | "人身攻击" | "其他",
  detail, status: "pending" | "handled" | "dismissed",
  handledBy, handleNote,
}
```

### Message (精简通知)
```javascript
{
  userId, title, content, isRead, createdAt,
}
// 索引: userId+isRead+createdAt
```

---

## 安全防护体系

### 认证链
```
注册 → bcrypt 12轮 → 存DB
登录 → 校验密码 → 签发JWT (userId + tv(tokenVersion), 7天)
每请求 → authMiddleware → jwt.verify → 查DB验证tokenVersion
敏感操作 → 修改密码/封禁 → tokenVersion+1 → 所有旧token失效
```

### 防护措施
| 层级 | 措施 |
|------|------|
| 传输 | helmet安全头, CORS白名单, 全局100次/分钟限流 |
| 认证 | JWT + tokenVersion吊销, 5次失败锁15分钟 |
| 授权 | 本人校验(updateUser/deleteUser), 字段白名单(updateProduct) |
| 数据 | 密码永不回传, 统一模糊错误(防枚举), 违禁词50+过滤 |
| 资源 | body-parser 10MB, MongoDB仅127.0.0.1, Node heap 200MB |

---

## Docker 部署

### 容器资源分配
| 容器 | CPU 硬限 | 内存硬限 | 说明 |
|------|---------|---------|------|
| MongoDB | 1.0核 | 384MB | wiredTigerCacheSizeGB 0.15 (~150MB) |
| Backend | 1.0核 | 256MB | Node --max-old-space-size=200 |
| Frontend | 0.5核 | 64MB | Nginx 1 worker |

### 部署命令
```bash
# 服务器部署
cd /path/to/Second-Hand-main
git pull
docker compose up -d --build

# 初始化种子数据 (首页不空)
docker exec second-hand-backend node scripts/seed.js

# 验证
curl http://localhost:8000/api/health
```

### 关键文件
| 文件 | 用途 |
|------|------|
| `docker-compose.yml` | 3容器编排, 资源硬限, 健康检查, 日志轮转 |
| `Server/Dockerfile` | node:18-alpine, npm install --production |
| `Server/.dockerignore` | 排除 node_modules/.env/uploads/日志 |
| `Client/Dockerfile` | nginx:alpine, COPY build/ |
| `Client/nginx.conf` | 静态缓存(JS 1年/图片30天) + API代理 + 安全头 |
| `.env` | 密钥 (JWT_SECRET, MONGO密码), .gitignore保护 |

---

## 已砍功能 (不做重复建议)

| 功能 | 原因 |
|------|------|
| AI生成描述/分类 | 通义千问API费用, 学生不需要AI写描述 |
| 站内私信 IM | 学生用微信/QQ沟通, IM轮询浪费资源 |
| 评价/信用体系 | 同校天然信任, 评价需Order模型+反刷机制 |
| 申诉系统 | 校园平台管理员直接操作, 不需要流程 |
| 多设备session互踢 | 校园场景不需要, 曾导致3次500错误 |
| Decimal128价格 | 金融级精度不需要, Number够用 |
| 六层推荐引擎 | 简化为两层(同学院+最新) |

---

## 当前已完成功能

1. ✅ 用户注册/登录 — JWT + bcryptjs 12轮 + tokenVersion吊销 + 账户锁定
2. ✅ 商品发布/浏览/搜索 — 分页+筛选+排序+$text搜索
3. ✅ 购物车系统 — 添加/修改/移除/清空/批量结算
4. ✅ 订单系统 — 创建/状态流转/买卖双方视角
5. ✅ 求购功能 — 发布/列表
6. ✅ 举报功能 — 4种原因, 管理员处理
7. ✅ 管理员后台 — 数据概览/商品管理/用户管理/举报管理
8. ✅ 系统通知 — 精简Message模型, 列表+标记已读
9. ✅ 学院/专业联动 — 注册/筛选器/商品发布均联动
10. ✅ 商品推荐 — 两层 (同学院优先 + 最新补足)
11. ✅ 图片上传 — multer文件存储, 多图
12. ✅ 安全加固 — helmet安全头, 全局限流, 全局错误处理, CORS白名单, 违禁词过滤
13. ✅ 冷启动 — 24条种子数据, 隐私政策页, FAQ页
14. ✅ 开发者手册 — DEVELOPER_MANUAL.md (环境/Docker/MongoDB/安全/运维/FAQ)
15. ✅ Docker优化 — Node heap 200MB, MongoDB cache 150MB, .dockerignore

## 已知不足

1. **token存localStorage**: XSS风险, 需HTTPS后迁httpOnly Cookie
2. **图片未压缩**: 前端无压缩/缩略图, 大图影响加载
3. **MongoDB中文搜索**: $text对中文分词差, 可能需要换策略
4. **无HTTPS**: HTTP明文传输, 需Let's Encrypt
5. **无监控**: CPU/内存/磁盘/错误率无告警
6. **单点故障**: 一台服务器无备援
7. **种子数据无图**: seed.js有24条商品但images为空数组
