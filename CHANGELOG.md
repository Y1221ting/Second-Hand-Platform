# Changelog

All notable changes to this project will be documented in this file.

## [1.11.0] - 2026-05-14

### Added
- 搜索框防抖自动搜索（400ms）：输入停止后自动触发搜索，符合主流电商交互标准
- 学校搜索框防抖自动搜索（400ms）：同上
- 中文输入法兼容：composition 事件处理，拼音输入期间不触发搜索
- Enter 键立即触发搜索：搜索框和学校搜索框支持 Enter 键快速搜索
- 筛选条件即时生效：分类下拉、排序下拉、价格滑块选择后立即刷新页面

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