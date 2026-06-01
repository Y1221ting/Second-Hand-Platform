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

---

# 第二部分：如果真正运营，应该往哪些方向走

> 代码写好了只是第一步。以下是在闲鱼/转转看到过的、真正决定一个二手平台生死的运营方向。

---

## 方向一：信任体系 —— 校园平台的第一生命线

闲鱼做了十年，投入最大的模块不是推荐算法，不是 IM，不是支付——是**信任与安全（Trust & Safety）**。因为二手交易的本质是"把钱给一个陌生人，期待他寄来一个没见过的东西"。解决不了信任问题，平台就是空的。

### 1.1 校园场景的信任优势与劣势

**优势**（你已经有但可能没意识到）：
- 同校学生，物理空间封闭——骗了人跑不掉
- 宿舍楼号已知——敢骗人可以直接找上门
- 学院/专业/班级信息可交叉验证——冒充身份的成本很高

**劣势**（大厂平台没有但你有的）：
- 没有实名认证——注册成本为零，封号换号成本为零
- 没有资金托管——交易纠纷时没有仲裁依据
- 没有信用累积——好评差评都没有，完全靠直觉判断

### 1.2 应该建立的三层信任机制

**第一层：身份验证（阻吓恶意用户）**

```
轻量方案（零成本）：
  注册 → 管理员后台人工审核 → 手动激活
  - 1 万人的学校，日均注册量不会超过 20 个
  - 管理员看一眼学号/手机号/学院/专业是否匹配就行

进阶方案（有预算后）：
  注册 → 短信验证码 → 自动激活
  - 阿里云短信 0.045 元/条，全年预算 < 500 元
  - 一个手机号只能注册一个账号（已有 partial unique index）

终极方案（和学校合作）：
  注册 → 学校统一身份认证（SSO）→ 自动激活
  - 学号登录，杜绝校外人员
  - 这是校园平台的终极护城河
```

**第二层：行为标记（识别异常模式）**

不需要复杂的风控模型，几个简单规则就够了：

| 规则 | 说明 |
|------|------|
| 新号 24h 内发布超过 5 件 → 标记 | 正常学生不会一天发这么多 |
| 同一手机号关联多个账号 → 标记 | 已有 partial unique index 防新注册 |
| 被举报超过 3 次 → 自动冻结 | 众裁机制，群众眼睛是雪亮的 |
| 商品价格严重偏离市场价 → 提示买家 | 如"全新 iPhone 卖 200 元" |
| 发布含"加微信"、"扫码"等引流词 → 审核 | 防微商/诈骗导流到站外 |

**第三层：交易保障（出事了怎么办）**

这是闲鱼最核心的运营流程。简化到校园场景：

```
交易纠纷处理流程：

买家投诉
  ↓
管理员介入（1 人，你）
  ↓
查看双方提供的证据（聊天截图、实物照片）
  ↓
裁决：
  - 商品与描述不符 → 卖家退货退款，警告一次
  - 卖家失联       → 封号 + 全校通报（在平台公示，震慑效果极好）
  - 买家恶意毁约   → 警告一次
  ↓
三次警告 → 永久封禁
```

**为什么"全校通报"在校园场景下比任何处罚都有效？**
因为在一个 1 万人的封闭社区里，名誉成本非常高。在闲鱼上被封号，重新注册一个就行。在校园平台上被通报"张三卖假货骗同学"，整个学院都知道了——这个威慑力比任何技术手段都强。

### 1.4 校园特有的信任资产

大厂平台求之不得的东西，你天然就有：

- **宿舍楼号**：敢骗人可以直接找上门。建议在商品详情页展示卖家宿舍楼（脱敏：如"1栋3xx"），让买家知道"这人就在隔壁楼"
- **学院/专业**：信息可交叉验证。如果一个人的学院和专业对不上，很容易被识破
- **社交关系链**：同学的同学、室友的朋友。建议加一个"共同好友/共同学院"的标签（需要用户授权）

---

## 方向二：冷启动与用户增长 —— 从 0 到 1000 的真实路径

这是大多数校园项目死掉的地方。技术做完了，上线了，没用户。

### 2.1 闲鱼的冷启动是怎么做的

闲鱼最早的种子用户来自淘宝——用户在淘宝买了东西，系统自动问"要不要卖掉你之前的旧款？"这是**交易场景触发**。你没有淘宝的流量，但你有一个更精准的场景。

### 2.2 校园冷启动的具体打法（按优先级排序）

**第一优先级：毕业季/开学季窗口**

这是校园二手的"双十一"，一年两次，错过等一年。

```
毕业季（6 月）：
  - 大四学生清空宿舍，大量物品需要处理
  - 教材、台灯、风扇、床上桌、衣架——全是刚需二手货
  - 策略：提前 2 周扫楼贴海报 / 发传单 / 班级群转发
  - 目标：让毕业生知道"这里可以卖东西"

开学季（9 月）：
  - 新生入学，需要买教材、生活用品
  - 策略：迎新现场设摊 / 和学生会合作 / 新生群推广
  - 目标：让新生知道"买二手的来这里"
```

**这两个窗口如果做不好，这一年基本就废了。**

**第二优先级：种子用户——找到"关键节点"**

校园是一个社交网络，信息传播靠关键节点。

```
第一批种子用户应该是：
  - 各班的班长/团支书（他们有班级群的管理权限）
  - 学生会/社团的活跃分子
  - 宿舍楼的"楼长"或活跃分子
  - 辅导员/老师（如果他们愿意支持）

策略：
  - 找 10 个班长 → 让他们在班级群里发一条消息
  - 覆盖 10 个班 × 50 人 = 500 人
  - 转化率 10% = 50 个注册用户
  - 50 个用户每人发 1-2 件商品 = 平台就有 100 件商品了
```

**关键认知：校园平台不需要"所有人都在用"。有 500 个活跃用户，每天 20-30 件新商品，这个平台就能自运转了。**

**第三优先级：制造初始供给——"你自己先卖"**

一个空荡荡的市场没有人会来。在新平台上线的前两周：

```
- 你自己（或找几个朋友）先发布 20-30 件商品
- 找即将毕业的学长学姐，帮他们把要卖的东西拍好照发上去
- 从学校 QQ 群/微信群里搬运一些二手信息（征得本人同意）
- 确保首页打开至少有 20 件在售商品——这是用户留存的最低门槛
```

**第四优先级：和学校官方合作**

```javascript
if (能和学校合作) {
  优势 = [
    "学校官方背书 = 信任度翻倍",
    "可以用学校统一认证（学号登录）→ 天然实名",
    "可以在学校公众号/官网获得入口",
    "可以申请创新创业项目资助（很多学校有经费）",
    "可以免费用学校的服务器/网络资源",
    "可以作为毕业设计/大创项目的成果",
    "毕业后可以移交给学弟学妹继续运营"
  ];
  代价 = [
    "需要走审批流程（可能比较慢）",
    "内容可能受到学校监管",
    "不能做商业化变现（如果学校不允许）"
  ];
}
```

### 2.3 用户留存：为什么来了又走了

闲鱼有一个内部指标叫"发布转化率"——浏览了 10 个商品以上的用户中，有多少人发布了至少一件商品。

对于校园平台，最重要的留存策略是两个：

```
1. 让买家变成卖家
   - 购买成功后弹窗："你也有闲置物品要卖吗？一键发布 →"
   - 从购物车/已购记录中一键"转卖"（闲鱼的经典功能）

2. 让交易变成社交
   - 交易完成后双方都收到一条消息：
     "恭喜完成交易！对方是和你同学院的 xxx —— 说不定以后上课还能遇到 🙂"
   - 这就是校园平台独有的社交温度，闲鱼永远做不到
```

---

## 方向三：交易安全 —— 没有支付系统怎么做交易保障

### 3.1 校园交易的实际情况

学生之间的二手交易，99% 是当面交易：约在食堂、图书馆、宿舍楼下，一手交钱一手交货。这和闲鱼完全不一样——闲鱼 95% 是线上支付+快递。

