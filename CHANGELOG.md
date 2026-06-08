# Changelog

All notable changes to this project will be documented in this file.

## [2.5.0] — 2026-06-02

### 致命安全修复（Phase 1 — 阻断所有测试）

- **NoSQL 注入 — 登录/注册**（`userController.js`）：`loginUser` 和 `registerUser` 中对 `req.body.email` 加 `typeof === "string"` 校验后 `.trim().toLowerCase()`，防 `$ne`/`$regex` 操作符注入
- **NoSQL 注入 — 商品查询参数**（`productController.js`）：`getAllProducts` 中的 `search`/`category`/`department`/`userDepartment`/`sort` 等 query 参数全部加类型守卫
- **批量赋值 — 创建商品**（`productController.js`）：`createProduct` 从 `new Product(req.body)` 改为字段白名单（7 个 allowedFields），防越权修改 `status`/`uploadedBy`
- **文件上传安全加固**（`uploadController.js`）：新增 `verifyImageMagicBytes()`，读取文件头 4 字节判断真实类型（JPEG: FF D8 FF / PNG: 89 50 4E 47 / GIF: 47 49 46 38 / WebP: 52 49 46 46），替代可伪造的 MIME type 检查。SVG 直接拒绝（可内嵌 `<script>` 导致 XSS）
- **/uploads 防盗链**（`server.js`）：新增 `uploadRefererGuard` 中间件，校验 Referer 仅允许本站引用，无 Referer 放行（校内环境宽松策略）

### 隐私保护（Phase 2 — 阻断 PII 泄露）

- **商品 API PII 脱敏**（`productController.js`）：新增 `sanitizeProduct()` 三层脱敏——未认证用户移除全部 PII（phone/wechat/qq/dormitory）/ 认证非交易方仅移除敏感字段（phone/wechat/qq）/ 交易双方保留全部。应用于 `getAllProducts`/`getProductById`/`getRecommendations` 三处
- **可选认证中间件**（`authMiddleware.js`）：新增 `optionalAuth`，有 JWT 则解析用户，无则放行。用于 PII 脱敏路由——无需强制登录即可区分认证/匿名用户
- **启用 CSP**（`server.js` + `nginx.conf`）：Helmet `contentSecurityPolicy` 从 `false` 改为 Tailwind 兼容策略（`default-src 'self'` + `style-src 'unsafe-inline'`）；Nginx 层 4 个安全头（`X-Frame-Options: DENY` / `Referrer-Policy` / `Permissions-Policy` / `Content-Security-Policy`）
- **前端宿舍楼仅买家可见**（`ProductDetails.js`）：宿舍楼展示条件从"无条件"改为"仅买家/卖家可见"，与手机号的展示逻辑一致

### 内容风控（Phase 3 — 阻断违规内容）

- **用户资料违禁词**（`userController.js`）：`registerUser` 和 `updateUser` 中对 `fullName`/`wechat`/`qq` 加违禁词检查
- **求购帖违禁词**（`wantedRoutes.js`）：创建求购时对 `name`/`description` 加违禁词检查
- **商品规格违禁词**（`productController.js`）：`addSpecificationToProduct`/`updateProductSpecification` 中对 `key`/`value` 加违禁词检查
- **违禁词列表扩充 + 公共化**（`bannedKeywords.js`）：扩充至 50+ 条，覆盖电子书倒卖/隐形眼镜/宠物活体/化妆品分装/自制食品等校园品类。`checkBanned()` 从 productController 提取为公共函数，5 处引用点统一生效

### 基础设施加固（Phase 4 — 运维安全 + UX）

- **Docker 非 root 运行**（`Server/Dockerfile`）：新增 `adduser -S appuser` + `USER appuser`，容器进程不再以 root 运行
- **PM2 进程管理**（`Server/Dockerfile` + `package.json`）：CMD 改为 `pm2-runtime server.js`，提供崩溃自动重启 + 日志管理 + 内存监控；`package.json` 新增 `"start": "node server.js"`
- **API 内存缓存**（`server.js`）：新增 `cache(ttlSeconds)` TTL Map 中间件，`/api/majorMap`（1h）/ `/api/stats`（60s）。缓存存储在内存中，容器重启清空
- **登录反枚举**（`userController.js`）：所有登录失败统一返回"邮箱或密码错误"，不区分"用户不存在"和"密码错误"；锁定提示不暴露剩余分钟数/尝试次数
- **密码长度前后端一致**（`userController.js` + `Register.js`）：前端校验和后端 Controller 统一为 `< 8` → 拒绝，与 Mongoose Schema `minlength: 8` 一致
- **PIPL 同意复选框**（`Register.js`）：注册提交前必须勾选"已阅读并同意《隐私政策》《用户协议》"，未勾选禁用注册按钮
- **隐私政策入口增强**（`Navbar.js`）：用户下拉菜单新增"隐私政策"链接

### P0 安全/稳定性修复

- **全局错误处理**：Express error middleware + `process.on('unhandledRejection')` + `process.on('uncaughtException')`，防止未捕获异常导致进程静默崩溃
- **Node 堆内存显式限制**：docker-compose.yml backend 新增 `NODE_OPTIONS=--max-old-space-size=200`，配合 Docker 256MB 硬限防止 OOM
- **全局 API 限流**（`server.js`）：`/api` 所有路由 100 次/分钟轻度限流（express-rate-limit），login/register 保持原有严格限流
- **静态文件缓存**：`/uploads` 图片增加 `maxAge=7d` + `etag` + `lastModified`，减少重复请求
- **卸载 bcrypt**：只留 bcryptjs（纯 JS），移除 bcrypt C++ 编译依赖（清理 42 个包）

