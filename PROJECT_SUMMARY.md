# Second-Hand 南昌师范学院校园二手平台 - 项目完整文档

> 从38校通用平台改造为南昌师范学院单校专属版本，核心变化：学院/专业替代学校维度

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
│       │   ├── authContext.js           # 用户认证上下文
│       │   └── NotificationContext.js   # 通知状态管理（30s轮询）
│       └── components/
│           ├── Home/
│           │   ├── index.js             # 商品列表页
│           │   ├── HomeBanner.js        # 首页统计横幅
│           │   ├── WantedList.js        # 求购列表
│           │   ├── Filters.js           # 筛选组件
│           │   ├── ProductList.js       # 商品卡片列表
│           │   ├── Recommendations.js   # 猜你喜欢推荐
│           │   └── Pagination.js        # 分页
│           ├── Product_Details/
│           │   ├── ProductDetails.js    # 商品详情
│           │   ├── Recommendations.js   # 猜你喜欢推荐
│           │   ├── Dialog.js            # 购买确认弹窗
│           │   └── FormField.js         # 表单字段组件
│           ├── Profile/
│           │   ├── UserDetails.js       # 用户信息展示
│           │   ├── ProductList.js       # 用户商品列表
│           │   ├── UserField.js         # 用户字段编辑
│           │   ├── AppealForm.js        # 申诉提交弹窗
│           │   ├── AppealList.js        # 申诉状态列表
│           │   └── ConfirmDialog.js     # 删除确认弹窗
│           ├── Admin/
│           │   ├── AdminLayout.js       # 管理后台侧边栏布局
│           │   ├── Dashboard.js         # 数据概览统计
│           │   ├── Reports.js           # 举报管理
│           │   ├── Products.js          # 商品管理
│           │   ├── Users.js             # 用户管理
│           │   ├── Appeals.js           # 申诉管理
│           │   └── Warnings.js          # 警告记录
│           ├── Utility/
│           │   ├── Navbar.js
│           │   ├── Footer.js
│           │   ├── Loading.js
│           │   ├── DrawerMenu.js
│           │   └── ProductCard.js
│           ├── AddProduct.js            # 发布商品
│           ├── EditProduct.js           # 编辑商品
│           ├── Edit_Product/
│           │   └── ProductForm.js
│           ├── Home.js
│           ├── Landing.js
│           ├── Login.js
│           ├── Register.js
│           ├── ProductPage.js
│           ├── Cart.js
│           ├── UserProfile.js           # 个人主页
│           ├── Warnings.js              # 用户通知列表
│           ├── NotificationModal.js     # 全局强制弹窗
│           └── ProtectedRoute.js        # 路由守卫 + 封禁拦截
└── Server/                     # 后端 Express
    ├── Dockerfile              # node:18-alpine
    ├── package.json
    ├── server.js               # 入口文件
    ├── config/
    │   ├── db.js               # MongoDB连接
    │   ├── auth.js             # JWT + bcrypt工具
    │   └── majorMap.js         # 学院-专业映射（南昌师范学院）
    ├── middleware/
    │   └── authMiddleware.js   # JWT认证中间件
    ├── models/
    │   ├── User.js             # 用户模型
    │   ├── Product.js          # 商品模型
    │   ├── Wanted.js           # 求购模型
    │   ├── Report.js           # 举报模型
    │   ├── Appeal.js           # 申诉模型
    │   └── Warning.js          # 通知/警告模型（type/severity/metadata）
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
    │   ├── uploadRoutes.js     # /api/upload
    │   ├── wantedRoutes.js     # /api/wanted
    │   ├── reportRoutes.js     # /api/reports
    │   ├── adminRoutes.js      # /api/admin（管理后台）
    │   ├── warningRoutes.js    # /api/warnings（用户通知）
    │   └── appealRoutes.js     # /api/appeals（用户申诉）
    └── services/
        └── aiService.js        # 通义千问API调用