**所以校园平台不需要支付宝/微信支付的集成。** 这是你的最大优势——省掉支付系统的开发、省掉资金存管牌照、省掉结算对账。

### 3.2 但你还是需要"交易状态管理"

这就是 Order 模型的价值（前面技术方案已描述）。它的核心不是处理支付，而是让双方知道：

- 卖家：有人想买你的东西了 → 快联系对方
- 买家：卖家确认了 → 约时间地点当面交易
- 双方都知道：这笔交易现在处在什么阶段

### 3.3 纠纷处理 SOP（标准操作流程）

这是运营中最棘手但也最重要的事。在闲鱼，每天有几十万个纠纷工单，有专门几百人的客服团队处理。在校园平台，你可能要自己处理所有纠纷。

```
标准处理流程（SOP）：

Step 1: 双方先自行协商（24 小时内）
  - 系统自动发送协商提醒
  - 提供"取消交易"按钮（双方都可以发起）

Step 2: 协商失败 → 管理员介入
  - 买家/卖家提交证据（聊天记录、实物照片）
  - 管理员根据证据做出裁决

Step 3: 裁决执行
  - 商品退回"在售"状态（交易取消）
  - 或标记"交易完成"（正常结束）
  - 违规方记录一次警告
```

**处理原则**：
- 保护买家优先（买家承担了更大的风险——付了钱但没拿到货）
- 但也保护卖家不被恶意退货（当面交易，买家当面验货，事后不退）
- 三次警告 = 封号（在校园公示）

---

## 方向四：内容运营 —— 让平台有"人味"

大厂平台最大的问题是"冷冰冰"——你看到的只有商品、价格、算法推荐。校园平台最大的优势是可以有"人味"。

### 4.1 商品描述的人性化

不要像闲鱼那样只展示冷冰冰的商品参数。校园平台可以展示：

```
闲鱼风格：
  "iPhone 14 Pro Max 256GB 深空黑色 9成新 ¥5200"

校园风格：
  "iPhone 14 Pro Max｜去年双十一买的，用了一年换了新手机所以出
   平时带着壳+膜，屏幕无划痕，电池健康 87%
   数信学院的，1栋宿舍楼，随时可以来看实物
   —— 张三 发布于 2 小时前"
```

差异在于：**校园风格让买家感觉"这是一个具体的人，就在隔壁楼"。**

### 4.2 社区化运营

```javascript
// 不是做一个"交易市场"，而是做一个"校园闲置集市"

可以考虑的轻量社区功能：
1. "求购墙" — 首页顶部滚动展示最近 10 条求购
   "求一本《高等数学》第七版，30 元以内，1 栋 →"
   (这比推荐算法更有效，因为求购信息直接触达潜在卖家)

2. "一周精选" — 每周手动选 3 件"值得买的"置顶
   (人工推荐 > 算法推荐，因为管理员是本校学生，懂得本校需求)

3. "交易故事" — 买家买到好东西后的分享
   "50 块淘到了一个几乎全新的床上桌，感谢学姐！"
   (UGC 内容是最好的广告)
```

---

## 方向五：变现 —— 校园平台怎么养活自己

闲鱼靠什么赚钱？广告 + 增值服务（验货宝、急速回收）+ 金融（花呗/借呗导流）。你当然做不了这些，但校园平台有自己的变现路径：

### 5.1 诚实的选择

| 模式 | 说明 | 月收入预估 |
|------|------|:---:|
| **免费 + 自愿打赏** | 平台完全免费，放一个"支持开发者"的赞赏码 | 0-200 元 |
| **学校资助** | 申请大创项目 / 学校信息化建设经费 | 2000-20000 元（一次性） |
| **毕业季增值服务** | 毕业季提供"代拍照+代发布+代发货"服务，收费 5 元/件 | 毕业季 500-2000 元 |
| **广告位（谨慎）** | 校园周边的奶茶店、打印店、考研机构投放广告 | 200-500 元/月 |

### 5.2 不建议做的

- **交易抽成**：学生之间几块钱的东西，抽成会被骂死。而且当面交易你怎么抽？
- **付费发布**：发布量本来就少，一收费就没人发了。
- **卖用户数据**：违法（个人信息保护法），而且学生的数据不值钱。

### 5.3 真正的变现是"非金钱回报"

```
做校园二手平台，直接的金钱回报有限。但非金钱回报很实在：

1. 项目经历 — "从零设计并运营了一个 5000 用户的校园平台"
   面试时比"在闲鱼做一个小功能"好使得多

2. 技术积累 — 全栈开发 + 运营 + 用户增长的完整经验

3. 校友网络 — 你可能认识全校几千个活跃用户
   (这些人毕业后的资源价值不可估量)

4. 可复制性 — 南昌师范学院做成功后，可以推广到南昌其他高校
   (江西有 100+ 所高校，每个学校都是 1 万潜在用户)
```

---

## 方向六：合规 —— 最容易忽略但最危险的事

在闲鱼，有专门的法务团队处理合规问题。在校园平台，你可能完全没想过这个问题，但一旦出事就是大问题。

### 6.1 个人信息保护（《个人信息保护法》）

你的数据库里存了什么？学生手机号、宿舍楼号、学院/专业信息。这些都是**个人信息**，受法律保护。

**你需要做的事**：

```
必须做的：
1. 在网站底部放隐私政策链接
   - 说明收集了哪些信息、用来做什么、不会分享给第三方
   - 可以抄一份合规的模板，把公司名和联系方式改掉

2. 用户有权删除自己的数据
   - "注销账号"功能（删除所有个人信息）
   - "删除商品"功能（连带删除商品中的所有个人信息）

3. 不要公开显示用户完整手机号
   - 发布商品时：手机号打码显示（138****1234）
   - 购买后才显示完整号码

建议做的：
4. .env 文件不要提交到 GitHub（已经在做了）
5. 数据库不要对公网开放（MongoDB 端口 27017 不要暴露）
6. 定期备份并加密存储（mongodump + gpg）
```

### 6.2 违禁品管理

二手平台最大的合规风险是违禁品。这不是危言耸听——如果有人在你的平台上卖违禁品，平台方要承担法律责任。

**需要在前端/后端设置关键词过滤**：

```javascript
const bannedKeywords = [
  // 违禁品类
  "香烟", "烟草", "电子烟", "酒", "白酒", "啤酒",
  "药品", "处方药", "保健品",
  "管制刀具", "甩棍", "电棍",
  "翻墙", "VPN", "梯子",
  "代考", "代写", "代课", // 学术不端相关
  // 不适合校园平台的
  "化妆品小样", // 可能是假货
  "原单", "高仿", "A货", // 假货
];
```

发布商品时检查标题和描述，命中关键词则拦截。

### 6.3 学校关系

如果平台是独立于学校运营的（没有官方合作），需要注意：

```
- 平台名称不要用"南昌师范学院官方"等误导性表述
- 不要使用学校的 logo 或校徽（除非获得授权）
- 如果学校要求删除某些内容，配合执行
- 如果学校要求关闭平台，你有两个选择：
  a) 配合关闭（避免和学校对抗）
  b) 和团委/创新创业学院沟通，争取获得官方身份
```

**最好的结果是：让学校觉得这个平台是"自己人做的、为学生服务的好事"而不是"来路不明的外部网站"。**

---

## 方向七：多校复制 —— 从一所学校到十所学校

如果南昌师范学院做成功了（500+ 活跃用户、每天 20+ 笔交易），下一步怎么做？

### 7.1 闲鱼从 0 到 1 亿用户的路径不适合你

闲鱼靠淘宝导流——背靠阿里 5 亿用户。你的增长路径更接近 **"城市包围农村"**——一个学校一个学校地做。

### 7.2 多校部署架构