### 运维完善

- **新增 `.dockerignore`**：Server/ 下排除 node_modules/.env/uploads/日志，build context 从 ~100MB 降到 ~5MB
- **CORS 域名管理**：支持 `CLIENT_URL` 逗号分隔多域名，origin 校验函数动态匹配

### 文档同步

- **CHANGELOG.md**：更新 v2.5.0 完整变更记录（8 致命 + 11 必改 + 1 优化，4 Phase）
- **STUDY.md**：安全章节扩充至 Phase 1-4 全部 20 项 + 新增第 12 章"安全加固操作指南"（验证表格 + 部署流程 + 监控命令 + 故障处理 + CORS 管理）
- **memory/security-fix-plan.md**：全量修复清单，分 Phase 执行记录

---

## [2.5.1] — 2026-06-07

### 安全修复

- **IDOR — `getUserById` 隐私泄露**（`userController.js`）：非本人查询时脱敏隐藏 `phoneNo`/`wechat`/`qq`/`email`/`dormitory`
- **IDOR — `getPurchasedProducts` 越权访问**（`productController.js`）：添加所有权校验，仅允许查看自己的购买记录
- **MongoDB 连接加固**（`db.js`）：优先使用 `MONGODB_URI_FULL`（Docker 内部网络），公网 URI 改为 localhost
- **MongoDB 公网暴露验证**：确认 `docker-compose.yml` 端口绑定为 `127.0.0.1:27017`，公网不可达

### 新增文档

- **上线开发文档**（`上线开发文档.md`）：9 模块完整上线清单（安全检查/HTTPS/加固/监控/备份/CI/运营/性能/应急）
- **CLAUDE.md**：项目执行公约，定义五步工作流程

### 文档清理

- 删除 `STUDY.md`（严重过时约 60%，且泄露数据库密码）
- 删除 `development.md`（重构实施手册，已完成历史使命）
- 更新 `DEVELOPER_MANUAL.md`：调整 git 规范、清理过期交叉引用

---

## [2.6.0] — 2026-06-08

### Phase 1 — 快速修复

- **商品卡片按钮语义修正**（`ProductCard.js`）：「购买」→「查看」，图标 `FaBolt` → `FaEye`，消除认知误导
- **购物车结算补收货确认弹窗**（`Cart.js` + `cartController.js`）：`window.confirm` 替换为 Dialog 组件，`checkoutCart` 接受 body 覆盖字段（与 `purchaseProduct` 一致），两条购买路径统一
- **页面 title + meta**（`index.html`）：`"React App"` → `"校园二手市场 - SecondHand"`，新增 `lang="zh-CN"` 和 meta description
- **商品不存在 404 处理**（`ProductDetails.js`）：`notFound` 状态 + 😕 提示 + 返回首页链接

### Phase 2 — 体验升级

- **移动端底部 Tab 栏**（`Navbar.js`）：固定底部导航（首页/发布/购物车/通知/我的），`<body>` 加 `padding-bottom: 4rem` 防止内容被遮挡
- **骨架屏替代 Loading**（`SkeletonCard.js` + `Home/index.js`）：8 张 `animate-pulse` 骨架卡片，展示商品卡片布局占位
- **价格去 `.0`**（`ProductCard.js` + `ProductDetails.js`）：`formatPrice` 函数，整数去小数位，非整数保留一位
- **审核状态提示条**（`Navbar.js`）：inactive 用户顶部黄色提示条「您的账号正在审核中」，可关闭（localStorage 缓存）
- **图片上传预览**（`AddProduct.js`）：选择后显示缩略图网格 + 删除按钮，`URL.createObjectURL` + `useRef` 清理防内存泄漏
- **API 请求失败 ErrorBanner**（`ErrorBanner.js`）：统一 ⚠️ 错误提示 + 重试按钮，应用于 Home 首页 / ProductDetails 详情页
- **网络断连离线提示**（`App.js`）：`navigator.onLine` + `online`/`offline` 事件监听，红色固定提示条
- **注册成功页面**（`Register.js`）：`alert()` → ✅ 注册成功页面，带「先去逛逛」和「回到登录」按钮
- **登录页待审核出口**（`Login.js`）：错误包含「审核」时显示「先去逛逛 →」链接
- **越权修复**（`productController.js` + `cartController.js`）：`purchaseProduct` 和 `checkoutCart` 加 inactive 用户检查

### Phase 3 — 功能补全

