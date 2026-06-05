# 校园二手交易平台 API 文档

> 基准路径：`http://localhost:8000/api`

---

## 目录

- [1. 商品接口](#1-商品接口)
- [2. 用户接口](#2-用户接口)
- [3. 购物车接口](#3-购物车接口)
- [4. 其他接口](#4-其他接口)

---

## 认证说明

| 标记 | 含义 |
|------|------|
| 🔓 公开 | 无需认证即可访问 |
| 🔒 需登录 | 请求头需携带 `Authorization: Bearer <token>` |
| 🔑 管理员 | 需登录 + `role === "admin"` |

> **JWT Token 有效期**：7 天。登出后 token 立即失效（tokenVersion 递增）。

---

## 通用错误响应格式

```json
{
  "message": "错误描述"
}
```

| HTTP 状态码 | 含义 |
|-------------|------|
| 200 | 成功 |
| 201 | 创建成功 |
| 400 | 请求参数错误 |
| 401 | 未认证 |
| 403 | 无权限 |
| 404 | 资源不存在 |
| 429 | 请求频率过高 |
| 500 | 服务器内部错误 |

---

## 1. 商品接口

### 1.1 搜索/筛选/分页获取商品

```
GET /api/products
```

🔓 公开（可选认证，用于 PII 脱敏判断）

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|:--:|--------|------|
| `page` | number | | 1 | 页码 |
| `limit` | number | | 20 | 每页数量（最大 100） |
| `search` | string | | | 搜索关键词（支持空格分词，AND 匹配 name + description） |
| `category` | string | | | 分类筛选：教材教辅/电子数码/生活用品/体育用品/服饰美妆/文具办公/宿舍神器/乐器爱好/其他 |
| `sort` | string | | `latest` | 排序方式：`latest`/`lowestPrice`/`highestPrice`/`closest` |
| `department` | string | | | 学院筛选 |
| `major` | string | | | 专业筛选 |
| `minPrice` | number | | | 最低价格 |
| `maxPrice` | number | | | 最高价格 |
| `userDepartment` | string | | | `sort=closest` 时必需，用于同学院优先排序 |

**成功响应**：

```json
{
  "products": [
    {
      "_id": "665a1b2c3d4e5f6a7b8c9d0e",
      "name": "高等数学（第七版）上册",
      "category": "教材教辅",
      "description": "九成新，无笔记，正版",
      "price": 15.0,
      "images": ["/uploads/1716880201234-456789012.jpg"],
      "specifications": [
        { "key": "作者", "value": "同济大学数学系", "_id": "..." }
      ],
      "status": "unsold",
      "quantity": 1,
      "purchasedBy": null,
      "createdAt": "2026-06-01T08:30:00.000Z",
      "uploadedBy": {
        "id": "665a1a2b3c4d5e6a7b8c9d01",
        "name": "张三",
        "college": "南昌师范学院",
        "department": "数学与信息科学学院",
        "major": "数学与应用数学"
      }
    }
  ],
  "total": 234,
  "page": 1,
  "totalPages": 12
}
```

> **PII 脱敏规则**：未认证 → 不返回 phone/wechat/qq/dormitory；认证但非买卖双方 → 保留 dormitory，隐藏 phone/wechat/qq；卖家或买家 → 全部可见。

**错误响应**：

```json
{ "message": "Internal server error" }
```

---

### 1.2 推荐商品

```
GET /api/products/recommendations
```

🔓 公开（可选认证）

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|:--:|--------|------|
| `userId` | string | | | 排除该用户自己的商品 |
| `department` | string | | | 同学院优先推荐 |
| `limit` | number | | 6 | 返回数量（最大 20） |
| `excludeId` | string | | | 排除指定商品 ID |

**成功响应**：

```json
[
  {
    "_id": "665a1b2c3d4e5f6a7b8c9d0e",
    "name": "线性代数教材",
    "price": 12.0,
    "images": ["/uploads/1716880201234-456789012.jpg"],
    "uploadedBy": {
      "id": "665a1a2b3c4d5e6a7b8c9d01",
      "name": "李四",
      "college": "南昌师范学院",
      "department": "数学与信息科学学院",
      "major": "信息与计算科学"
    },
    "category": "教材教辅",
    "status": "unsold",
    "quantity": 1,
    "createdAt": "2026-06-02T10:00:00.000Z"
  }
]
```

> **推荐算法**：同学院最新商品 → 全校最新商品兜底。两层合并后返回，每层都会排除用户自己的商品和已售罄/下架商品。

---

### 1.3 获取商品详情

```
GET /api/products/:id
```

🔓 公开（可选认证）

**成功响应**：

```json
{
  "_id": "665a1b2c3d4e5f6a7b8c9d0e",
  "name": "高等数学（第七版）上册",
  "category": "教材教辅",
  "description": "九成新，无笔记，正版",
  "price": 15.0,
  "images": ["/uploads/1716880201234-456789012.jpg"],
  "specifications": [{ "key": "作者", "value": "同济大学数学系" }],
  "status": "unsold",
  "quantity": 1,
  "purchasedBy": null,
  "createdAt": "2026-06-01T08:30:00.000Z",
  "uploadedBy": {
    "id": "665a1a2b3c4d5e6a7b8c9d01",
    "name": "张三",
    "college": "南昌师范学院",
    "department": "数学与信息科学学院",
    "major": "数学与应用数学",
    "dormitory": "1号楼101",
    "phone": "138****5678",
    "wechat": "zhangsan_wx",
    "qq": "123456789"
  }
}
```

> **PII 脱敏**：同上。商品详情页已购买方可查看完整卖家联系方式。

**错误响应**：

```json
{ "message": "Product not found" }
```

---

### 1.4 获取某用户发布的商品

```
GET /api/products/user/:userId
```

🔒 需登录

**成功响应**：

```json
[
  {
    "_id": "665a1b2c3d4e5f6a7b8c9d0e",
    "name": "高等数学教材",
    "price": 15.0,
    "status": "unsold",
    "images": ["/uploads/1716880201234-456789012.jpg"],
    "category": "教材教辅",
    "createdAt": "2026-06-01T08:30:00.000Z",
    "uploadedBy": {
      "id": "665a1a2b3c4d5e6a7b8c9d01",
      "name": "张三",
      "college": "南昌师范学院",
      "department": "数学与信息科学学院"
    }
  }
]
```

**错误响应**：

```json
{ "message": "Invalid user ID format" }
```

---

### 1.5 获取某用户购买的商品

```
GET /api/products/purchased/:userId
```

🔒 需登录

> 自动排除用户自己发布的商品。

**成功响应**：格式同 1.4。

---

### 1.6 创建商品

```
POST /api/products
```

🔒 需登录

| 参数 | 类型 | 必填 | 说明 |
|------|------|:--:|------|
| `name` | string | ✅ | 商品名称（≤200 字符） |
| `description` | string | ✅ | 商品描述（≤2000 字符） |
| `price` | number | ✅ | 价格（0 < price ≤ 9999.9） |
| `images` | string[] | ✅ | 图片 URL 数组（至少 1 张） |
| `category` | string | | 分类（默认"其他"） |
| `specifications` | object[] | | 规格数组 `[{key, value}]` |
| `quantity` | number | | 数量（默认 1） |

> **注意**：
> - 未激活用户（status=inactive）不能发布商品（403）
> - 违禁词命中 → 400 拦截
> - `uploadedBy`、`listedByDepartment`、`listedByMajor` 自动从用户信息填充
> - 字段白名单防批量赋值

**成功响应**：

```json
{
  "_id": "665a1b2c3d4e5f6a7b8c9d0e",
  "name": "高等数学教材",
  "description": "九成新",
  "price": 15.0,
  "category": "教材教辅",
  "images": ["/uploads/1716880201234-456789012.jpg"],
  "specifications": [],
  "status": "unsold",
  "quantity": 1,
  "uploadedBy": {
    "id": "665a1a2b3c4d5e6a7b8c9d01",
    "name": "张三",
    "college": "南昌师范学院",
    "department": "数学与信息科学学院",
    "major": "数学与应用数学",
    "dormitory": "1号楼101",
    "phone": "13800000000",
    "wechat": "",
    "qq": ""
  },
  "listedByDepartment": "数学与信息科学学院",
  "listedByMajor": "数学与应用数学",
  "createdAt": "2026-06-05T12:00:00.000Z"
}
```

**错误响应**：

```json
{ "message": "Missing required fields: name, description, price, images" }
```
```json
{ "message": "商品信息包含违禁词，请修改后重新发布" }
```
```json
{ "message": "您的账号正在等待管理员审核，审核通过后即可发布商品" }
```

---

### 1.7 更新商品

```
PUT /api/products/:id
```

🔒 需登录（仅商品所有者）

| 参数 | 类型 | 说明 |
|------|------|------|
| `name` | string | 商品名称 |
| `description` | string | 商品描述 |
| `price` | number | 价格 |
| `category` | string | 分类 |
| `images` | string[] | 图片列表 |
| `specifications` | object[] | 规格列表 |
| `quantity` | number | 数量 |

> **字段白名单**：仅允许更新上述字段，`status`/`purchasedBy`/`uploadedBy` 不可通过此接口修改。

**成功响应**：返回更新后的完整商品对象（格式同 1.6）。

**错误响应**：

```json
{ "message": "Forbidden: You can only update your own products" }
```
```json
{ "message": "商品信息包含违禁词，请修改后重新发布" }
```

---

### 1.8 删除商品

```
DELETE /api/products/:id
```

🔒 需登录（仅商品所有者）

**成功响应**：

```json
{ "message": "Product successfully deleted" }
```

**错误响应**：

```json
{ "message": "Forbidden: You can only delete your own products" }
```

---

### 1.9 更新商品状态

```
PUT /api/products/:id/update-status
```

🔒 需登录（仅商品所有者）

| 参数 | 类型 | 必填 | 说明 |
|------|------|:--:|------|
| `status` | string | ✅ | 目标状态 |

**状态机白名单**：

| 当前状态 | 允许转为 |
|----------|----------|
| `unsold` | `sold_out`, `inactive` |
| `sold_out` | `unsold` |
| `inactive` | `unsold` |
| `sold` | 无（不可变更） |

**成功响应**：返回更新后的商品对象。

**错误响应**：

```json
{ "message": "不允许从\"sold\"变为\"unsold\"" }
```

---

### 1.10 购买商品

```
POST /api/products/:id/purchase
```

🔒 需登录

| 参数 | 类型 | 必填 | 说明 |
|------|------|:--:|------|
| `fullName` | string | | 购买者姓名（默认用登录用户） |
| `phoneNo` | string | | 购买者手机号（默认用登录用户） |
| `dormitory` | string | | 购买者宿舍（默认用登录用户） |

> **防竞态**：用 `findOneAndUpdate` + `$gt: 0` + `$inc: -1` 确保并发购买不超卖。

**成功响应**：

```json
{
  "message": "购买成功",
  "product": { /* 更新后的商品对象 */ },
  "orderId": "665a1b2c3d4e5f6a7b8c9d0f"
}
```

**错误响应**：

```json
{ "message": "不能购买自己的商品" }
```
```json
{ "message": "库存不足或商品已下架" }
```

---

### 1.11 添加图片

```
POST /api/products/:id/images
```

🔒 需登录（仅商品所有者）

| 参数 | 类型 | 必填 | 说明 |
|------|------|:--:|------|
| `imageUrl` | string | ✅ | 图片 URL |

**成功响应**：返回更新后的商品对象。

---

### 1.12 删除图片

```
DELETE /api/products/:id/images/:imageIndex
```

🔒 需登录（仅商品所有者）

**成功响应**：返回更新后的商品对象。

---

### 1.13 添加规格

```
POST /api/products/:id/specifications
```

🔒 需登录（仅商品所有者）

| 参数 | 类型 | 必填 | 说明 |
|------|------|:--:|------|
| `key` | string | ✅ | 规格名 |
| `value` | string | ✅ | 规格值 |

> 违禁词检查覆盖 key + value。

**成功响应**：返回更新后的商品对象。

**错误响应**：

```json
{ "message": "规格信息包含违规内容，请修改后重新提交" }
```

---

### 1.14 更新规格

```
PUT /api/products/:id/specifications/:specificationId
```

🔒 需登录（仅商品所有者）

| 参数 | 类型 | 必填 | 说明 |
|------|------|:--:|------|
| `key` | string | ✅ | 新规格名 |
| `value` | string | ✅ | 新规格值 |

**成功响应**：返回更新后的商品对象。

---

### 1.15 删除规格

```
DELETE /api/products/:id/specifications/:specificationId
```

🔒 需登录（仅商品所有者）

**成功响应**：返回更新后的商品对象。

---

## 2. 用户接口

### 2.1 注册

```
POST /api/users/register
```

🔓 公开 | ⏱ 频率限制：5 次/小时/IP

| 参数 | 类型 | 必填 | 说明 |
|------|------|:--:|------|
| `email` | string | ✅ | 邮箱（唯一，不区分大小写） |
| `password` | string | ✅ | 密码（≥8 位，含字母+数字） |
| `fullName` | string | ✅ | 姓名 |
| `department` | string | ✅ | 学院 |
| `major` | string | ✅ | 专业 |
| `phoneNo` | string | ✅ | 手机号（11 位，唯一） |
| `dormitory` | string | | 宿舍楼 |

> **注册后状态为 `inactive`**，需等待管理员后台审核通过后才能发布商品（仍可登录浏览）。

**成功响应**：

```json
{ "message": "注册申请已提交，请等待管理员审核" }
```

**错误响应**：

```json
{ "message": "邮箱格式不正确" }
```
```json
{ "message": "密码至少需要8位" }
```
```json
{ "message": "注册失败，请检查填写信息" }
```
```json
{ "message": "该手机号已注册，请直接登录" }
```
```json
{ "message": "个人信息包含违规内容，请修改后重新提交" }
```
```json
{ "message": "注册请求过于频繁，请1小时后再试" }
```

---

### 2.2 登录

```
POST /api/users/login
```

🔓 公开 | ⏱ 频率限制：20 次/15 分钟/IP

| 参数 | 类型 | 必填 | 说明 |
|------|------|:--:|------|
| `email` | string | ✅ | 邮箱 |
| `password` | string | ✅ | 密码 |

> **账户锁定**：连续 5 次密码错误 → 锁定 15 分钟。锁定期间返回 429。

**成功响应**：

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "665a1a2b3c4d5e6a7b8c9d01",
    "email": "zhangsan@example.com",
    "fullName": "张三",
    "college": "南昌师范学院",
    "department": "数学与信息科学学院",
    "major": "数学与应用数学",
    "phoneNo": "13800000000",
    "dormitory": "1号楼101",
    "role": "user",
    "status": "active",
    "createdAt": "2026-05-01T00:00:00.000Z"
  },
  "pendingApproval": false
}
```

> `pendingApproval: true` 表示账号待审核，前端据此限制发布功能。

**错误响应**：

```json
{ "message": "邮箱和密码不能为空" }
```
```json
{ "message": "邮箱或密码错误" }
```
```json
{ "message": "账户已锁定，请稍后重试" }
```
```json
{ "message": "该账号已被封禁" }
```
```json
{ "message": "您的账号正在等待管理员审核，审核通过后即可登录" }
```

---

### 2.3 登出

```
POST /api/users/logout
```

🔒 需登录

> 递增 `tokenVersion`，使所有已签发的 JWT 立即失效。

**成功响应**：

```json
{ "message": "已登出" }
```

---

### 2.4 获取所有用户（管理员）

```
GET /api/users
```

🔒 需登录

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `page` | number | 1 | 页码 |
| `limit` | number | 20 | 每页数量（最大 100） |

> 返回结果自动剔除 `password` 和 `cart` 字段。

**成功响应**：

```json
{
  "users": [
    {
      "_id": "665a1a2b3c4d5e6a7b8c9d01",
      "email": "zhangsan@example.com",
      "fullName": "张三",
      "college": "南昌师范学院",
      "department": "数学与信息科学学院",
      "major": "数学与应用数学",
      "role": "user",
      "status": "active",
      "createdAt": "2026-05-01T00:00:00.000Z"
    }
  ],
  "total": 500,
  "page": 1,
  "totalPages": 25
}
```

---

### 2.5 获取单个用户

```
GET /api/users/:userId
```

🔒 需登录

**成功响应**：返回用户对象（不含 password），格式同 2.4 中 `users[0]`。

**错误响应**：

```json
{ "message": "User not found" }
```

---

### 2.6 更新用户信息

```
PUT /api/users/:userId
```

🔒 需登录（仅本人）

| 参数 | 类型 | 说明 |
|------|------|------|
| `fullName` | string | 姓名 |
| `phoneNo` | string | 手机号 |
| `department` | string | 学院 |
| `major` | string | 专业 |
| `dormitory` | string | 宿舍 |
| `address` | string | 地址 |
| `wechat` | string | 微信号 |
| `qq` | string | QQ 号 |

> **字段白名单**：仅上述字段可更新，`role`/`status` 不可修改。
> **级联更新**：修改学院/专业时，自动同步用户所有在售商品的 `uploadedBy` 信息。

**成功响应**：返回更新后的用户对象（不含 password）。

**错误响应**：

```json
{ "message": "无权修改他人资料" }
```
```json
{ "message": "个人信息包含违规内容，请修改后重新提交" }
```

---

### 2.7 修改密码

```
PUT /api/users/:userId/password
```

🔒 需登录（仅本人）

| 参数 | 类型 | 必填 | 说明 |
|------|------|:--:|------|
| `oldPassword` | string | ✅ | 旧密码 |
| `newPassword` | string | ✅ | 新密码（≥8 位，含字母+数字） |

> 修改成功后 `tokenVersion` 递增，返回新 token，所有旧 token 立即失效。

**成功响应**：

```json
{
  "message": "密码修改成功，请使用新密码重新登录",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**错误响应**：

```json
{ "message": "旧密码错误" }
```
```json
{ "message": "新密码至少需要8位" }
```

---

### 2.8 删除用户

```
DELETE /api/users/:userId
```

🔒 需登录（仅本人）

> 级联处理：删除账户时，该用户所有在售商品自动标记为 `inactive`，原因"卖家已注销账户"。

**成功响应**：

```json
{ "message": "User and associated products deactivated" }
```

**错误响应**：

```json
{ "message": "无权删除他人账户" }
```

---

## 3. 购物车接口

> 🔒 全部接口需要登录。

### 3.1 获取购物车

```
GET /api/cart
```

> 自动过滤已删除的商品，并标记 `available` 状态（商品未下架、未售罄、库存充足）。

**成功响应**：

```json
{
  "cart": [
    {
      "_id": "665a1b2c3d4e5f6a7b8c9d0e",
      "productId": {
        "_id": "665a1b2c3d4e5f6a7b8c9d0e",
        "name": "高等数学教材",
        "price": 15.0,
        "images": ["/uploads/1716880201234-456789012.jpg"],
        "status": "unsold",
        "quantity": 3,
        "uploadedBy": { "id": "...", "name": "李四", "department": "..." }
      },
      "quantity": 2,
      "addedAt": "2026-06-03T14:00:00.000Z",
      "available": true
    }
  ]
}
```

---

### 3.2 加入购物车

```
POST /api/cart/:productId
```

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|:--:|--------|------|
| `quantity` | number | | 1 | 数量（正整数） |

> **规则**：
> - 不能加自己的商品
> - 已下架/售罄/库存为 0 的商品不可加
> - 请求数量不能超过库存
> - 已在购物车中则累加数量（累加后不能超库存）

**成功响应**：

```json
{
  "message": "已加入购物车",
  "cart": [ /* 更新后的购物车数组 */ ]
}
```

**错误响应**：

```json
{ "message": "不能将自有商品加入购物车" }
```
```json
{ "message": "库存不足，当前库存 3 件" }
```
```json
{ "message": "该商品已下架或售罄" }
```

---

### 3.3 移除购物车项

```
DELETE /api/cart/:productId
```

**成功响应**：

```json
{
  "message": "已移除",
  "cart": [ /* 更新后的购物车数组 */ ]
}
```

**错误响应**：

```json
{ "message": "购物车中未找到该商品" }
```

---

### 3.4 更新数量

```
PUT /api/cart/:productId
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|:--:|------|
| `quantity` | number | ✅ | 新数量（正整数，≤库存） |

**成功响应**：

```json
{
  "message": "数量已更新",
  "cart": [ /* 更新后的购物车数组 */ ]
}
```

---

### 3.5 清空购物车

```
DELETE /api/cart
```

**成功响应**：

```json
{ "message": "购物车已清空" }
```

---

### 3.6 批量结算

```
POST /api/cart/checkout/all
```

> 遍历购物车中所有商品，使用原子操作逐个购买（防超卖），成功项移除、失败项保留供重试。

**成功响应**：

```json
{
  "message": "结算完成：成功 2 件，失败 0 件",
  "results": {
    "success": [
      {
        "productId": "665a1b2c3d4e5f6a7b8c9d0e",
        "name": "高等数学教材",
        "price": 15.0,
        "orderId": "665a1b2c3d4e5f6a7b8c9d0f"
      }
    ],
    "failed": [
      {
        "productId": "665a1b2c3d4e5f6a7b8c9d10",
        "reason": "库存不足或已下架"
      }
    ]
  }
}
```

**错误响应**：

```json
{ "message": "购物车为空" }
```

---

## 4. 其他接口

### 4.1 文件上传

```
POST /api/upload
```

🔒 需登录

| 参数 | 类型 | 说明 |
|------|------|------|
| `images` | file[] | 图片文件（最多 9 张，单张 ≤20MB） |

> **安全措施**：
> - MIME 过滤：仅 `image/*`（拒绝 SVG）
> - 魔法字节验证：检查文件头确保是 JPEG/PNG/GIF/WebP
> - 非图片文件直接删除
> - 扩展名统一为实际类型

**成功响应**：

```json
{
  "urls": [
    "/uploads/1716880201234-456789012.jpg",
    "/uploads/1716880201235-567890123.png"
  ]
}
```

**错误响应**：

```json
{ "message": "请选择图片" }
```
```json
{ "message": "只允许上传图片文件" }
```
```json
{ "message": "不支持 SVG 格式，请上传 JPG/PNG/GIF/WebP" }
```
```json
{ "message": "文件类型校验失败，请上传真实的 JPG/PNG/GIF/WebP 图片" }
```

---

### 4.2 举报

```
POST /api/reports
```

🔒 需登录

| 参数 | 类型 | 必填 | 说明 |
|------|------|:--:|------|
| `productId` | string | ✅ | 被举报商品 ID |
| `reason` | string | | 举报原因（默认"其他"） |
| `detail` | string | | 补充说明 |

**成功响应**：

```json
{ "message": "举报已提交" }
```

---

### 4.3 求购

```
GET /api/wanted
POST /api/wanted
```

🔓 获取列表 | 🔒 发布

| 参数（POST） | 类型 | 必填 | 说明 |
|-------------|------|:--:|------|
| `name` | string | ✅ | 求购物品名 |
| `budget` | number | ✅ | 预算（0 < budget ≤ 9999.9） |
| `description` | string | | 补充描述 |

> 违禁词检查：name + description。
> 公开列表自动隐藏发布者手机号。

**POST 成功响应**：

```json
{ "message": "求购发布成功", "wanted": { /* ... */ } }
```

---

### 4.4 管理员接口

```
基路径：GET/POST/PUT /api/admin/*
```

🔑 管理员

| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/admin/stats` | GET | 数据概览（用户数/商品数/今日新增/待处理举报/待审核用户） |
| `/api/admin/reports` | GET | 举报列表（支持分页+状态筛选） |
| `/api/admin/reports/:id` | PUT | 处理举报（action: handle/dismiss） |
| `/api/admin/products` | GET | 全部商品管理（含已下架，支持搜索） |
| `/api/admin/products/:id` | PUT | 下架/恢复商品 |
| `/api/admin/users` | GET | 用户列表（支持搜索/角色/状态筛选） |
| `/api/admin/users/:id` | PUT | 封禁/解封用户（不能操作其他管理员） |
| `/api/admin/warnings` | GET/POST | 查看/发送警告消息 |

---

### 4.5 消息

```
GET /api/messages
GET /api/messages/unread-count
PUT /api/messages/:id/read
```

🔒 需登录

| 端点 | 说明 |
|------|------|
| `GET /api/messages` | 获取当前用户的消息列表（支持 `isRead` 筛选，分页） |
| `GET /api/messages/unread-count` | 获取未读消息数（Navbar 角标） |
| `PUT /api/messages/:id/read` | 标记消息为已读（仅本人的消息） |

---

### 4.6 订单

```
GET /api/orders
GET /api/orders/sold
PATCH /api/orders/:id/status
```

🔒 需登录

| 端点 | 说明 |
|------|------|
| `GET /api/orders` | 我的购买订单（作为买家） |
| `GET /api/orders/sold` | 我的售出订单（作为卖家） |
| `PATCH /api/orders/:id/status` | 更新订单状态（卖家：completed/cancelled，仅可从 pending 转换） |

---

### 4.7 学院-专业映射

```
GET /api/majorMap
```

🔓 公开 | ⏱ 缓存：1 小时

**成功响应**：

```json
{
  "数学与信息科学学院": ["数学与应用数学", "信息与计算科学", "统计学"],
  "文学院": ["汉语言文学", "汉语国际教育"],
  "教育学院": ["小学教育", "学前教育", "教育技术学"]
}
```

---

### 4.8 健康检查

```
GET /api/health
```

🔓 公开

**成功响应**：

```json
{ "status": "ok" }
```

---

### 4.9 首页统计数据

```
GET /api/stats
```

🔓 公开 | ⏱ 缓存：60 秒

**成功响应**：

```json
{
  "userCount": 1250,
  "productCount": 234
}
```

> `userCount`：已注册用户总数。`productCount`：在售商品数（排除 sold_out 和 inactive）。

---

> 📅 文档生成日期：2026-06-05 | 版本：v1.0