```
方案 A：单实例多学校（推荐起步阶段）

  一个网站、一套代码、一个数据库
  用 school 字段区分学校
  /home?school=南昌师范学院  → 只看到本校商品
  /home?school=江西师范大学   → 切换到另一个学校

  优点：开发成本低，一个服务器搞定
  缺点：所有学校数据混在一起，某个学校出事影响全部

方案 B：一校一实例（推荐扩展阶段）

  每个学校独立部署一套
  ncsf.freevian.top  → 南昌师范学院
  jxnu.freevian.top  → 江西师范大学

  优点：数据隔离，某个学校被封不影响其他
  缺点：每个学校需要独立服务器（2GB × N）
```

**建议：先用方案 A 跑通 2-3 个学校验证模式，再考虑方案 B。**

### 7.3 推广到新学校的策略

不要自己去推广下一个学校。找那个学校的学生来做：

```
"校园合伙人"模式：
  - 在每个目标学校找一个学生运营负责人
  - 提供技术平台 + 运营指导
  - 不涉及金钱分账（避免复杂化）
  - 运营负责人获得：项目经历 + 校友资源 + 学校的创新创业学分

这本质上是"开源 + 社区运营"的模式，
类似于 Linux 的发行版——你的代码是内核，
各学校的负责人做本地化运营。
```

---

## 方向八：客服体系 —— 一个人的客服部门

在闲鱼，客服中心有几百人。你只有一个人。但客服质量直接决定用户会不会再来。

### 8.1 自助解决问题（减少 80% 的咨询）

```
常见问题 FAQ 页面：
  - "怎么发布商品？" → 截图的步骤指引
  - "怎么联系卖家？" → 购买后可以看到联系方式
  - "交易出问题了怎么办？" → 纠纷处理流程说明
  - "怎么注销账号？" → 设置 → 删除账号

把 FAQ 链接放在 Navbar 底部，减少重复咨询。
```

### 8.2 设置"客服时间"

```
不要 7×24 在线，你会疯的。

设定明确的客服时间：
  "管理员在线时间：周一至周五 20:00-22:00"
  （晚上下课后的 2 小时，足够处理当天的问题）

非在线时间收到的反馈：
  - 系统自动回复"已收到，明天 20:00 前回复您"
  - 第二天统一处理
```

### 8.3 让用户帮你做客服

```
"校园管理员"制度：
  - 招募 3-5 个活跃用户当志愿者管理员
  - 权限：可以下架明显违规的商品、可以回复用户疑问
  - 不能：封禁用户、处理举报裁决
  - 激励：管理员徽章、优先展示自己的商品、项目经历

这是校园平台的天然优势——总有热心的学生愿意帮忙。
```

---

## 总结：一个真实可行的校园二手平台运营模型

```
┌─────────────────────────────────────────┐
│              南昌师范学院二手集市           │
│                                          │
│  核心功能（极简）：                         │
│  发布商品 → 浏览搜索 → 一键购买 → 当面交易   │
│                                          │
│  信任体系：                               │
│  手机验证 + 学院/宿舍展示 + 行为标记 + 纠纷SOP │
│                                          │
│  运营节奏：                               │
│  毕业季冲量 → 开学季拉新 → 日常维护        │
│                                          │
│  生存法则：                               │
│  1 个开发者 + 3 个校园管理员 + 500 活跃用户 │
│  2GB 服务器 + 零 API 成本 + 零推广预算      │
│                                          │
│  变现路径：                               │
│  先免费积累用户，再考虑增值服务             │
│  （毕业季代发、校园周边广告）               │
│                                          │
│  最终目标：                               │
│  成为南昌师范学院的"线上跳蚤市场"           │
│  学生想买卖二手 → 第一个想到你             │
└─────────────────────────────────────────┘
```

**最后一句实在话**：

在做闲鱼的这些年，我见过太多功能强大但没人用的产品，也见过一些功能简陋但用户离不开的产品。决定一个平台生死的，从来不是代码写得有多好、架构有多先进，而是**有没有人在上面持续交易**。

对于校园二手平台来说，你唯一的 KPI 就是：**这周有没有新的商品发布？这周有没有新的交易完成？** 如果这两个问题的答案连续四周都是"有"——你的平台就活了。其他的一切，技术优化、功能迭代、推广运营，都围绕这一个目标展开。

**不要追求完美，追求"能用"。不要追求大而全，追求"有人用"。**

---

# 第三部分：逐步实施手册

> 以下是把前面的技术方案和运营方案，拆解成可一天天执行的详细步骤。每一步都标注了涉及的文件、具体操作、验证方法和预估耗时。

---

## 总览：七个阶段

```
Phase 0  代码备份与基线确立          ██░░░░░░░░  1 小时
Phase 1  后端精简（砍功能）          ████░░░░░░  6 小时
Phase 2  前端清理（去引用）          ████░░░░░░  5 小时
Phase 3  数据模型改造               ███░░░░░░░  4 小时
Phase 4  核心功能补强               ██████░░░░  8 小时
Phase 5  架构与部署优化              ███░░░░░░░  3 小时
Phase 6  运营就绪                   ████░░░░░░  5 小时
Phase 7  冷启动执行                  ████░░░░░░  持续
─────────────────────────────────────────────
合计开发时间：约 32 小时（4-5 个工作日）
```

---

## Phase 0：代码备份与基线确立

> ⏱ 约 1 小时 | 🎯 确保随时可以回滚

### Step 0.1 — 创建备份分支

```bash
# 在项目根目录执行
git checkout single-school
git pull origin single-school
git checkout -b refactor/v3-simplify
git push origin refactor/v3-simplify

# 验证
git branch --show-current
# 应输出: refactor/v3-simplify
```

### Step 0.2 — 给当前版本打 tag

```bash
git tag v2.4.0-baseline -m "精简重构前基线"
git push origin v2.4.0-baseline
```

### Step 0.3 — 导出当前 API 清单（方便重构后对照）

```bash
# 记录当前所有路由文件
ls -la Server/routes/
ls -la Server/models/
ls -la Server/controllers/

# 把当前文件列表存下来
git ls-files Server/ Client/src/ > baseline-files.txt
```

### Phase 0 完成标准

- [ ] 新分支 `refactor/v3-simplify` 已创建并推送
- [ ] tag `v2.4.0-baseline` 已打
- [ ] 随时可以 `git checkout single-school` 回到重构前状态

---

## Phase 1：后端精简（砍功能）

> ⏱ 约 6 小时 | 🎯 9 个 Model → 5 个，12 个 Route → 9 个

### Step 1.1 — 移除 AI 模块（30 分钟）

**删除文件**：
```bash
rm Server/services/aiService.js
rm Server/controllers/aiController.js
rm Server/routes/aiRoutes.js
```

**修改文件**：`Server/server.js`

```javascript
// 删除这一行
app.use("/api/ai", aiRoutes);

// 删除这一行（文件顶部）
const aiRoutes = require("./routes/aiRoutes");
```

**验证**：
```bash
# 启动后端，确认无报错
cd Server && node server.js
# 确认 /api/ai/generate-description 返回 404
curl http://localhost:8000/api/ai/generate-description
```

### Step 1.2 — 移除站内私信 IM（30 分钟）

**删除文件**：
```bash
rm Server/models/Conversation.js
rm Server/models/Message.js
rm Server/routes/messageRoutes.js
```

**修改文件**：`Server/server.js`

```javascript
// 删除
app.use("/api", require("./routes/messageRoutes"));
```

**验证**：
```bash
# 确认消息相关 API 返回 404
curl http://localhost:8000/api/conversations
curl http://localhost:8000/api/conversations/unread-count
```

### Step 1.3 — 移除评价系统（20 分钟）

**删除文件**：
```bash
rm Server/models/Review.js
rm Server/routes/reviewRoutes.js
```

**修改文件**：`Server/server.js`

```javascript
// 删除
app.use("/api/reviews", require("./routes/reviewRoutes"));
```

### Step 1.4 — 移除申诉系统（20 分钟）

**删除文件**：
```bash
rm Server/models/Appeal.js
rm Server/routes/appealRoutes.js
```

**修改文件**：`Server/server.js`

```javascript
// 删除
app.use("/api/appeals", require("./routes/appealRoutes"));
```