- **统一 Lightbox 组件**（`Lightbox.js` + `ProductDetails.js`）：抽取独立组件，支持单图/多图/键盘导航（ESC 关闭/左右切换），替换内联灯箱代码（-40行）
- **Footer 死链接清理**（`Footer.js`）：「交易规则」补 /faq 链接，删除无对应页面的「联系客服」「平台介绍」「意见反馈」
- **空规格引导文案**（`ProductDetails.js`）：卖家看到「编辑商品可添加规格参数」，买家看到「卖家暂未填写规格参数」
- **空购物车推荐商品**（`Cart.js`）：空购物车时展示「猜你喜欢」推荐列表
- **联系卖家功能**（`ContactSeller.js` + `productController.js` + `productRoutes.js`）：新增 `GET /api/products/:id/seller-contact` 接口（登录可见，手机号脱敏）+ 弹窗组件（一键复制，兼容 HTTP 环境）
- **Dashboard 趋势图**（`adminRoutes.js` + `Dashboard.js`）：新增 `GET /api/admin/stats/trend` 接口，纯 CSS 柱状图显示近 7 天新增用户/商品/举报趋势
- **Dashboard 待办事项**（`Dashboard.js`）：数字卡片下方新增待办区块，待审核用户/待处理举报一键跳转，已处理显示 ✅
- **用户详情抽屉**（`adminRoutes.js` + `Users.js`）：新增 `GET /api/admin/users/:id/detail` 聚合接口，「查看」按钮替代「警告」，右侧滑出面板（用户信息/商品/购买/警告记录/操作）

### Mobile — 移动端体验优化（第一期）

- **管理后台侧边栏移动端折叠**（`AdminLayout.js`）：固定侧边栏改为移动端汉堡菜单 + 滑出覆盖层 + 过渡动画
- **购物车列表响应式**（`Cart.js`）：移动端商品行改为双行布局，触控区域加大（进行中）
- **更多优化计划**：参见 `移动端体验优化方案.md`

### 文档同步

- **CHANGELOG.md**：更新 v2.6.0 完整变更记录
- **CLAUDE.md**：项目执行公约持续遵守

---

## [2.4.0] — 2026-06-01

### 全量安全审计 + 修复（14 漏洞 + 12 索引）

**致命漏洞修复**
- JWT 密钥去硬编码回退 `"your-secret-key"`，未设置环境变量拒绝启动
- `updateProductStatus` / 5 个图片规格端点加所有权校验
- `GET /api/users/` 加 auth + 分页 + 脱敏（activeSessions/cart）
- `GET /api/users/:id` 加 auth + 去 activeSessions
- AI 路由加 authMiddleware（防刷 API 费用）

**高危修复**
- adminRoutes `$regex` 搜索参数转义（NoSQL 注入防护）
- `updateProductById` 改为字段白名单（防修改 status/uploadedBy）
- `updateUser` 响应去 password 哈希
- appealRoutes 去内部 ID 泄露

**中低修复**
- wantedRoutes 公开列表去手机号
- 用户列表加分页防全量拉取

**数据库索引（12 个新增）**
- Product: category/department/uploadedBy.id/purchasedBy.id 复合索引
- Warning: userId+isRead+createdAt
- Report: status+createdAt
- Appeal: sellerId+createdAt, status+createdAt, 查重索引
- Wanted: createdAt

**其他**
- nginx 加 `X-Forwarded-For` + Express `trust proxy`（限流 IP 识别修复）
- express-rate-limit 降级容错（未安装时跳过）

---

## [2.3.0] — 2026-06-01

### 多设备登录互踢 + 同浏览器账号互斥

**后端**
- `User` 模型新增 `activeSessions` 数组（`{ sessionId, device, loginAt }`），限制只保留 1 个活跃 session
- `config/auth.js` — `createSession` 使用 `crypto.randomUUID()` 生成唯一 sessionId 并写入 JWT payload
- `authMiddleware` — 验证 JWT 后比对 sessionId 是否在 `activeSessions` 中，不在则 401 `SESSION_EXPIRED`
- `userController.loginUser` — 登录时存储 session，`activeSessions` 超过 1 个自动踢旧
- `userController.logoutUser`（新增）— 清除对应 sessionId
- `POST /api/users/logout` — 新增登出路由

**前端**
- `utils/sessionGuard.js`（新建）— 全局 fetch 拦截器，检测 401 `SESSION_EXPIRED` 自动清登录态派发事件
- `authContext` — login 时先调旧账号 logout 再设新状态 + 监听 `storage` 事件实现跨标签页互踢 + 监听 `session-expired` 事件
- `Login` — 支持 `?session_expired=1` 参数显示"账号已在其他设备登录"黄色提示

---

## [2.2.0] — 2026-06-01

### P0 优化 — 评价系统 + 站内私信 + 商品图集

**后端**
- 新增 `Review` 模型：评分 1-5 星，买卖双方互评，一个订单仅一次
- 新增 `Conversation` / `Message` 模型：会话 + 消息 + 已读/未读状态
- 新增 `reviewRoutes`：创建评价 / 用户评价列表 / 评分统计 / 商品评价
- 新增 `messageRoutes`：会话列表 / 创建会话 / 消息列表 / 发送消息 / 未读总数

**前端**
- `ProductDetails` — 图片轮播（主图+缩略图+灯箱全屏预览）+ 卖家信用展示 + "联系卖家"按钮
- `UserProfile` — 新增"评价"Tab（评分统计卡片 + 评价列表）
- `ConversationList`（新建）— 会话列表 + 未读角标 + 关联商品预览
- `ChatWindow`（新建）— 聊天窗口（气泡UI + 5s轮询 + 已读/未读）
- `Navbar` — 新增消息图标 + 蓝色未读角标（15s轮询）
- `AdminLayout` — 侧边栏底部"返回首页"链接
- `App.js` — 新增 `/messages` 和 `/messages/:conversationId` 路由

---

## [2.1.0] — 2026-06-01

