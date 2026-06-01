# 南昌师范学院校园二手平台 — 优化方案

> 撰写者视角：曾参与闲鱼/转转等大型二手平台开发，现面向南昌师范学院（约 1 万师生）从零设计最适配的校园二手交易平台。

---

## 目录

1. [写在前面：大厂经历教会我的事](#1-写在前面大厂经历教会我的事)
2. [现状诊断](#2-现状诊断)
3. [校园平台的核心原则](#3-校园平台的核心原则)
4. [精简方案：砍掉什么、为什么](#4-精简方案砍掉什么为什么)
5. [强化方案：核心流程怎么补强](#5-强化方案核心流程怎么补强)
6. [架构优化：2核2G的生存法则](#6-架构优化2核2g的生存法则)
7. [实施路线图](#7-实施路线图)
8. [附录：精简后的数据模型 & API](#8-附录精简后的数据模型--api)

---

## 1. 写在前面：大厂经历教会我的事

在闲鱼和转转做了几年开发，最大的收获不是技术，而是**什么不该做**。

大厂的二手平台动辄几百个微服务、几十个数据库表、上百万行代码。但那是为了服务 5 亿用户、每天几千万笔交易。你面对的是南昌师范学院 1 万师生，日均交易量可能不超过 50 笔。

**把大厂的架构搬到校园场景，等于用高铁去送外卖。**

### 大厂平台 vs 校园平台：本质差异

| 维度 | 闲鱼/转转 | 校园二手平台 |
|------|----------|-------------|
| **用户量** | 5 亿+ | ~1 万 |
| **日交易** | 千万级 | 10-50 笔 |
| **信任基础** | 陌生人，需信用体系 | 同校同学，天然信任 |
| **交易方式** | 快递物流，需支付系统 | 当面交易，现金/扫码 |
| **沟通方式** | 必须站内 IM | 直接加微信/QQ |
| **风控需求** | 反欺诈/反洗钱/实名认证 | 基本不需要 |
| **服务器** | 几千台 | **1 台 2核2G** |
| **运维团队** | 几十人 | **你一个人** |

### 校园平台的真正需求

如果你去问南昌师范学院的学生"你需要一个二手交易平台吗"，他们大概率会说"用 QQ 群/微信群不就行了"。

QQ 群/微信群的问题是：
- 消息刷屏，商品信息被淹没
- 没法搜索、没法筛选、没法分类
- 交易完了商品信息还在群里占地方
- 不知道东西还在不在

**所以校园二手平台要解决的唯一问题是：让商品信息可以被结构化地发布、浏览、搜索。** 其他都是锦上添花。

---

## 2. 现状诊断

当前项目经过多轮迭代，已经累积了不少功能。以下是客观评估：

### 2.1 代码规模一览

| 层级 | 数量 | 详情 |
|------|------|------|
| 数据模型 | 9 个 | User, Product, Wanted, Report, Appeal, Warning, Review, Conversation, Message |
| 路由模块 | 12 个 | users, products, cart, ai, upload, reports, wanted, admin, appeals, warnings, reviews, messages |
| API 端点 | ~50 个 | 含 CRUD + 图片管理 + 规格管理 + 推荐 + AI + 举报流程 + 申诉流程 + 通知 + 评价 + 私信 |
| 前端组件 | ~35 个 | 含首页/详情/购物车/发布/编辑/个人主页/管理后台/私信/评价 |
| Docker 容器 | 3 个 | MongoDB(768MB) + Backend + Frontend(nginx) |

### 2.2 各项功能评估

| 功能 | 状态 | 对校园场景的价值 | 维护成本 | 建议 |
|------|------|:---:|:---:|------|
| 用户注册/登录 | ✅ | ⭐⭐⭐⭐⭐ | 低 | **保留，简化** |
| 商品发布/浏览/搜索 | ✅ | ⭐⭐⭐⭐⭐ | 低 | **保留，强化** |
| 购物车 | ✅ | ⭐⭐⭐⭐ | 低 | **保留** |
| 商品购买 | ✅ | ⭐⭐⭐⭐⭐ | 低 | **保留，补 Order 模型** |
| 求购信息 | ✅ | ⭐⭐⭐⭐ | 低 | **保留** |
| 商品图集轮播 | ✅ | ⭐⭐⭐ | 低 | **保留** |
| 管理员后台 | ✅ | ⭐⭐⭐⭐ | 中 | **保留，精简** |
| 举报功能 | ✅ | ⭐⭐⭐ | 中 | **保留，简化流程** |
| 通知系统 | ✅ | ⭐⭐ | 中 | **精简** |
| 申诉系统 | ✅ | ⭐⭐ | 中 | **砍掉，合并到举报** |
| 评价/信用体系 | ✅ | ⭐⭐ | 中 | **砍掉，现阶段不需要** |
| 站内私信 IM | ✅ | ⭐ | 高 | **砍掉，用微信替代** |
| AI 生成描述/分类 | ✅ | ⭐ | 中（含费用） | **砍掉，节省 API 费用** |
| 多设备登录互踢 | ✅ | ⭐ | 中 | **砍掉，校园场景不需要** |
| IP 限流 | ✅ | ⭐⭐ | 低 | **保留** |
| 六层推荐引擎 | ✅ | ⭐⭐ | 中 | **简化为两层** |
| Decimal128 价格 | ✅ | ⭐ | 中（序列化坑多） | **改为 Number** |
| 规格参数管理 | ✅ | ⭐⭐ | 低 | **保留** |

### 2.3 核心问题总结

**问题一：功能过剩。** 9 个数据模型、12 个路由模块、50 个 API 端点。其中至少 1/3 的功能在校园场景下几乎用不到（AI、IM、评价、申诉、多设备互踢）。

**问题二：维护负担。** 每多一个功能，就多一个可能出 bug 的地方。一个人维护这么多模块，出问题时的排查成本很高。

**问题三：过度设计。** Decimal128 价格类型带来的序列化问题比它解决的问题还多。六层推荐引擎的代码量比核心购买流程还大。这些都是"因为大厂这么做了"而引入的，但校园场景不需要。

**问题四：资源紧张。** 2GB 内存跑 3 个 Docker 容器，MongoDB 就占了 768MB。后端 Node 进程、nginx 进程、系统开销——内存已经捉襟见肘。

---

## 3. 校园平台的核心原则

### 三要

**1. 要极简。** 发布商品不超过 3 步：拍照 → 填价格 → 发布。用户不会在一个校园平台花超过 2 分钟。

**2. 要靠谱。** 同校交易最大的优势是信任。不需要信用评分，因为"他是隔壁学院的，跑不掉"。核心是确保信息真实：手机号验证 + 商品图片真实。

**3. 要快。** 2 核 2G 的服务器，页面加载不能超过 2 秒。不要用复杂查询、不要用重量级框架特性、不要做多余的数据库 JOIN。

### 三不要

**1. 不要做大厂的功能拷贝。** 闲鱼有 IM 是因为买卖双方是陌生人且分布在全国。校园里直接加微信就行。闲鱼有信用体系是因为交易量大且欺诈多。校园里天然的社交关系就是最好的信用体系。

**2. 不要为"可能用到"而设计。** "以后用户多了可能需要评价系统"——等到真的需要的时候再加。现在 1 万用户，日均 50 笔交易，评价系统只会让数据库多一张空表。

**3. 不要引入外部依赖。** 通义千问 API 要钱、要网络、要处理异常返回。多一个外部依赖就多一个故障点。校园平台的可靠性比"AI 智能推荐"重要一百倍。

---

## 4. 精简方案：砍掉什么、为什么

### 4.1 砍掉：AI 辅助功能

**涉及文件**：`Server/services/aiService.js`, `Server/controllers/aiController.js`, `Server/routes/aiRoutes.js`, 前端 AddProduct.js 中的 AI 按钮

**理由**：
- 通义千问 API 按量计费，一个月可能几十到上百元
- 学生写商品描述不需要 AI——"九成新高等数学，30 元出"就够了
- AI 是演示项目的好卖点，但不是真实运营的好功能

**替代方案**：商品描述提供几个快捷模板按钮（"九成新，只用过一学期"、"全新未拆封"、"正常使用痕迹"），一键填入。

### 4.2 砍掉：站内私信 IM

**涉及文件**：`Server/models/Conversation.js`, `Server/models/Message.js`, `Server/routes/messageRoutes.js`, 前端 `ConversationList.js`, `ChatWindow.js`

**理由**：
- 校园交易几乎 100% 通过微信/QQ 沟通
- IM 需要轮询（5s 一次 = 浪费带宽和 CPU）、消息存储（数据库膨胀）、已读未读管理
- 维护成本极高：消息不漏、不丢、不乱序、离线消息、多端同步……每一样都是坑
- 对于 2GB 服务器，Message 表是无底洞

**替代方案**：在商品详情页的卖家信息区展示微信号/QQ 号（用户注册时选填），点击"联系卖家"直接复制微信号或跳转微信。用户个人资料页新增 `wechat` 和 `qq` 字段。

### 4.3 砍掉：评价/信用体系

**涉及文件**：`Server/models/Review.js`, `Server/routes/reviewRoutes.js`

**理由**：
- 评测需要和 Order 模型绑定（不能没交易就评价），而当前根本没有 Order 模型
- 校园日均 50 笔交易，评价值得累积到有用程度需要至少半年
- 评价系统引入"刷好评"问题，需要额外的反作弊机制
- 学生会因为"怕被差评"而不愿意卖东西——降低发布意愿

**替代方案**：卖家主页展示"已售出 X 件商品"，买家可以看卖家历史发布记录。同校交易天然信任，不需要评分系统来背书。

### 4.4 砍掉：申诉系统 + 通知系统

**涉及文件**：`Server/models/Appeal.js`, `Server/routes/appealRoutes.js`, `Server/models/Warning.js`, `Server/routes/warningRoutes.js`

**理由**：
- 举报→申诉→通知是一条完整的"内容治理"链路，是给 500 万用户平台用的
- 校园平台：有人举报 → 管理员看了一眼 → 微信跟卖家说一声 → 完事
- 通知系统（Warning）有 4 种 type、2 种 severity、critical 强制弹窗——对于一个 1 万人的校园平台来说，这些概念都是多余的

**替代方案**：
- 举报保留，但简化：举报 → 管理员查看 → 决定下架/忽略 → 直接操作商品 status
- 保留 `Warning` 模型但精简为单一的"系统消息"：管理员操作后给用户留一条消息记录即可
- 去掉 severity、type 分类、强制弹窗等概念

### 4.5 砍掉：多设备登录互踢

**涉及文件**：`Server/config/auth.js` 中的 sessionId 逻辑、`Server/middleware/authMiddleware.js` 中的 session 校验、User 模型中的 `activeSessions`、前端 `authContext.js` 中的 storage 事件监听、`sessionGuard.js`

**理由**：
- 这是一个防账号共享/防盗号的功能，在校园场景下几乎没有需求
- `activeSessions`、`sessionId`、`$push/$slice/$pull` 原子操作、storage 事件监听——这一整套机制增加了大量复杂度
- 曾因为这个功能导致过 3 次线上 500 错误

**替代方案**：回归最简单的 JWT 认证。签发 token → 验证 token → 过期重新登录。JWT 有效期设为 7 天（学生一周内不用反复登录）。

### 4.6 简化：Decimal128 → Number

**涉及文件**：`Server/models/Product.js`, `Server/models/Wanted.js`，所有 controller 中的 `Number(product.price) || 0` 转换逻辑

**理由**：
- Decimal128 是为了解决金融级精度问题（如 0.1 + 0.2 ≠ 0.3）
- 校园二手商品价格普遍在 1-500 元，用整数或一位小数足够
- 当前代码中至少有 15 处 `Number(product.price) || 0` 的显式转换，每次返回商品数据都要手动处理——这说明 Decimal128 带来的转换成本远大于精度收益
- 改为 `Number` 类型后，所有转换代码可以删除

### 4.7 简化：推荐引擎六层 → 两层

**涉及文件**：`Server/controllers/productController.js` 中的 `getRecommendations`

**理由**：
- 当前六层漏斗：同类目 → 同学院 → 同专业 → 同卖家 → 用户同学院 → 最新兜底
- 代码量 ~150 行，执行 5 次数据库查询
- 对于校园场景：只要"同学院商品"+"最新商品"就够了

**替代方案**：
```
第一层：同学院/同专业的在售商品（最多 6 个）
第二层：最新发布的在售商品（补足到 6 个）
```

---

## 5. 强化方案：核心流程怎么补强

精简不是目的，把省下来的精力和资源投入到真正重要的地方才是。

### 5.1 新增：Order（交易订单）模型

**当前问题**：购买流程只有一个"点击购买 → 减库存 → 标记 sold"的原子操作。没有订单概念，买家卖家都无法追踪交易状态。

**新增模型**：

```javascript
// Server/models/Order.js
{
  productId:   ObjectId,   // 关联商品
  buyerId:     ObjectId,   // 买家
  sellerId:    ObjectId,   // 卖家
  price:       Number,     // 成交价
  status:      String,     // "pending" | "confirmed" | "completed" | "cancelled"
  buyerInfo:   { name, phone, department, major, dormitory },
  sellerInfo:  { name, phone, department, major, dormitory },
  createdAt:   Date,
  updatedAt:   Date,
}
```

**状态流转**：
```
pending（待确认）→ confirmed（已确认，待面交）→ completed（交易完成）
                 → cancelled（取消）
```

**API**：
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/orders` | 创建订单（购买商品时自动创建） |
| GET | `/api/orders/buy` | 我买的（买家视角） |
| GET | `/api/orders/sell` | 我卖的（卖家视角） |
| PUT | `/api/orders/:id/confirm` | 卖家确认订单 |
| PUT | `/api/orders/:id/complete` | 标记交易完成 |
| PUT | `/api/orders/:id/cancel` | 取消订单 |

**为什么这比 IM/评价/AI 都重要**：
- 买卖双方可以看到"这笔交易进行到哪了"
- 避免"付了钱但不知道对方什么时候给货"
- 为以后如果真的需要评价系统，提供合法的评价依据（必须有 completed order 才能评价）

### 5.2 强化：商品搜索用 MongoDB 文本索引

**当前问题**：搜索使用 `$regex` 模糊匹配，全表扫描，数据量上去后会越来越慢。

**改进**：
```javascript
// Product 模型已有文本索引
ProductSchema.index({ name: "text", description: "text" });

// 搜索时优先用文本索引（支持中文分词）
if (search) {
  query.$text = { $search: search };
  // 按相关性排序
  sortObj = { score: { $meta: "textScore" } };
}
```

文本索引的优势：支持中文、按相关性排序、利用索引而非全表扫描。

### 5.3 强化：手机号验证

**当前问题**：手机号只是格式校验（正则），没有验证是否真实。

**改进**：注册后发短信验证码（阿里云 SMS，国内 0.045 元/条）。对于 1 万人的学校，全年短信费用不超过 500 元。

如果预算有限，可以先做"人工验证"：注册后管理员在后台看到新用户，手动通过（用户量小的时候完全可行）。

### 5.4 强化：卖家联系方式的合理展示

**替代 IM 的方案**：

商品详情页卖家信息区展示：
```
卖家：张三 | 数学与信息科学学院 | 计算机科学与技术
联系方式：微信  zhangsan_2024   [一键复制]
          QQ    123456789      [一键复制]
宿舍楼：1栋302
```

用户注册/编辑资料时新增：
- `wechat`: String（选填）
- `qq`: String（选填）

这些字段在"购买成功后才显示"（防止骚扰），购买前可以选择性打码展示。

### 5.5 强化：商品发布模板化

**当前问题**：发布商品需要填写名称、分类、描述、价格、图片、规格参数。对学生来说有点繁琐。

**改进**：提供"快速发布"模式——
1. 拍照/选图（必填）
2. 填名称（必填，提供常见商品名自动补全）
3. 填价格（必填）
4. 选分类（AI 改为一键默认"其他"，可选填）
5. 描述（提供快捷模板按钮）
6. 发布

总耗时控制在 30 秒以内。

---

## 6. 架构优化：2核2G的生存法则

### 6.1 当前资源分配

```
MongoDB:    768MB (wiredTigerCacheSizeGB 0.5)
Backend:    ~200MB (Node.js)
Frontend:   ~50MB  (nginx)
系统开销:    ~200MB
─────────────────────
合计:       ~1.2GB
剩余:       ~800MB (留给文件缓存、突发流量)
```

当前配置基本合理，但还有优化空间。

### 6.2 精简后推荐架构

**方案 A：继续用 Docker（推荐）**

```yaml
# mongodb — 降低缓存
command: --wiredTigerCacheSizeGB 0.25  # 256MB（1万用户够用）

# backend — 合并前端静态文件服务
# Express 直接 serve React build/，不再需要 nginx 容器
# 容器从 3 个减少到 2 个
```

合并后的 backend：
```javascript
// server.js
app.use(express.static(path.join(__dirname, "../Client/build")));
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../Client/build", "index.html"));
});
```

节省一个 nginx 容器（~50MB），减少一个故障点，简化部署。

**方案 B：裸机部署（更省资源）**

```bash
# 用 PM2 管理 Node 进程
npm install -g pm2
pm2 start server.js --name second-hand

# MongoDB 直接装系统上
apt install mongodb-org
```

省掉 Docker 开销（~100MB），但部署稍麻烦。对单人运维来说，Docker 的好处（环境隔离、一键重启）还是大于开销的。

**推荐：方案 A。** 2 个容器，总内存占用控制在 800MB 以内。

### 6.3 数据库优化

```javascript
// MongoDB 连接池 — 限制连接数（默认 100 太大了）
mongoose.connect(uri, {
  maxPoolSize: 10,       // 最多 10 个连接（2GB 服务器足够了）
  minPoolSize: 2,
  serverSelectionTimeoutMS: 5000,
});
```

### 6.4 静态资源优化（已在 nginx 中配置）

- JS/CSS：强缓存 1 年（带 content hash）
- 图片：缓存 30 天
- Gzip 压缩

如果合并到一个容器，这些缓存策略需要移到 Express 中或用 `serve-static` 的配置。

### 6.5 数据备份

这是最容易被忽略但最重要的事：

```bash
# crontab -e  每天凌晨 3 点备份
0 3 * * * docker exec second-hand-mongodb mongodump --out /backup/$(date +\%Y\%m\%d)
```

保留最近 7 天的备份，超过的自动删除。

---

## 7. 实施路线图

### 第一阶段：精简（工作量 2-3 天）

目标：砍掉不需要的功能，减少代码量和维护负担。

| 任务 | 涉及文件 | 工作量 |
|------|---------|:---:|
| 移除 AI 功能 | `aiService.js`, `aiController.js`, `aiRoutes.js`, AddProduct.jsx | 1h |
| 移除 IM 私信 | `Conversation.js`, `Message.js`, `messageRoutes.js`, ConversationList.jsx, ChatWindow.jsx | 1h |
| 移除评价系统 | `Review.js`, `reviewRoutes.js` | 0.5h |
| 移除申诉系统 | `Appeal.js`, `appealRoutes.js` | 0.5h |
| 合并通知为简单消息 | 精简 `Warning.js` + `warningRoutes.js` | 1h |
| 简化认证（去 session） | `auth.js`, `authMiddleware.js`, `authContext.js`, `sessionGuard.js` | 2h |
| Decimal128 → Number | `Product.js`, `Wanted.js`, 所有 controller | 2h |
| 简化推荐引擎 | `productController.js` | 1h |
| 清理前端引用 | App.js, 各组件中的 AI/IM/Review 引用 | 2h |
| 更新 server.js 路由注册 | `server.js` | 0.5h |

**第一阶段后代码规模**：
- Model: 9 → 5（User, Product, Order（新）, Wanted, Report）
- Route: 12 → 7（users, products, orders（新）, cart, wanted, reports, admin, upload）
- API 端点: ~50 → ~25
- 前端组件: ~35 → ~20

### 第二阶段：补强核心（工作量 2-3 天）

目标：把真正重要的功能做扎实。

| 任务 | 说明 | 工作量 |
|------|------|:---:|
| 新增 Order 模型 | 含 CRUD + 状态流转 | 3h |
| 商品搜索改文本索引 | `$text` 替代 `$regex` | 1h |
| 用户资料加微信/QQ 字段 | User 模型 + 注册/编辑页面 | 1h |
| 商品详情页展示联系方式 | 购买后显示卖家微信/QQ | 1h |
| 发布页模板化 | 快捷模板按钮 + 简化流程 | 2h |
| 管理后台精简 | 去申诉管理，保留统计+商品+用户 | 2h |
| 手机号验证 | 短信验证码（可选）或人工审核 | 3h |

### 第三阶段：架构收尾（工作量 1 天）

| 任务 | 说明 | 工作量 |
|------|------|:---:|
| Docker 容器合并 | nginx → Express 直接 serve 静态文件 | 2h |
| MongoDB 连接池调优 | maxPoolSize: 10 | 0.5h |
| 数据备份脚本 | cron + mongodump | 1h |
| README/SETUP 更新 | 简化后的部署文档 | 1h |
| 全链路测试 | 注册→发布→浏览→购买→订单确认→完成 | 2h |

---

## 8. 附录：精简后的数据模型 & API

### 8.1 数据模型（精简后 6 个）

**User**（保留核心字段，新增微信/QQ，去掉 activeSessions/phoneUniqueEnforced）
```javascript
{
  email, password, fullName, phoneNo,
  college: "南昌师范学院",  // 写死
  department, major, dormitory,
  wechat: String,          // 新增：微信号
  qq: String,              // 新增：QQ号
  address,                 // 保留但改为选填
  cart: [{ productId, quantity, addedAt }],
  role: "user" | "admin",
  status: "active" | "banned",
}
```

**Product**（price 改为 Number，保留核心字段）
```javascript
{
  name, description, price: Number,  // 不再是 Decimal128
  category, images, specifications,
  status: "unsold" | "sold" | "sold_out" | "inactive",
  quantity, delistReason,
  uploadedBy: { id, name, department, major, dormitory, phone, wechat, qq },
  purchasedBy: { id, name, department, major, dormitory, phone },
  listedByDepartment, listedByMajor,
}
```

**Order**（新增：交易状态机）
```javascript
{
  productId, buyerId, sellerId,
  price: Number,
  status: "pending" | "confirmed" | "completed" | "cancelled",
  buyerInfo:  { name, phone, department, major, dormitory },
  sellerInfo: { name, phone, department, major, dormitory, wechat, qq },
}
```

**Wanted**（保留，price 改为 Number）
```javascript
{
  name, budget: Number, description,
  postedBy: { id, name, department, major },
}
```

**Report**（保留，简单够用）
```javascript
{
  productId, reporterId,
  reason: "信息不实" | "违禁品" | "重复发布" | "人身攻击" | "其他",
  detail, status: "pending" | "handled" | "dismissed",
  handledBy, handleNote,
}
```

**Message**（精简后的通知，替代 Warning）
```javascript
{
  userId, title, content,
  isRead: false,
  createdAt,
}
```

### 8.2 API 端点（精简后 ~25 个）

```
/api/users
  POST   /register          # 注册
  POST   /login             # 登录
  GET    /:userId           # 用户详情
  PUT    /:userId           # 编辑资料（含微信/QQ）

/api/products
  GET    /                  # 商品列表（分页+搜索$text+筛选）
  GET    /recommendations   # 推荐（同学院+最新）
  GET    /:id               # 商品详情
  POST   /                  # 发布商品
  PUT    /:id               # 编辑商品
  DELETE /:id               # 删除商品
  POST   /:id/purchase      # 购买（创建Order+减库存）
  GET    /user/:userId      # 某用户发布的
  GET    /purchased/:userId # 某用户购买的

/api/orders                 # 新增
  GET    /buy               # 我买的
  GET    /sell              # 我卖的
  PUT    /:id/confirm       # 卖家确认
  PUT    /:id/complete      # 完成交易
  PUT    /:id/cancel        # 取消

/api/cart
  GET    /                  # 购物车列表
  POST   /:productId        # 加到购物车
  PUT    /:productId        # 修改数量
  DELETE /:productId        # 移除
  DELETE /                  # 清空
  POST   /checkout/all      # 批量结算

/api/wanted
  GET    /                  # 求购列表
  POST   /                  # 发布求购

/api/reports
  POST   /                  # 举报商品

/api/admin
  GET    /stats             # 数据概览
  GET    /reports           # 举报列表
  PUT    /reports/:id       # 处理举报
  GET    /products          # 商品管理
  PUT    /products/:id      # 下架/恢复
  GET    /users             # 用户管理
  PUT    /users/:id         # 封禁/解封

/api/upload
  POST   /                  # 上传图片

/api/messages               # 精简后的通知
  GET    /                  # 我的消息
  PUT    /:id/read          # 标记已读
```

### 8.3 路由注册（精简后的 server.js）

```javascript
app.use("/api/users",    userRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders",   orderRoutes);     // 新增
app.use("/api/cart",     cartRoutes);
app.use("/api/wanted",   wantedRoutes);
app.use("/api/reports",  reportRoutes);
app.use("/api/admin",    adminRoutes);
app.use("/api/upload",   uploadRoutes);
app.use("/api/messages", messageRoutes);   // 精简替代 warnings
```

从 12 个路由模块减少到 9 个。

---

## 总结

这个优化方案的核心思路只有一句话：

> **用大厂的经验做减法，而不是做加法。**

你在闲鱼学到的分布式架构、微服务治理、高并发处理——这些在 1 万人的校园平台上都用不到。但你在闲鱼学到的另一个东西无比珍贵：**知道什么功能用户真正需要，什么功能只是产品经理的 KPI。**

校园二手平台，用户需要的就是：**发布快、找到快、交易靠谱。** 其他都是噪音。

精简后的系统只有 6 个数据模型、~25 个 API、~20 个前端组件，一个人完全能维护。省下来的 API 费用、服务器资源、开发时间，投入到真正提升用户体验的事情上——比如让商品搜索更快一点、让发布流程更简单一点、让交易状态更透明一点。

这才是从大厂出来做校园产品应该有的判断力。