**修改文件**：`Server/routes/adminRoutes.js`

删除申诉管理相关的路由（约 100 行，包含 `GET /appeals` 和 `PUT /appeals/:id`）。

### Step 1.5 — 精简通知系统 → 简单消息（1 小时）

**重命名和精简**：

将 `Warning` 模型简化为轻量的用户消息：

```javascript
// Server/models/Message.js（新建，替代 Warning.js）
const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  content: {
    type: String,
    required: true,
    trim: true,
  },
  isRead: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

messageSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model("Message", messageSchema);
```

**删除文件**：
```bash
rm Server/models/Warning.js
rm Server/routes/warningRoutes.js
```

**修改文件**：`Server/server.js`
```javascript
// 将
app.use("/api/warnings", require("./routes/warningRoutes"));
// 改为
app.use("/api/messages", require("./routes/messageRoutes"));
```

**新建**：`Server/routes/messageRoutes.js`（精简版，只有 GET 列表 + PUT 标记已读）

**全局替换**：所有引用 `Warning` 模型的地方改为 `Message`：
- `Server/routes/adminRoutes.js`：管理员操作后创建 Message 替代 Warning，去掉 severity/type/metadata 字段
- `Server/controllers/userController.js`：如果有 Warning 引用

### Step 1.6 — 简化认证：去掉 session 机制（1.5 小时）

**修改文件**：`Server/config/auth.js`

```javascript
// 简化前
async function createSession(userId) {
  const sessionId = crypto.randomUUID();
  const token = jwt.sign({ userId, sessionId }, SECRET, { expiresIn: "1d" });
  return { token, sessionId };
}

// 简化后
function createToken(userId) {
  return jwt.sign({ userId }, SECRET, { expiresIn: "7d" }); // 7 天免登录
}

// 移除 crypto 的 require
```

**修改文件**：`Server/middleware/authMiddleware.js`

```javascript
// 简化前：验证 JWT → 检查 activeSessions → 挂载 req.user + req.sessionId
// 简化后：
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { SECRET } = require("../config/auth");

module.exports = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "请先登录" });
    }
    const decoded = jwt.verify(token, SECRET);
    const user = await User.findById(decoded.userId).select("-password");
    if (!user) {
      return res.status(401).json({ message: "用户不存在" });
    }
    if (user.status === "banned") {
      return res.status(403).json({ message: "账号已被封禁" });
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: "登录已过期，请重新登录" });
  }
};
```

**修改文件**：`Server/models/User.js`

```javascript
// 删除 activeSessions 字段
// 删除 phoneUniqueEnforced 字段
// 删除 partial unique index of phoneNo
// 新增 wechat 和 qq 字段
wechat: { type: String, trim: true, default: "" },
qq:     { type: String, trim: true, default: "" },
```

**修改文件**：`Server/controllers/userController.js`

```javascript
// loginUser 简化：
// - 去掉 session 生成
// - 去掉 updateOne $push activeSessions
// - 直接返回 token（不再返回 sessionId）

exports.loginUser = async (req, res) => {
  // ... 校验邮箱密码 ...
  // ... 封禁检查 ...
  
  const token = createToken(existingUser._id.toString()); // 只需要 token
  
  const userData = existingUser.toObject();
  delete userData.password;
  delete userData.activeSessions; // 此字段已删除，但保留此行为旧数据兼容
  res.status(200).json({ token, user: userData });
};

// logoutUser 简化或删除
// logout 路由可以保留，但只是前端清除 token（后端不需要做任何事）
```

**修改文件**：`Server/routes/userRoutes.js`

```javascript
// POST /logout 路由保留，简化为直接返回成功
router.post("/logout", authMiddleware, (req, res) => {
  res.json({ message: "已登出" });
});
```

**修改文件**：删除 `Client/src/utils/sessionGuard.js`

### Step 1.7 — Decimal128 → Number（1 小时）

**修改文件**：`Server/models/Product.js`

```javascript
// 修改前
price: { type: mongoose.Types.Decimal128, required: true, validate: ... }

// 修改后
price: { type: Number, required: true, min: 0, max: 9999.9 }

// 删除 toJSON 和 toObject 中的 Decimal128 transform
```

**修改文件**：`Server/models/Wanted.js`

```javascript
// 同样改 budget 从 Decimal128 → Number
```

**全局清理**：搜索并删除所有 `Number(product.price) || 0` 和 `Number(productObj.price) || 0`：
```bash
# 查找需要清理的行
grep -rn "Number(.*price)" Server/controllers/
grep -rn "\$numberDecimal" Server/
```

涉及文件：
- `Server/controllers/productController.js`：~10 处
- `Server/controllers/cartController.js`：~3 处
- `Server/routes/adminRoutes.js`：~2 处

全部改为直接使用 `product.price`（已经是 Number 类型）。

### Step 1.8 — 简化推荐引擎（30 分钟）

**修改文件**：`Server/controllers/productController.js` 中的 `getRecommendations`

```javascript
// 简化前：六层漏斗（~150 行）
// 简化后：两层（~40 行）

exports.getRecommendations = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 6;
    const excludeId = req.query.excludeId || "";
    const department = req.query.department || "";
    const userId = req.query.userId || "";

    const baseFilter = {
      _id: { $ne: excludeId },
      status: { $nin: ["sold_out", "inactive"] },
    };
    if (userId) baseFilter["uploadedBy.id"] = { $ne: userId };

    // 第一层：同学院商品
    let recommendations = [];
    if (department) {
      recommendations = await Product.find({ ...baseFilter, "uploadedBy.department": department })
        .sort({ createdAt: -1 })
        .limit(limit)
        .select("name images price uploadedBy category status createdAt");
    }

    // 第二层：最新商品补足
    const usedIds = recommendations.map(p => p._id.toString());
    if (recommendations.length < limit) {
      const fill = await Product.find({
        ...baseFilter,
        _id: { $nin: [...usedIds, excludeId].filter(Boolean) },
      })
        .sort({ createdAt: -1 })
        .limit(limit - recommendations.length)
        .select("name images price uploadedBy category status createdAt");
      recommendations = [...recommendations, ...fill];
    }

    const result = recommendations.map(p => ({
      ...p.toObject(),
      price: p.price, // 已经是 Number，无需转换
      images: p.images?.length > 0 ? [p.images[0]] : [],
    }));

    res.json(result);
  } catch (err) {
    console.error("推荐失败:", err);
    res.json([]);
  }
};
```

### Phase 1 完成标准

- [ ] 后端启动无报错
- [ ] `ls Server/models/` 只有 User, Product, Wanted, Report, Message, Order(待加)
- [ ] `ls Server/routes/` 只有 9 个模块
- [ ] `curl http://localhost:8000/api/ai/...` 返回 404
- [ ] `curl http://localhost:8000/api/conversations` 返回 404
- [ ] `curl http://localhost:8000/api/reviews/...` 返回 404
- [ ] 登录接口返回的 token 中不含 sessionId
- [ ] 商品价格不再是 `{ $numberDecimal: "99.99" }` 而是 `99.99`

---

## Phase 2：前端清理（去引用）

> ⏱ 约 5 小时 | 🎯 ~35 个组件 → ~20 个，无编译报错

### Step 2.1 — 移除 AI 相关 UI（30 分钟）

**修改文件**：`Client/src/components/AddProduct.js`

```jsx
// 找到 AI 生成描述按钮和 AI 推荐分类按钮
// 删除相关 JSX 和状态变量

// 替换为快捷描述模板按钮：
const quickTemplates = [
  "九成新，只用了不到一学期",
  "正常使用痕迹，功能完好",
  "全新未拆封",
  "闲置很久了，便宜出",
  "毕业清仓，给钱就卖",
];
```

### Step 2.2 — 移除 IM 相关组件（20 分钟）

**删除文件**：
```bash
rm Client/src/components/ConversationList.js
rm Client/src/components/ChatWindow.js
```

**修改文件**：`Client/src/App.js`