### 通知系统 + 管理员互保

**后端**
- Warning 模型扩展：新增 `type`（warning / product_delisted / account_banned / appeal_result）、`severity`（info / critical）、`metadata` 字段
- 管理员互保：禁止封禁/警告其他管理员（后端 403 + 前端灰色标签）
- 管理操作后自动创建 Warning 通知：
  - 封禁/解封用户 → account_banned
  - 下架/恢复商品 → product_delisted
  - 处理举报（通过）→ product_delisted
  - 处理申诉（通过/驳回）→ appeal_result
  - 发送警告 → warning
- 新增 `GET /api/warnings/critical` — 供前端弹窗检测用

**前端**
- 新增 `NotificationContext` — 30s 轮询 critical 通知 + 未读数统计
- 新增 `NotificationModal` — 强制弹窗，按通知类型显示差异化图标，支持多条排队
- Navbar 铃铛角标改为共享 `unreadCount`
- `ProtectedRoute` 封禁用户自动登出 + 重定向登录页
- `Login` 页显示"该账号已被封禁"提示
- `Admin/Users` 管理员行隐藏操作按钮
- `Warnings` 页按 type 分类渲染（图标 + 颜色标签 + 申诉状态）

---

## [2.0.0] - 2026-06-01

### 单校版本改造（南昌师范学院）

#### 第一阶段 — 数据模型 + 注册 + 个人中心
- **新增 `majorMap.js`** — 13学院→专业映射配置，支持学院/专业联动
- **新增 `GET /api/majorMap`** — 前端获取学院列表接口
- **User 模型扩展** — 新增 `department`(学院/enum)、`major`(专业)、`dormitory`(宿舍楼/选填) 字段
- **registerUser 改造** — `college` 写死为"南昌师范学院"，接收 department/major/dormitory
- **updateUser 同步商品** — 修改学院/专业时自动更新所有在售商品的对应字段
- **Register.js 重写** — 删除学校自由输入，改为学院下拉 + 专业联动下拉 + 宿舍楼选填
- **UserProfile 更新** — 展示区显示学院·专业·宿舍楼
- **UserDetails 重写** — 编辑模式用学院/专业下拉替代学校输入

#### 第二阶段 — 商品全链路
- **Product 模型改造** — SellerSchema 扩展 department/major/dormitory/phone；category 枚举从英文10种改为中文9种（教材教辅、电子数码、生活用品、体育用品、服饰美妆、文具办公、宿舍神器、乐器爱好、其他）；新增 listedByDepartment/listedByMajor 冗余字段
- **createProduct 改造** — 自动写入学院/专业/宿舍楼到 uploadedBy 和 listedByDepartment/Major
- **purchaseProduct 改造** — boughtBy 写入完整学院/专业/宿舍楼信息
- **getAllProducts 改造** — 搜索字段从3个扩到5个（新增 department、major、description）；筛选从 college 改为 department；排序新增"离我最近"
- **getRecommendations 改造** — 五级漏斗从"同类目→同校→同卖家→同校偏好→兜底"改为"同类目→同学院→同专业→同卖家→同学院偏好+兜底"
- **AI 服务适配** — 生成描述 Prompt 改为校园同辈口吻；推荐分类 Prompt 改为中文9分类
- **AddProduct.js 改造** — 分类下拉改为中文9种；规格建议标签同步更新
- **ProductCard.js 改造** — 商品卡片显示"XX学院 · XX专业"替代学校名
- **ProductDetails.js 改造** — 详情页显示学院·专业·宿舍楼；电话脱敏（未购买显示 138****1234）
- **Recommendations 改造** — college 参数改为 department + major
- **Filters 重写** — 学校搜索框改为学院+专业联动下拉；分类改为中文；排序新增"离我最近"
- **Home/index.js 改造** — 筛选状态从 college 改为 department/major；集成 majorMap 联动逻辑

#### 第三阶段 — 首页布局 + 求购 + 举报 + 购物车引导
- **新增 Report 模型和路由** — 支持举报商品（虚假信息/违禁商品/重复发布/其他），需登录
- **ProductCard 举报按钮** — 非卖家登录用户可见 `FaFlag` 举报按钮，点击弹出举报面板
- **新增 HomeBanner 组件** — 首页顶部统计横幅，展示注册人数和在售商品数 + 学院快捷入口
- **新增 Wanted 模型和路由** — 求购功能，字段：name/budget/description/postedBy；GET 接口按最新排序
- **AddProduct 页签切换** — 新增 [我要卖]/[我要买] 双页签，求购表单含商品名称/心理价位/描述
- **新增 WantedList 组件** — 首页展示最新求购（绿色边框卡片），无数据不渲染
- **UserProfile 购物车引导** — 空购物车提示"去看看同学院同学在卖什么 →"
- **删除 colleges.js** — 38校常量文件无引用，已清理

---

## [1.20.0] - 2026-05-30

### 申诉系统 + 管理员后台

**后端**
- 新增 `Appeal` 模型 + 路由（用户提交申诉 / 管理员处理申诉）
- 新增 `Warning` 模型 + 路由（用户查看警告 / 标记已读）
- 新增 `adminRoutes` — 数据概览 / 举报管理 / 商品管理 / 用户管理 / 警告管理 / 申诉管理
- 新增申诉处理：通过 → 自动恢复商品；驳回 → 更新商品 delistReason
- 下架商品写入 `delistReason` 字段
- 购物车校验：下架商品在购物车中显示为"已失效"

