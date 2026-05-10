# Changelog

All notable changes to this project will be documented in this file.

## [1.7.0] - 2026-05-10

### Added
- 新增AI智能分类功能，可根据商品名称自动推荐最合适的分类
- 发布商品页面新增"AI推荐分类"按钮

---

## [1.6.0] - 2026-05-10

### Added
- 新增AI商品描述生成功能（调用千问API）
- 发布商品页面新增"AI生成描述"按钮，可根据商品名称自动生成描述
- 新增 Server/services/aiService.js AI服务模块
- 新增 Server/controllers/aiController.js AI控制器
- 新增 Server/routes/aiRoutes.js AI路由

---

## [1.5.0] - 2026-05-10

### Changed
- 全站中文化：首页、商品列表页、筛选组件、商品卡片、侧边菜单、商品详情页、发布商品页、用户资料页等所有页面文字改为中文
- 修复 docker-compose.yml 中 REACT_APP_BASE_URL 和 CLIENT_URL 配置，改为使用相对路径通过 Nginx 代理访问后端

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
- 商品状态新增 `sold_out`（售罄）枚举值
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