```jsx
// 删除 lazy imports
// const ConversationList = lazy(() => import("./components/ConversationList"));
// const ChatWindow = lazy(() => import("./components/ChatWindow"));

// 删除路由
// <Route path="/messages" ... />
// <Route path="/messages/:conversationId" ... />
```

**修改文件**：`Client/src/components/Utility/Navbar.js`

```jsx
// 删除消息图标和未读角标
```

### Step 2.3 — 移除/精简通知组件（30 分钟）

**删除文件**：
```bash
rm Client/src/components/Warnings.js
rm Client/src/components/NotificationModal.js
```

**修改文件**：`Client/src/App.js`

```jsx
// 删除 Warnings 路由
// 删除 NotificationModal 的渲染
```

**修改文件**：`Client/src/context/NotificationContext.js`

```jsx
// 删除 critical warning 轮询逻辑
// 简化为一个轻量的 unreadCount 状态（从 /api/messages 获取）
```

### Step 2.4 — 移除评价相关 UI（15 分钟）

**修改文件**：`Client/src/components/ProductPage.js`

```jsx
// 删除卖家信用卡片（评分、好评率）
// 保留卖家基本信息展示（学院、专业、宿舍楼）
```

**修改文件**：`Client/src/components/UserProfile.js`

```jsx
// 删除"评价"Tab
// 只保留 [在售] [已售] 两个 Tab
// 删除评分统计卡片
```

### Step 2.5 — 移除申诉相关 UI（15 分钟）

**删除文件**：
```bash
rm Client/src/components/Profile/AppealForm.js
rm Client/src/components/Profile/AppealList.js
```

**修改文件**：`Client/src/App.js`

```jsx
// 删除 AdminAppeals 路由
// const AdminAppeals = lazy(() => import("./components/Admin/Appeals"));
```

**删除文件**：
```bash
rm Client/src/components/Admin/Appeals.js
```

### Step 2.6 — 更新 authContext 去 session 逻辑（30 分钟）

**修改文件**：`Client/src/context/authContext.js`

```jsx
// 重新实现，去掉 session 相关逻辑：

import React, { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem("user");
      return stored ? JSON.parse(stored) : null;
    } catch { return null; }
  });

  const login = (newUser, newToken) => {
    setUser(newUser);
    localStorage.setItem("user", JSON.stringify(newUser));
    localStorage.setItem("token", newToken);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    // 可选：调后端 logout
    fetch("/api/users/logout", { method: "POST" }).catch(() => {});
  };

  const isAuthenticated = !!user;
  const isAdmin = user?.role === "admin";

  // 监听跨标签页 login（简化）
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "token" && !e.newValue) {
        // 其他标签页登出了
        setUser(null);
      }
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};
```

**修改文件**：`Client/src/App.js`

```jsx
// 删除 import "./utils/sessionGuard"
```

### Step 2.7 — 更新商品详情页展示微信/QQ（30 分钟）

**修改文件**：`Client/src/components/ProductPage.js`

```jsx
// 在卖家信息区新增微信/QQ 展示（替代"联系卖家"跳转聊天）
// 仅购买后显示完整联系方式

{isPurchased ? (
  <div className="seller-contact">
    <p>📱 微信：{product.uploadedBy.wechat || "未填写"}</p>
    <p>💬 QQ：{product.uploadedBy.qq || "未填写"}</p>
    <p>📞 电话：{product.uploadedBy.phone}</p>
  </div>
) : (
  <p className="text-gray-400">购买后可查看联系方式</p>
)}
```

### Step 2.8 — 编译验证（30 分钟）

```bash
cd Client
npm run build

# 修复所有编译报错（主要是 import 引用到了已删除的文件）
# 逐个处理，常见报错：
# - "Module not found" → 删除 import 语句
# - "'X' is not exported" → 删除引用
```

### Phase 2 完成标准

- [ ] `npm run build` 成功，无报错
- [ ] `ls Client/src/components/` 中已删除 ConversationList, ChatWindow, Warnings, NotificationModal
- [ ] Navbar 中无消息图标
- [ ] ProductPage 中无评价展示
- [ ] UserProfile 中无评价 Tab
- [ ] Admin 后台无申诉管理入口
- [ ] authContext 代码行数减少 ~40%

---

## Phase 3：数据模型改造

> ⏱ 约 4 小时 | 🎯 User/Product 模型更新 + Order 模型新建

### Step 3.1 — User 模型最终版（30 分钟）

**修改文件**：`Server/models/User.js`

```javascript
const userSchema = new mongoose.Schema({
  email:      { type: String, required: true, unique: true, lowercase: true, trim: true },
  password:   { type: String, required: true, minlength: 6 },
  fullName:   { type: String, required: true, trim: true },
  college:    { type: String, default: "南昌师范学院" },
  department: { type: String, required: true, enum: [/* 13学院 */] },
  major:      { type: String, required: true },
  dormitory:  { type: String, trim: true, default: "" },
  phoneNo:    { type: String, required: true, validate: /^1[3-9]\d{9}$/ },
  wechat:     { type: String, trim: true, default: "" },   // 新增
  qq:         { type: String, trim: true, default: "" },   // 新增
  address:    { type: String, trim: true, default: "南昌师范学院" },
  cart: [{
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
    quantity:  { type: Number, default: 1, min: 1 },
    addedAt:   { type: Date, default: Date.now },
  }],
  role:   { type: String, enum: ["user", "admin"], default: "user" },
  status: { type: String, enum: ["active", "banned"], default: "active" },
}, { timestamps: true });
```

删除：`activeSessions`, `phoneUniqueEnforced`, phoneNo 部分唯一索引。

### Step 3.2 — Product 模型最终版（20 分钟）

**修改文件**：`Server/models/Product.js`

```javascript
// price 从 Decimal128 改为 Number
price: { type: Number, required: true, min: 0, max: 9999.9 },

// uploadedBy 新增 wechat 和 qq
const SellerSchema = new mongoose.Schema({
  id: String, name: String, college: String,
  department: String, major: String, dormitory: String,
  phone: String,
  wechat: String,  // 新增
  qq: String,      // 新增
});

// 删除 toJSON/toObject 的 Decimal128 transform

// 保留所有索引
ProductSchema.index({ name: "text", description: "text" });
ProductSchema.index({ createdAt: -1 });
ProductSchema.index({ status: 1, category: 1, createdAt: -1 });
ProductSchema.index({ status: 1, "uploadedBy.department": 1, createdAt: -1 });
ProductSchema.index({ "uploadedBy.id": 1, status: 1 });
ProductSchema.index({ "purchasedBy.id": 1 });
```

### Step 3.3 — 新建 Order 模型（1 小时）

**新建文件**：`Server/models/Order.js`

```javascript
const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  buyerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  sellerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ["pending", "confirmed", "completed", "cancelled"],
    default: "pending",
  },
  buyerInfo: {
    name: String, phone: String,
    department: String, major: String, dormitory: String,
  },
  sellerInfo: {
    name: String, phone: String,
    department: String, major: String, dormitory: String,
    wechat: String, qq: String,
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// 索引
orderSchema.index({ buyerId: 1, status: 1, createdAt: -1 });   // 我买的
orderSchema.index({ sellerId: 1, status: 1, createdAt: -1 });  // 我卖的
orderSchema.index({ productId: 1 });                             // 查某商品的订单

// 更新 updatedAt
orderSchema.pre("findOneAndUpdate", function() {
  this.set({ updatedAt: new Date() });
});

module.exports = mongoose.model("Order", orderSchema);
```

### Step 3.4 — 新建 Order 路由和控制器（1.5 小时）

**新建文件**：`Server/controllers/orderController.js`