**前端**
- 新增 `AdminLayout` — 管理后台侧边栏布局 + 6 个导航项
- 新增 `Dashboard` — 6 项统计卡片
- 新增 `AdminReports` — 举报列表 + 处理面板
- 新增 `AdminProducts` — 商品管理 + 下架/恢复 + 搜索/状态筛选
- 新增 `AdminUsers` — 用户管理 + 封禁/解封 + 发送警告
- 新增 `AdminAppeals` — 申诉列表 + 通过/驳回
- 新增 `AdminWarnings` — 已发送警告记录
- 新增 `Warnings` — 用户端通知列表 + 全部/未读/已读筛选 + 点击已读
- 新增 `AppealForm` / `AppealList` — 申诉提交 + 状态查看
- 路由：`/admin/*`（ProtectedRoute requireAdmin）、`/warnings`（ProtectedRoute）
- MongoDB 容器内存限制 768MB + `--wiredTigerCacheSizeGB 0.5`

---

## [1.18.0] - 2026-05-27

### Performance
- **代码分割（Code Splitting）** — `React.lazy` + `Suspense` 分离低频页面（UserProfile/AddProduct/EditProduct/Cart），首屏 JS 体积减少约 139-185 KiB
- **Login/Register 保留同步加载** — 高频入口页懒加载反而增加首次渲染延迟，实测后改回同步
- **新增 ErrorBoundary** — chunk 加载失败时显示"页面加载失败"+刷新按钮，避免白屏
- **Nginx Gzip 压缩** — 开启 gzip，文本/JS/CSS/JSON 超过 1KB 自动压缩
- **Nginx 静态资源强缓存** — JS/CSS（带 hash）缓存 1 年 + `immutable`，图片缓存 30 天
- **CLS 修复** — 商品详情页和卡片图片设 `width`/`height` 固定比例 + `aspectRatio: 4/3` 容器
- **原生懒加载替代自定义 IntersectionObserver** — `<img loading="lazy">` 改用浏览器原生实现，消除首屏图片被 JS 推迟下载的问题

### Accessibility
- **Login.js 按钮对比度修复** — `text-white` → `text-gray-900`（黄底白字 2.3:1 → 黄底深灰字 5.5:1，达标 WCAG AA）
- **Filters.js 表单标签** — select 增加 `id` + `htmlFor` 关联 label
- **Navbar.js aria-label** — 搜索按钮增加 `aria-label="搜索"`
- **Home.js `<main>` 标签** — 增加 landmark 标记

### Security
- **Nginx 安全头** — 增加 `X-Content-Type-Options: nosniff`，防止 MIME 类型嗅探

## [1.17.0] - 2026-05-24

### Security
- **loginUser 移除密码返回** — toObject() 后 delete password，API 响应不再包含密码哈希
- **getAllUsers 排除密码字段** — 查询列表加 `.select("-password")`
- **getUserById 排除密码字段** — 返回前 delete password
- **密钥移入 .env 文件** — docker-compose.yml 中所有密钥改为 `${变量}` 引用，由 Docker Compose 自动读取 .env，避免密钥泄漏到 Git
- **body-parser 请求体限制降为 10MB** — 从 50MB 减低 DoS 攻击面

### Fixed
- **🔴 auth.js 返回值嵌套** — `createSession` 返回 `{ token }` 导致响应结构为 `{ token: { token: "xxx" }}`，前端需用 `data.token.token` 才能拿到 Token。已改为直接返回 token 字符串，响应变为扁平的 `{ token: "xxx" }`
- **ProductCard `<a>` 整页刷新** — 改用 `<Link>` 实现 SPA 无刷新跳转
- **移动端无法搜索** — Navbar 右侧新增搜索图标按钮，点击展开输入框
- **删除用户后商品变孤儿** — deleteUser 级联标记该用户所有商品为 `inactive`
- **价格输入弹 alert 弹窗** — 改为输入框下方内联红色错误提示，不阻塞操作

### Changed
- **Navbar 导航栏** — 添加 `relative` 定位，新增 `isMobileSearchOpen` 状态管理
- **AddProduct 价格校验** — 超越 9999.9 上限时显示红色提示文字而非 `alert()`

---

## [1.16.0] - 2026-05-22

### Added
- **推荐系统（阶段一：规则引擎）**：后端新增 `GET /api/products/recommendations`，五级漏斗推荐（同类目 → 同校 → 同卖家 → 用户同校 → 最新兜底），路由需放在 `/:id` 之前
- 新增 `Recommendations.js` 组件，嵌入商品详情页底部（"猜你喜欢"），静默模式无数据不渲染
- **商品卡片双按钮布局**：价格和操作分两行，下方排列"加入购物车"和"立即购买"两个按钮
- **购物车系统完善**：addToCart 支持可选 `quantity` 参数（默认1），增加正整数校验和库存上限检查；checkoutCart 批量结算
- **登录/注册错误反馈**：Login.js 登录失败显示红色错误框，重新输入自动清除；Register.js 注册成功弹出 `alert("注册成功！请登录")` 提示
- **权限路由修复**：authContext 同步初始化 localStorage，解决页面刷新自动退出登录的问题

