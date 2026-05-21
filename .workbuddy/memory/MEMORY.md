# MEMORY.md — 长期记忆

## 项目关键约定

### Decimal128 价格处理（2026-05-21 修复）
- MongoDB `price` 字段类型为 `Decimal128`，`toJSON`/`toObject` transform 在 populate 场景下不可靠
- **双保险原则**：后端所有 API 返回前显式 `Number(productObj.price) || 0`；前端用 `Number(product.price ?? 0)` 替代 `parseFloat()`
- 涉及的所有文件已在 productController.js、cartController.js、前端 ProductCard/ProductDetails/Cart/UserProfile/ProductList 中修复