```javascript
const Order = require("../models/Order");
const Product = require("../models/Product");

// 创建订单（购买商品时调用）
exports.createOrder = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "商品不存在" });
    if (product.uploadedBy.id === req.user._id.toString()) {
      return res.status(400).json({ message: "不能购买自己的商品" });
    }
    if (product.status !== "unsold" || product.quantity < 1) {
      return res.status(400).json({ message: "商品已售罄或已下架" });
    }

    // 原子操作：减库存
    const updated = await Product.findOneAndUpdate(
      { _id: product._id, quantity: { $gt: 0 }, status: "unsold" },
      { $inc: { quantity: -1 } },
      { new: true }
    );
    if (!updated) return res.status(400).json({ message: "库存不足" });

    // 库存归零则标记售罄
    if (updated.quantity === 0) {
      await Product.findByIdAndUpdate(updated._id, { status: "sold_out" });
    }

    // 创建订单
    const order = await Order.create({
      productId: product._id,
      buyerId: req.user._id,
      sellerId: product.uploadedBy.id,
      price: product.price,
      buyerInfo: {
        name: req.user.fullName,
        phone: req.user.phoneNo,
        department: req.user.department,
        major: req.user.major,
        dormitory: req.user.dormitory,
      },
      sellerInfo: {
        name: product.uploadedBy.name,
        phone: product.uploadedBy.phone,
        department: product.uploadedBy.department,
        major: product.uploadedBy.major,
        dormitory: product.uploadedBy.dormitory,
        wechat: product.uploadedBy.wechat || "",
        qq: product.uploadedBy.qq || "",
      },
    });

    res.status(201).json({ message: "购买成功，请等待卖家确认", order });
  } catch (err) {
    console.error("创建订单失败:", err);
    res.status(500).json({ message: "服务器错误" });
  }
};

// 我买的
exports.getBuyOrders = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = 20;
  const [orders, total] = await Promise.all([
    Order.find({ buyerId: req.user._id })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit).limit(limit)
      .populate("productId", "name images price status"),
    Order.countDocuments({ buyerId: req.user._id }),
  ]);
  res.json({ orders, total, page, totalPages: Math.ceil(total / limit) });
};

// 我卖的
exports.getSellOrders = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = 20;
  const [orders, total] = await Promise.all([
    Order.find({ sellerId: req.user._id })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit).limit(limit)
      .populate("productId", "name images price status"),
    Order.countDocuments({ sellerId: req.user._id }),
  ]);
  res.json({ orders, total, page, totalPages: Math.ceil(total / limit) });
};

// 卖家确认
exports.confirmOrder = async (req, res) => {
  const order = await Order.findOneAndUpdate(
    { _id: req.params.id, sellerId: req.user._id, status: "pending" },
    { status: "confirmed" },
    { new: true }
  );
  if (!order) return res.status(400).json({ message: "订单不存在或状态不允许确认" });
  res.json({ message: "已确认，请约时间当面交易", order });
};

// 完成交易
exports.completeOrder = async (req, res) => {
  const order = await Order.findOneAndUpdate(
    { _id: req.params.id, status: "confirmed" },
    { status: "completed" },
    { new: true }
  );
  if (!order) return res.status(400).json({ message: "订单不存在或状态不允许" });
  
  // 标记商品为已售
  await Product.findByIdAndUpdate(order.productId, {
    status: "sold",
    purchasedBy: order.buyerInfo,
  });
  
  res.json({ message: "交易完成", order });
};

// 取消订单
exports.cancelOrder = async (req, res) => {
  const order = await Order.findOne({
    _id: req.params.id,
    $or: [{ buyerId: req.user._id }, { sellerId: req.user._id }],
    status: { $in: ["pending", "confirmed"] },
  });
  if (!order) return res.status(400).json({ message: "订单不存在或状态不允许取消" });
  
  order.status = "cancelled";
  await order.save();
  
  // 恢复库存
  await Product.findByIdAndUpdate(order.productId, {
    $inc: { quantity: 1 },
    status: "unsold",
  });
  
  res.json({ message: "订单已取消" });
};
```

**新建文件**：`Server/routes/orderRoutes.js`

```javascript
const router = require("express").Router();
const auth = require("../middleware/authMiddleware");
const ctrl = require("../controllers/orderController");

router.post("/:id", auth, ctrl.createOrder);        // 购买 = 创建订单
router.get("/buy", auth, ctrl.getBuyOrders);         // 我买的
router.get("/sell", auth, ctrl.getSellOrders);       // 我卖的
router.put("/:id/confirm", auth, ctrl.confirmOrder); // 卖家确认
router.put("/:id/complete", auth, ctrl.completeOrder); // 完成
router.put("/:id/cancel", auth, ctrl.cancelOrder);   // 取消

module.exports = router;
```

**修改文件**：`Server/server.js`

```javascript
// 新增
app.use("/api/orders", require("./routes/orderRoutes"));
```

### Step 3.5 — Person 模型更新 createProduct（15 分钟）

**修改文件**：`Server/controllers/productController.js` 中的 `createProduct`

```javascript
// uploadedBy 中新增 wechat 和 qq
req.body.uploadedBy = {
  id: req.user._id.toString(),
  name: req.user.fullName,
  college: "南昌师范学院",
  department: req.user.department || "",
  major: req.user.major || "",
  dormitory: req.user.dormitory || "",
  phone: req.user.phoneNo || "",
  wechat: req.user.wechat || "",  // 新增
  qq: req.user.qq || "",          // 新增
};
```

### Phase 3 完成标准

- [ ] `POST /api/orders/:productId` 创建订单成功，商品库存 -1
- [ ] `GET /api/orders/buy` 返回买家订单列表
- [ ] `GET /api/orders/sell` 返回卖家订单列表
- [ ] `PUT /api/orders/:id/confirm` 卖家确认 → 状态变为 confirmed
- [ ] `PUT /api/orders/:id/complete` 交易完成 → 商品标记 sold
- [ ] `PUT /api/orders/:id/cancel` 取消 → 库存恢复 + 状态变为 cancelled
- [ ] User 模型的 wechat/qq 字段可编辑

---

## Phase 4：核心功能补强

> ⏱ 约 8 小时 | 🎯 搜索升级 + 用户注册页改版 + 商品发布优化 + 管理员后台精简

### Step 4.1 — 搜索切换为文本索引（1 小时）

**修改文件**：`Server/controllers/productController.js` 的 `getAllProducts`

```javascript
// 优先使用 $text（文本索引搜索），回退到 $regex
if (search) {
  query.$text = { $search: search };
  sortObj = { score: { $meta: "textScore" } };
  // 同时保留 $regex 作为 fallback（用户搜单个词时）
  // 在返回结果中加上 textScore
}

// 查询时
let products;
if (query.$text) {
  products = await Product.find(query, { score: { $meta: "textScore" } })
    .sort(sortObj)
    .skip((page - 1) * limit)
    .limit(limit);
} else {
  products = await Product.find(query)
    .sort(sortObj)
    .skip((page - 1) * limit)
    .limit(limit);
}
```

**注意**：MongoDB 文本索引不支持中文分词。`$text` 搜索中文时效果一般。如果发现中文搜索效果差，保留 `$regex` 方案但确保转义。

### Step 4.2 — 注册页新增微信/QQ 字段（30 分钟）

**修改文件**：`Client/src/components/Register.js`

```jsx
// 在表单中新增两个选填字段
<div className="form-group">
  <label>微信号（选填，方便买家联系你）</label>
  <input type="text" name="wechat" placeholder="选填" />
</div>
<div className="form-group">
  <label>QQ号（选填）</label>
  <input type="text" name="qq" placeholder="选填" />
</div>
```

### Step 4.3 — 个人资料编辑新增微信/QQ（20 分钟）

**修改文件**：`Client/src/components/Profile/UserDetails.js`

```jsx
// 编辑模式下增加 wechat/qq 字段
```

### Step 4.4 — 商品发布页优化（1.5 小时）

**修改文件**：`Client/src/components/AddProduct.js`

```jsx
// 1. 去掉 AI 相关按钮（已在 Phase 2 完成）
// 2. 新增快捷描述模板
// 3. 分类选择简化（默认"其他"，可选填）
// 4. 描述改为 textarea 但非必填（提供模板后可以一键填入）
```

### Step 4.5 — 管理后台精简（2 小时）

**修改文件**：`Client/src/components/Admin/AdminLayout.js`