### Changed
- **搜索范围优化**：关键字搜索从 `name + description` 改为 `name + uploadedBy.college + uploadedBy.name`，不再搜索商品描述
- **学院筛选改为模糊搜索**：从精确匹配改为 `$regex` 模糊搜索，Filters 下拉框选学校后自动触发搜索
- **搜索框行为优化**：搜索后保留输入内容，空搜索时重置为全部商品；分页页码与 URL 参数 `?page=` 绑定，刷新不丢失
- **价格显示优化**：从 `toFixed(2)` 改为 `toFixed(1)`（角为单位），上限 9999.9，前后端双重校验
- **导航文案修正**：Footer「首页」→「网站首页」；Navbar「我的交易」→「个人中心」
- **商品列表布局**：Grid 响应式布局代替 flex-wrap：`grid-cols-1 sm:2 lg:3 xl:4`
- **个人商品卡片**：Profile/ProductList 改为紧凑横条布局（80px 小图 + 名称 + 价格 + 日期）
- **UserDetails 字段合并**：删除 `city/state/zipCode` 独立字段，所有地区统一走 `address` 一个字段
- **User Schema**：新增 `timestamps: true`，自动记录创建时间和更新时间
- **购物车数据获取**：UserProfile 挂载时即获取购物车数据，不再依赖 activeTab 切换
- **购物车结算**：checkoutCart 中 `purchasedBy` 从 `$push` 改为 `$set`，确保最后一次购买者信息正确

### Fixed
- **严重⚠️ 库存 API 验证缺陷**：addToCart 和购买接口传递负值、0 或超大值（如999）时返回 200 成功——已增加 `quantity > 0`、`正整数`、`不超过库存` 三重校验，buyProduct 增加 `$gt: 0` 查询条件
- **auth.js 返回值嵌套**：登录接口返回 `{token:{token:...}}`，前端读取 `data.token.token` 才能获取实际 Token——需修复为 `{token: "xxx"}` 扁平结构
- **cartController.removeFromCart/updateQuantity**：修复为返回 populate 后的完整购物车数据
- **Filters 左侧搜索框移除**：顶部搜索框统一负责搜索，Filters 不再有独立的搜索输入框

---

## [1.15.0] - 2026-05-21

### Added
- 购物车系统第一阶段：User 模型新增 `cart` 字段，支持存储多个商品（productId、quantity、addedAt）
- 新增 `Server/controllers/cartController.js`，包含 6 个购物车 API（获取、添加、移除、更新数量、清空、批量结算）
- 新增 `Server/routes/cartRoutes.js`，所有购物车接口注册在 `/api/cart` 路由下
- `server.js` 注册 `/api/cart` 路由

---

## [1.14.0] - 2026-05-14

### Added
- 图片文件存储：新增 `multer` 上传接口 `POST /api/upload`，图片不再存为 base64，转存 `Server/uploads/` 目录，数据库只存路径
- 前端图片自动压缩：选择 >1MB 图片时自动压缩至 1920px 宽、80% JPEG 质量，上传更快更省空间
- 前端路由权限保护：新增 `ProtectedRoute` 组件，未登录访问敏感页面自动跳转登录页
- 旧图片迁移脚本：`Server/scripts/migrateBase64Images.js`，一键将旧 base64 图片转为文件
- `nginx.conf` 新增 `/uploads/` 反向代理配置，支持图片文件静态访问

### Changed
- 购买接口改为原子操作：`findOneAndUpdate` + `$inc: {quantity: -1}` + `{quantity: {$gt: 0}}` 条件，彻底解决并发超卖
- 后端单图上传限制从 5MB 调至 20MB（兜底限制，前端压缩后通常 <300KB）

### Fixed
- **严重⚠️** `DELETE /api/users/:userId` 缺少认证中间件，任何人可删除任意用户——已添加 `authMiddleware` + 本人身份校验
- **严重⚠️** `PUT /api/users/:userId` 缺少本人校验，用户 A 登录后可修改用户 B 的资料——已添加 `req.user._id !== userId` 检查
- **严重⚠️** `config/auth.js` 未导出 `SECRET` 变量，导致 `authMiddleware.js` 读取密钥为 `undefined`，所有需认证的接口全部返回 401——已补上 `module.exports` 导出
- **严重⚠️** `nginx` 未转发 `Authorization` 请求头，上传图片和所有需要认证的 API 均返回 401——添加 `proxy_set_header Authorization $http_authorization`
- `findByIdAndUpdate` 未启用 `runValidators: true`，价格校验不生效——已补上
- `ProductSchema.index()` 定义在 `mongoose.model()` 之后导致索引不生效——已调整顺序并新增 `{createdAt: -1}` 排序索引
- 购买弹窗收集的表单数据未发送至后端（Dialog 填写的信息被白费）——`handleConfirmPurchase` 已补上 `body`
- `EditProduct.js` 未校验当前用户是否为商品所有者——已添加 `useAuth` + 后台查询对比 `uploadedBy.id`
- `UserProfile.js` 编辑按钮对所有登录用户可见——改为 `displayEdit={user.id === userId}` 仅自己可见
- `AddProduct.js` 中 `user` 变量未被使用、`getBase64` 函数已成为死代码

### Performance
- 前端图片压缩大幅减小上传体积（10MB 照片 → 约 200KB）
- MongoDB 不再存储大体积 base64 数据，库体积显著减小
- 文本搜索 + createdAt 排序索引已生效，查询性能提升

