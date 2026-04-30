# Changelog

All notable changes to this project will be documented in this file.

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