```jsx
// 侧边栏菜单删除"申诉管理"项
```

**修改文件**：`Server/routes/adminRoutes.js`

```javascript
// 删除申诉管理路由（GET/PUT /appeals）
// 将 Warning 引用全部改为 Message（已在 Phase 1 处理）
```

精简后的 admin 侧边栏：
```
数据概览 → Dashboard
举报管理 → Reports
商品管理 → Products
用户管理 → Users
通知记录 → Messages (原 Warnings)
```

### Step 4.6 — 前端新增订单页面（2 小时）

**新建文件**：`Client/src/components/Orders.js`

```jsx
// 两个 Tab：[我买的] [我卖的]

// 我买的列表：
// - 商品图片 + 名称 + 价格 + 卖家名 + 状态标签 + 时间
// - 状态：待确认(pending) / 已确认(confirmed) / 已完成(completed) / 已取消(cancelled)
// - pending/confirmed 可点击取消
// - confirmed 可点击"完成交易"

// 我卖的列表：
// - 同上但视角相反
// - pending 可点击"确认"或"取消"
// - confirmed 等待买家确认完成
```

**修改文件**：`Client/src/App.js`

```jsx
const Orders = lazy(() => import("./components/Orders"));

<Route path="/orders" element={
  <ProtectedRoute><Orders /></ProtectedRoute>
} />
```

**修改文件**：`Client/src/components/Utility/Navbar.js`

```jsx
// 用户下拉菜单新增"我的订单"入口
// 新增订单状态角标（有待处理的订单时显示红点）
```

### Step 4.7 — 注册页手机号验证（可选，1 小时）

如果预算允许，集成阿里云短信服务：

```bash
npm install @alicloud/sms-sdk
```

```javascript
// Server/services/smsService.js
const SMSClient = require("@alicloud/sms-sdk");

const client = new SMSClient({
  accessKeyId: process.env.ALI_ACCESS_KEY,
  secretAccessKey: process.env.ALI_SECRET_KEY,
});

exports.sendVerifyCode = async (phoneNo) => {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  await client.sendSMS({
    PhoneNumbers: phoneNo,
    SignName: "南昌师范二手集市",
    TemplateCode: "SMS_XXXXX",
    TemplateParam: JSON.stringify({ code }),
  });
  return code; // 存到 session 或 Redis 做 5 分钟过期验证
};
```

**如果预算不允许**：保持现状（格式校验），管理员人工审核新用户。

### Phase 4 完成标准

- [ ] 搜索可用且支持中文
- [ ] 注册/编辑资料可以填写微信/QQ
- [ ] 发布商品有快捷描述模板
- [ ] 管理后台无申诉入口
- [ ] 用户有"我的订单"页面，能查看和管理订单状态
- [ ] 商品详情页购买后显示卖家联系方式

---

## Phase 5：架构与部署优化

> ⏱ 约 3 小时 | 🎯 3 容器 → 2 容器，数据库连接池调优

### Step 5.1 — 合并前端到后端容器（1.5 小时）

**修改文件**：`Server/server.js`

```javascript
// 在路由注册之后、app.listen 之前，新增静态文件服务

// 生产环境：serve React build
if (process.env.NODE_ENV === "production") {
  const buildPath = path.join(__dirname, "..", "Client", "build");
  app.use(express.static(buildPath));
  app.get("*", (req, res) => {
    // 排除 API 路由
    if (!req.path.startsWith("/api/") && !req.path.startsWith("/uploads/")) {
      res.sendFile(path.join(buildPath, "index.html"));
    }
  });
}
```

**修改文件**：`docker-compose.yml`

```yaml
# 删除 frontend 服务（约 20 行）
# backend 的 ports 改为映射 80 或 5000

services:
  mongodb:
    # ... 保持不变
  
  backend:
    build:
      context: .
      dockerfile: Server/Dockerfile
    container_name: second-hand-backend
    restart: always
    ports:
      - "5000:8000"    # 直接暴露给外部
    environment:
      - MONGODB_URI=${MONGODB_URI_FULL}
      - PORT=8000
      - JWT_SECRET=${JWT_SECRET}
      - NODE_ENV=production
    depends_on:
      - mongodb
    networks:
      - second-hand-network
    volumes:
      - ./Server/uploads:/app/uploads  # 只映射 uploads
```

**修改文件**：`Server/Dockerfile`

```dockerfile
FROM node:18-alpine
WORKDIR /app

# 复制依赖文件
COPY Server/package*.json ./
RUN npm install --production

# 复制后端代码
COPY Server/ .

# 复制前端 build（从宿主机）
COPY Client/build ../Client/build

EXPOSE 8000
CMD ["node", "server.js"]
```

### Step 5.2 — 数据库连接池调优（30 分钟）

**修改文件**：`Server/config/db.js`

```javascript
const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      maxPoolSize: 10,       // 原默认 100，改为 10
      minPoolSize: 2,
      serverSelectionTimeoutMS: 5000,
      heartbeatFrequencyMS: 10000,
    });
    console.log("MongoDB connected");
  } catch (err) {
    console.error("MongoDB connection error:", err.message);
    process.exit(1);
  }
};

module.exports = connectDB;
```

### Step 5.3 — MongoDB 缓存降低（10 分钟）

**修改文件**：`docker-compose.yml`

```yaml
mongodb:
  command: --wiredTigerCacheSizeGB 0.25  # 从 0.5 降到 0.25（256MB）
  deploy:
    resources:
      limits:
        memory: 512M  # 从 768M 降到 512M
```

### Step 5.4 — 数据备份脚本（30 分钟）

**新建文件**：`backup.sh`（放在项目根目录）

```bash
#!/bin/bash
# 每天凌晨 3 点执行：crontab -e → 0 3 * * * /path/to/backup.sh

BACKUP_DIR="/backup/mongodb"
CONTAINER="second-hand-mongodb"
RETENTION_DAYS=7

mkdir -p "$BACKUP_DIR"
DATE=$(date +%Y%m%d_%H%M%S)
docker exec "$CONTAINER" mongodump \
  --username admin \
  --password "${MONGO_INITDB_ROOT_PASSWORD}" \
  --authenticationDatabase admin \
  --out "/tmp/backup_$DATE"

docker cp "$CONTAINER:/tmp/backup_$DATE" "$BACKUP_DIR/"
docker exec "$CONTAINER" rm -rf "/tmp/backup_$DATE"

# 压缩
tar -czf "$BACKUP_DIR/backup_$DATE.tar.gz" -C "$BACKUP_DIR" "backup_$DATE"
rm -rf "$BACKUP_DIR/backup_$DATE"

# 删除 7 天前的备份
find "$BACKUP_DIR" -name "*.tar.gz" -mtime +$RETENTION_DAYS -delete

echo "Backup completed: backup_$DATE.tar.gz"
```

### Step 5.5 — 全链路测试（30 分钟）

```bash
# 1. 构建和启动
docker compose up -d --build

# 2. 验证容器运行
docker compose ps
# 应只有 mongodb + backend 两个容器

# 3. 核心流程测试（用 curl 或浏览器）
# 注册 → 登录 → 发布商品 → 浏览首页 → 查看详情 → 购买 → 查看订单 → 确认 → 完成

# 4. 检查日志
docker compose logs backend --tail 20
```

### Phase 5 完成标准

- [ ] `docker compose ps` 只显示 2 个容器
- [ ] 访问 `http://服务器IP:5000` 能打开前端页面
- [ ] API 请求正常（前端页面功能可用）
- [ ] 数据库备份脚本可执行
- [ ] 全链路测试通过

---

## Phase 6：运营就绪

> ⏱ 约 5 小时 | 🎯 违禁词过滤 + 隐私政策 + FAQ + 种子商品

### Step 6.1 — 违禁品关键词过滤（1 小时）

**新建文件**：`Server/config/bannedKeywords.js`