```

---

## 后端 API 接口

### 系统 `/`
| 方法 | 路径 | 认证 | 说明 |
|------|------|------|------|
| GET | `/api/majorMap` | ❌ | 获取学院-专业映射（南昌师范学院13学院） |

### 用户 `/api/users`
| 方法 | 路径 | 认证 | 说明 |
|------|------|------|------|
| POST | `/api/users/register` | ❌ | 注册（college写死，接收department/major/dormitory） |
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

### 求购 `/api/wanted`
| 方法 | 路径 | 认证 | 说明 |
|------|------|------|------|
| GET | `/api/wanted/` | ❌ | 获取求购列表（limit参数，默认10，按最新排序） |
| POST | `/api/wanted/` | ✅ | 发布求购（name/budget必填） |

### 举报 `/api/reports`
| 方法 | 路径 | 认证 | 说明 |
|------|------|------|------|
| POST | `/api/reports/` | ✅ | 举报商品（productId必填，reason四选一） |

### 申诉 `/api/appeals`
| 方法 | 路径 | 认证 | 说明 |
|------|------|------|------|
| POST | `/api/appeals/` | ✅ | 提交申诉（productId必填，reason必填） |
| GET | `/api/appeals/user/:userId` | ✅ | 获取用户的申诉列表 |

### 警告/通知 `/api/warnings`
| 方法 | 路径 | 认证 | 说明 |
|------|------|------|------|
| GET | `/api/warnings/` | ✅ | 获取用户通知列表（支持 isRead 筛选） |
| GET | `/api/warnings/critical` | ✅ | 获取未读 critical 通知（供弹窗用） |
| PUT | `/api/warnings/:id/read` | ✅ | 标记通知为已读 |

### 管理后台 `/api/admin`
| 方法 | 路径 | 认证 | 说明 |
|------|------|------|------|
| GET | `/api/admin/stats` | ✅🔑 | 数据概览（用户/商品/今日新增/待处理） |
| GET | `/api/admin/reports` | ✅🔑 | 举报列表（分页+状态筛选） |
| PUT | `/api/admin/reports/:id` | ✅🔑 | 处理举报（通过=下架 / 驳回） |
| GET | `/api/admin/products` | ✅🔑 | 全部商品（分页+搜索+状态筛选） |
| PUT | `/api/admin/products/:id` | ✅🔑 | 下架/恢复商品 |
| GET | `/api/admin/users` | ✅🔑 | 用户列表（分页+搜索+角色/状态筛选） |
| PUT | `/api/admin/users/:id` | ✅🔑 | 封禁/解封用户（含互保检查） |
| GET | `/api/admin/appeals` | ✅🔑 | 申诉列表（分页+状态筛选） |
| PUT | `/api/admin/appeals/:id` | ✅🔑 | 处理申诉（通过=恢复 / 驳回=更新原因） |
| GET | `/api/admin/warnings` | ✅🔑 | 已发送警告列表（分页+已读/未读筛选） |
| POST | `/api/admin/warnings` | ✅🔑 | 给用户发送警告（含互保检查） |

> ✅ = 需 JWT 认证  🔑 = 需管理员角色

### 统计 `/api`
| 方法 | 路径 | 认证 | 说明 |
|------|------|------|------|
| GET | `/api/stats` | ❌ | 首页统计数据（注册人数 + 在售商品数） |

---

## 数据模型

### User 模型
```javascript
{
  email: String,        // 必填，唯一，邮箱格式验证
  password: String,     // 必填，最少6位，bcrypt加密
  fullName: String,     // 必填
  college: String,      // 系统写死"南昌师范学院"
  department: String,   // 必填，学院（13选1）
  major: String,        // 必填，专业（联动department）
  dormitory: String,    // 选填，宿舍楼（如"1栋302"）
  phoneNo: String,      // 必填，11位数字
  address: String,      // 必填（合并地址信息）
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
  uploadedBy: { id, name, college, department, major, dormitory, phone },
  category: String,                // 枚举9种中文（教材教辅/电子数码/生活用品/体育用品/服饰美妆/文具办公/宿舍神器/乐器爱好/其他）
  description: String,             // 必填
  price: Decimal128,               // 必填，>0，≤9999.9
  images: [String],                // 图片路径数组 /uploads/xxx.jpg
  specifications: [{ key, value }], // 规格参数
  status: String,                  // "unsold" | "sold" | "sold_out"
  quantity: Number,                // 库存，默认1
  purchasedBy: { id, name, college, department, major, dormitory, phone },
  listedByDepartment: String,      // 冗余字段（方便聚合查询）
  listedByMajor: String,           // 冗余字段
  createdAt: Date
}
```

### Wanted 模型
```javascript
{
  name: String,        // 必填，求购商品名称
  budget: Decimal128,   // 必填，心理价位 >0 ≤9999.9
  description: String,  // 选填，对商品的要求描述
  postedBy: {           // 发布者信息
    id, name, department, major, phone
  },
  createdAt: Date       // 默认当前时间
}
```

### Report 模型
```javascript
{
  productId: ObjectId,  // 必填，被举报的商品ID
  reporterId: String,   // 必填，举报人ID
  reason: String,       // 枚举：虚假信息/违禁商品/重复发布/其他
  detail: String,       // 选填，详细说明
  status: String,       // pending | handled | dismissed
  handledBy: String,    // 处理人ID
  handleNote: String,   // 处理备注
  createdAt: Date       // 默认当前时间
}
```

### Appeal 模型
```javascript
{
  productId: ObjectId,  // 必填，被下架商品ID
  sellerId: String,     // 必填，申诉人ID
  reason: String,       // 必填，申诉理由
  status: String,       // pending | approved | rejected
  handledBy: String,    // 处理人ID
  handleNote: String,   // 处理备注
  createdAt: Date       // 默认当前时间
}
```

### Warning 模型
```javascript
{
  userId: ObjectId,     // 必填，接收用户ID
  title: String,        // 必填，标题
  content: String,      // 必填，内容
  type: String,         // warning | product_delisted | account_banned | appeal_result
  severity: String,     // info | critical（critical=强制弹窗）
  metadata: Mixed,      // { productId, reason, appealStatus }
  createdBy: String,    // 创建者ID（管理员）
  isRead: Boolean,      // 默认 false
  readAt: Date,         // 阅读时间
  createdAt: Date       // 默认当前时间
}
```

### 商品分类（9种中文）
```
教材教辅   → 课本、考研资料、考证资料
电子数码   → 手机、电脑、耳机、平板
生活用品   → 台灯、风扇、收纳、衣架
体育用品   → 球拍、瑜伽垫、哑铃
服饰美妆   → 衣服、鞋、化妆品
文具办公   → 笔、笔记本、画材
宿舍神器   → 床帘、床上桌、懒人支架
乐器爱好   → 吉他、尤克里里
其他       → 未分类
```

### 学院列表（南昌师范学院13学院）
```
数学与信息科学学院、教育学院、文学院、外国语学院、
物理与电子信息学院、化学与食品科学学院、音乐舞蹈学院、
美术学院、体育学院、马克思主义学院、旅游与经济管理学院、
生命科学学院、其他学院
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
12. ✅ **商品推荐** - 五级漏斗（同类目→同学院→同专业→同卖家→同学院偏好+兜底）
13. ✅ **学院/专业联动** - 注册、个人资料、筛选均支持学院→专业联动下拉
14. ✅ **搜索优化** - 搜索范围扩到5字段（name + department + major + uploader + description）；800ms防抖
15. ✅ **价格上限 9999.9** - 前后端双重校验，角为单位，超出内联提示
16. ✅ **单校专属** - college 写死"南昌师范学院"，学院/专业替代学校维度
17. ✅ **移动端搜索** - Navbar 右侧搜索图标按钮，点击展开输入框
18. ✅ **商品卡片 SPA 跳转** - `<a>` 改为 `<Link>`，无整页刷新
19. ✅ **删除用户级联标记** - 删除用户时自动标记其商品为 inactive
20. ✅ **密钥管理安全** - 全部密钥移入 .env（.gitignore），docker-compose 用 ${变量} 引用
21. ✅ **API 不返回密码哈希** - 登录/列表/详情接口均已移除 password 字段
22. ✅ **auth.js 返回值扁平化** - `createSession` 直接返回 token 字符串，响应变为 `{ token: "xxx" }`
23. ✅ **电话脱敏** - 购买前显示 138****1234，购买后显示完整号码
24. ✅ **宿舍楼定位** - 选填宿舍楼字段，方便同宿舍楼当面交易
25. ✅ **排序"离我最近"** - 同学院→同专业→同宿舍楼→同学院其他→其他学院
26. ✅ **修改学院/专业同步** - 编辑个人资料时自动更新所有在售商品信息
27. ✅ **首页统计横幅** - 展示注册人数和在售商品数，学院快捷入口
28. ✅ **求购功能** - 发布求购（名称/心理价位/描述），首页展示最新4条
29. ✅ **举报功能** - 举报商品（4种原因），非卖家登录用户可见
30. ✅ **发布页双页签** - [我要卖]/[我要买] 切换，求购表单独立
31. ✅ **购物车空引导** - 空购物车提示"去看看同学院同学在卖什么 →"
32. ✅ **管理员后台** - 数据概览/举报管理/商品管理/用户管理/申诉管理/警告管理
33. ✅ **申诉系统** - 用户可对被下架商品提交申诉，管理员审批通过/驳回
34. ✅ **通知系统** - 管理员操作后自动创建通知，critical 通知强制弹窗，info 通知铃铛角标
35. ✅ **管理员互保** - 禁止封禁/警告其他管理员（后端 403 + 前端隐藏按钮）
36. ✅ **封禁拦截** - 被封禁用户下次请求自动登出 + 重定向登录页

## 待优化/已知问题

1. **购买记录 `purchasedBy` 单对象限制** - Product 模型的 `purchasedBy` 是单个嵌入子文档，多次购买会覆盖旧记录（当前场景下可接受）
2. **商品推荐** - 阶段一为规则引擎，后续可升级为协同过滤或基于用户行为的学习模型
3. **图片底层存储** - 当前本地文件存储（`Server/uploads/`），后续可迁移到对象存储（OSS）
4. **评价/信用体系** - 缺失（P0 路线图）
5. **站内私信 IM** - 缺失（P0 路线图）
6. **商品图集轮播** - ProductPage 未渲染多图（P0 路线图）

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