## [1.12.0] - 2026-05-14

### Fixed
- 修复 productController.js 中用户字段不一致问题：`req.user.name` → `req.user.fullName`（发布商品 + 购买商品），解决卖家/买家信息显示为 undefined 的问题
- 修复 EditProduct.js 中 `user.name` → `user.fullName`，保持字段一致性
- 修复 Dialog.js 购买弹窗 404 错误：购买前检查用户登录状态，未登录时跳转登录页，避免传递 null userId

### Security
- JWT 密钥硬编码修复：auth.js 和 authMiddleware.js 改为从环境变量 `process.env.JWT_SECRET` 读取
- docker-compose.yml 新增 `JWT_SECRET` 环境变量配置

### Changed
- 货币符号统一：ProductDetails.js、ProductCard.js、Profile/ProductList.js 中 `₹`（印度卢比）→ `¥`（人民币）
- 分类筛选器完善：Filters.js 添加"其他"（other）分类选项，与后端 10 种分类完全一致
- Mongoose 连接优化：db.js 移除已弃用的 `useNewUrlParser` 和 `useUnifiedTopology` 选项

### 界面汉化
- EditProduct.js：标题"Edit Product" → "编辑商品"
- ProductForm.js：分类选项从旧分类（mattress、air cooler、cycles）替换为 10 种新分类，所有英文标签改为中文（商品名称、分类、描述、价格、图片、规格参数、添加、删除、保存修改等）
- Profile/ProductList.js：标题"My Products" → "我的商品"，"Uploaded on" → "发布于"，"View Product" → "查看商品"
- Navbar.js："Sign In" → "登录"
- FormField.js：错误提示"This field is required" → "此项为必填"
- ConfirmDialog.js：全部英文改为中文（"确定要删除此商品吗？"、"取消"、"删除"）

---

## [1.11.0] - 2026-05-14

### Added
- 搜索框防抖自动搜索（800ms）：输入停止后自动触发搜索，符合主流电商交互标准
- 学校搜索框防抖自动搜索（800ms）：同上
- 中文输入法兼容：composition 事件处理，拼音输入期间不触发搜索
- Enter 键立即触发搜索：搜索框和学校搜索框支持 Enter 键快速搜索
- 筛选条件即时生效：分类下拉、排序下拉、价格滑块选择后立即刷新页面
- 分页组件优化：新增 totalItems 属性，根据后端返回的 totalPages 计算总页数，避免手动计算
- <快速导航>实际跳转

### Changed
- 学校列表从印度院校替换为江西省内 38 所本科院校（南昌大学、江西师范大学、江西财经大学等）
- 移除搜索按钮，改为防抖自动搜索，交互方式与淘宝、京东一致
- 提示文字改为"搜索商品..."和"搜索学校..."

### Fixed
- 修复搜索框输入中文卡顿问题（之前每次输入都触发请求，导致页面刷新无法打字）
- 修复学校搜索框输入中文卡顿问题（同上）
- 修复中文输入法拼音输入期间触发搜索的问题

---

## [1.10.0] - 2026-05-13

### Added
- 后端分页 + 搜索功能：Product 模型添加 name/description 文本索引，getAllProducts 接口支持 page、limit、search、category、college、sort、minPrice、maxPrice 参数
- 前端首页适配后端分页：Filters 筛选条件变化时自动请求后端，Pagination 组件改用后端返回的 totalPages

### Fixed
- 修复 Dialog.js 购买弹窗传错用户 ID 的问题（之前传的是卖家 ID，改为当前登录用户 ID）
- 修复 Dialog.js 缺少加载状态和错误提示的问题（新增 loading、fetchError 状态，网络异常时友好提示）
- 修复 ProductDetails.js 和 EditProduct.js 中残留的 process.env.REACT_APP_BASE_URL 环境变量引用

---

## [1.9.0] - 2026-05-13

### Added
- 商品分类从 6 种扩展为 10 种：新增 furniture（家具）、clothing（服装鞋帽）、sports（运动户外）、food（食品生鲜）、transportation（交通工具）、beauty（美妆个护）、home（家居日用）
- 购买记录功能：Product 模型新增 purchasedBy 字段记录购买者信息
- 新增 GET /api/products/purchased/:userId 接口，根据用户 ID 查询购买记录
- 个人资料页（UserProfile）新增"我发布的"和"我购买的"两个标签页切换
- ProductList 组件新增 showDelete 属性，购买记录列表隐藏删除按钮
- AI 分类推荐（aiService.js）同步更新为 10 种分类

### Changed
- 购买接口（POST /api/products/:id/purchase）自动记录购买者信息（id、name、college）
- 购买后商品状态更新逻辑：库存归零时标记 sold_out，否则标记 sold

---

## [1.8.0] - 2026-05-13

### Added
- 页脚（Footer.js）全部中文化
- 发布商品页（AddProduct.js）新增防重复提交功能（submitting 状态，按钮显示"发布中..."并禁用）
- 购买弹窗（Dialog.js）全部中文化，新增省份-城市联动选择（支持全国 34 个省级行政区）
- 新增 FormField 组件，统一表单字段样式和错误提示

### Changed
- 所有前端 API 请求从 `${process.env.REACT_APP_BASE_URL}/api/...` 改为相对路径 `/api/...`，通过 Nginx 代理转发到后端，解决前后端连接问题
- 前端 Dockerfile 优化：不再在服务器上构建前端，改为直接使用本地 npm run build 生成的 build/ 文件夹
- nginx.conf 配置 /api/ 反向代理到 backend:8000