```javascript
module.exports = [
  "香烟", "烟草", "电子烟", "酒", "白酒", "啤酒", "红酒",
  "药品", "处方药", "保健品", "壮阳", "减肥药",
  "管制刀具", "甩棍", "电棍", "防狼喷雾",
  "翻墙", "VPN", "梯子", "科学上网",
  "代考", "代写", "代课", "代做", "毕业论文",
  "高仿", "A货", "原单", "精仿",
  "赌博", "彩票", "网赌",
  "枪支", "弹药", "毒品",
  "色情", "裸聊", "约炮",
];
```

**修改文件**：`Server/controllers/productController.js` 的 `createProduct` 和 `updateProductById`

```javascript
const bannedKeywords = require("../config/bannedKeywords");

// 在 createProduct 开头加入过滤
const checkText = `${req.body.name || ""} ${req.body.description || ""}`.toLowerCase();
const hit = bannedKeywords.find(kw => checkText.includes(kw.toLowerCase()));
if (hit) {
  return res.status(400).json({ message: `商品信息包含违禁词"${hit}"，请修改后重新发布` });
}
```

### Step 6.2 — 隐私政策页面（30 分钟）

**新建文件**：`Client/src/components/Privacy.js`

```jsx
// 一个简单的静态页面，说明：
// 1. 我们收集哪些信息（邮箱、手机号、学院专业、宿舍楼）
// 2. 信息用来做什么（展示商品、联系交易）
// 3. 信息不会分享给第三方
// 4. 用户有权删除自己的数据（注销账号功能）
// 5. 联系方式（你的邮箱）

// 路由：/privacy
```

### Step 6.3 — FAQ 页面（45 分钟）

**新建文件**：`Client/src/components/FAQ.js`

```jsx
// FAQ 页面，涵盖：
// - 怎么发布商品？
// - 怎么搜索想要的商品？
// - 怎么联系卖家？
// - 怎么购买/下单？
// - 交易怎么完成（当面交易流程）？
// - 买/卖过程中出了问题怎么办？
// - 怎么注销账号？
// - 管理员是谁？怎么联系？
```

### Step 6.4 — 准备种子商品数据（1 小时）

```javascript
// Server/scripts/seed.js
// 初始化 20 条模拟商品数据，让平台上线时首页不空

const seedProducts = [
  { name: "高等数学（第七版）上册", category: "教材教辅", price: 25,
    description: "九成新，只有第一章有少量笔记，其他部分几乎全新。",
    images: ["/uploads/seed/math_book_1.jpg"], /* 需要提前准备图片 */ },
  { name: "大学英语四级真题 2024版", category: "教材教辅", price: 15,
    description: "做了一半，后面都是空白的。附赠听力光盘未拆。",
    images: ["/uploads/seed/cet4_1.jpg"] },
  // ... 18 条更多商品
];

// 执行：node Server/scripts/seed.js
```

### Step 6.5 — 用户注销功能（30 分钟）

**修改文件**：`Client/src/components/Profile/UserDetails.js`

```jsx
// "注销账号"按钮 → 二次确认弹窗 → 
// DELETE /api/users/:userId → 清除所有个人信息
```

### Phase 6 完成标准

- [ ] 发布含违禁词的商品被拦截
- [ ] `/privacy` 页面可访问，底部有链接
- [ ] `/faq` 页面可访问
- [ ] 种子数据脚本可执行
- [ ] 用户可自助注销

---

## Phase 7：冷启动执行

> ⏱ 持续进行 | 🎯 从 0 用户到 500 活跃用户

### Step 7.1 — 上线前检查清单

```
[ ] 域名能正常访问
[ ] HTTPS 已配置（Let's Encrypt 免费证书）
[ ] 注册流程走通
[ ] 发布商品流程走通（含图片上传）
[ ] 搜索/筛选可用
[ ] 购买→订单→确认→完成 全流程走通
[ ] 管理后台可登录
[ ] 隐私政策页面有链接
[ ] 数据库备份已配置
[ ] 已知至少 20 件种子商品在首页
```

### Step 7.2 — 第一周：种子用户

```
Day 1: 你自己 + 3-5 个朋友注册，每人发 2-3 件商品
       目标：首页有 20+ 件商品

Day 2: 找 5 个班长/学生会成员，让他们在班级群转发
       文案模板：
       "做了一个咱们学校的二手交易网站，
        不用加群、不用刷屏，直接搜就能找到想要的东西。
        卖东西也简单，拍个照、写个价格就行。
        链接：http://xxx.top:5000"

Day 3-5: 关注注册量。每天手动回复前 10 个新用户的反馈
         （早期用户反馈是改产品的最好依据）

Day 6-7: 根据第一周反馈快速迭代（修 bug、改 UI）
```

### Step 7.3 — 第二周：内容运营

```
- 每周从首页挑选 3 件"值得买的"置顶
- 在平台上发布 2 条"求购"（制造互动）
- 关注每个新发布的商品——如果 3 天没卖出去，
  考虑是否需要调价建议（私信卖家）
```

### Step 7.4 — 第一个月：用户习惯养成

```
关键指标：
  周新增注册：___________
  周新发布商品：___________
  周交易完成：___________
  周活跃用户（至少浏览了 5 个商品）：___________

目标（第一个月）：
  注册用户 > 200
  在售商品 > 50 件
  周交易 > 10 笔
```

### Step 7.5 — 毕业季/开学季冲刺

```
毕业季前 2 周（5月中旬）：
  - 扫楼贴海报（每栋宿舍楼一楼公告栏）
  - 找大四班长帮忙在班级群转发
  - 目标：在售商品突破 200 件

开学季前 1 周（8月底）：
  - 迎新现场设摊（和学生会合作）
  - 新生群推广（每个新生群都要覆盖）
  - 目标：注册用户突破 1000
```

---

## 附录：实施检查总表

打印出来，做完一项划一项。

```
□ Phase 0: 代码备份
  □ 0.1 创建 refactor/v3-simplify 分支
  □ 0.2 打 tag v2.4.0-baseline
  □ 0.3 导出文件清单

□ Phase 1: 后端精简
  □ 1.1 移除 AI 模块
  □ 1.2 移除 IM 私信
  □ 1.3 移除评价系统
  □ 1.4 移除申诉系统
  □ 1.5 精简通知为简单消息
  □ 1.6 简化认证（去 session）
  □ 1.7 Decimal128 → Number
  □ 1.8 简化推荐引擎

□ Phase 2: 前端清理
  □ 2.1 移除 AI UI
  □ 2.2 移除 IM 组件
  □ 2.3 移除通知组件
  □ 2.4 移除评价 UI
  □ 2.5 移除申诉 UI
  □ 2.6 更新 authContext
  □ 2.7 更新联系方式展示
  □ 2.8 npm run build 通过

□ Phase 3: 数据模型改造
  □ 3.1 User 模型最终版
  □ 3.2 Product 模型最终版
  □ 3.3 新建 Order 模型
  □ 3.4 新建 Order 路由+控制器
  □ 3.5 createProduct 补 wechat/qq

□ Phase 4: 核心功能补强
  □ 4.1 搜索切换文本索引
  □ 4.2 注册页加微信/QQ
  □ 4.3 编辑资料加微信/QQ
  □ 4.4 发布页模板化
  □ 4.5 管理后台精简
  □ 4.6 前端订单页面
  □ 4.7 手机号验证（可选）

□ Phase 5: 架构与部署
  □ 5.1 合并前后端容器
  □ 5.2 DB 连接池调优
  □ 5.3 MongoDB 缓存降低
  □ 5.4 备份脚本
  □ 5.5 全链路测试

□ Phase 6: 运营就绪
  □ 6.1 违禁词过滤
  □ 6.2 隐私政策页
  □ 6.3 FAQ 页面
  □ 6.4 种子商品数据
  □ 6.5 用户注销功能

□ Phase 7: 冷启动
  □ 7.1 上线前检查清单
  □ 7.2 第一周种子用户
  □ 7.3 第二周内容运营
  □ 7.4 第一个月数据跟踪
  □ 7.5 毕业季/开学季冲刺准备
```
