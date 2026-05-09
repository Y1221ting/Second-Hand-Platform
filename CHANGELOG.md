# Changelog

All notable changes to this project will be documented in this file.

## [1.3.0] - 2026-05-09

### Added
- 新增商品库存管理功能（quantity 字段）
- 新增商品购买接口（POST /api/products/:id/purchase），自动扣减库存
- 前端商品详情页和列表页显示库存数量
- 前端购买按钮根据库存状态显示"已售罄"或"立即购买"

### Changed
- 修改购买逻辑：从删除商品改为扣减库存并更新状态
- 商品状态新增 `sold_out`（售罄）枚举值
- 购买成功后自动刷新商品详情，不再跳转首页

### Fixed
- 修复购买功能直接删除商品导致数据丢失的问题
- 修复前端购买按钮未处理售罄状态的问题
- 修复前端购买成功后数据不刷新的问题（现在购买后会自动重新获取商品详情）

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