---

## [1.7.0] - 2026-05-10

### Added
- 新增 AI 智能分类功能，可根据商品名称自动推荐最合适的分类
- 发布商品页面新增"AI推荐分类"按钮
- 新增 Server/controllers/aiController.js 中 recommendProductCategory 方法
- 新增 Server/routes/aiRoutes.js 中 POST /api/ai/recommend-category 路由
- 新增 Server/services/aiService.js 中 recommendCategory 函数

---

## [1.6.0] - 2026-05-10

### Added
- 新增 AI 商品描述生成功能（调用通义千问 Qwen API）
- 发布商品页面新增"AI生成描述"按钮，可根据商品名称自动生成描述
- 新增 Server/services/aiService.js AI 服务模块
- 新增 Server/controllers/aiController.js AI 控制器
- 新增 Server/routes/aiRoutes.js AI 路由

---

## [1.5.0] - 2026-05-10

### Changed
- 全站中文化：首页、商品列表页、筛选组件、商品卡片、侧边菜单、商品详情页、发布商品页、用户资料页等所有页面文字改为中文
- 修复 docker-compose.yml 中 REACT_APP_BASE_URL 和 CLIENT_URL 配置

---

## [1.4.0] - 2026-05-10

### Changed
- 注册页面（Register.js）简化表单：移除 collegeId、city、state、zipCode 字段，仅保留 email、password、fullName、college、phoneNo、address 六个字段
- 注册页面全部中文化：标题、占位符、错误提示、按钮、链接均改为中文
- 登录页面（Login.js）全部中文化：标题、占位符、按钮、链接均改为中文

---

## [1.3.0] - 2026-05-09

### Added
- 新增商品库存管理功能（quantity 字段）
- 新增商品购买接口（POST /api/products/:id/purchase），自动扣减库存
- 前端商品详情页和列表页显示库存数量
- 前端购买按钮根据库存状态显示"已售罄"或"立即购买"
- 商品列表页自动刷新：切换到页面时自动重新获取最新数据
- 筛选和搜索实时生效：修改筛选条件后立即更新商品列表，无需点击"Apply Filters"

### Changed
- 修改购买逻辑：从删除商品改为扣减库存并更新状态
- 商品状态新增 sold_out（售罄）枚举值
- 购买成功后自动刷新商品详情，不再跳转首页
- 商品卡片和详情页区分发布者：发布者看到"我的商品"/"这是您的商品"，不再显示购买按钮
- 筛选逻辑重构：分离数据获取和筛选逻辑，筛选条件变化时自动重新筛选
- 移除 Filters 组件中的"Apply Filters"按钮，改为实时生效

### Fixed
- 修复购买功能直接删除商品导致数据丢失的问题
- 修复前端购买按钮未处理售罄状态的问题
- 修复前端购买成功后数据不刷新的问题（现在购买后会自动重新获取商品详情）
- 修复商品卡片布局错乱问题（库存信息与上传者信息同行显示）
- 修复登录后未保存 Token 导致后续操作失败的问题（Login.js）
- 修复退出登录未清除 Token 的问题（authContext.js）
- 修复发布商品、编辑商品、删除商品、更新个人信息缺少 Token 认证的问题
- 修复已登录用户无法查看他人资料的问题（UserProfile.js）
- 修复购买弹窗表单验证形同虚设的问题（Dialog.js）
- 修复发布者可以购买自己商品的问题（后端增加越权检查）
- 修复购买后返回首页库存数量不刷新的问题（visibilitychange 自动刷新）

---

## [1.2.0] - 2026-05-08

### Security
- 为商品添加、更新、删除接口添加 Token 验证中间件
- 添加越权检查：用户只能更新/删除自己发布的商品（返回 403 Forbidden）
- 修复 authMiddleware 密钥不一致导致 Token 验证失败的问题

### Fixed
- 修复添加商品时缺少必填字段返回 500 错误的问题（现在正确返回 400 Bad Request）
- 修复添加商品时价格为负数返回 500 错误的问题（现在正确返回 400 Bad Request）
- 修复更新商品时价格为负数返回 200 的问题（现在正确返回 400 Bad Request）
- 修复 Get Products by User 接口返回 500 错误的问题（修复了查询字段名不匹配）

### Added
- 商品创建时自动关联当前登录用户信息（uploadedBy）

---

## [1.1.0] - 2026-04-28

### Fixed
- 修复用户注册时密码长度校验失效的问题（密码在加密后长度变长，导致 minlength 校验失效）
- 修复注册接口缺少必填字段时返回 500 错误的问题（现在正确返回 400 Bad Request）
- 修复注册时手机号格式错误返回 500 错误的问题（现在正确返回 400 Bad Request）

### Security
- 为更新用户信息接口 (PUT /api/users/:userId) 添加 Token 验证中间件
- 创建 authMiddleware.js 用于统一处理 JWT Token 验证

### Added
- 新增 Server/middleware/authMiddleware.js 权限验证中间件

---

## [1.0.0] - 2026-04-20

### Added
- 初始版本发布
- 用户注册、登录、CRUD 功能
- 商品发布、浏览、CRUD 功能
- MongoDB 数据库集成
- React 前端界面