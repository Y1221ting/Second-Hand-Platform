# 南昌师范学院校园二手平台 — 开发者手册

> 最后更新：2026-06-02 | 当前版本：Phase 6

---

## 目录

1. [环境要求](#1-环境要求)
2. [项目架构](#2-项目架构)
3. [Docker 部署规范](#3-docker-部署规范)
4. [MongoDB 配置约束](#4-mongodb-配置约束)
5. [代码安全准则](#5-代码安全准则)
6. [性能优化要点](#6-性能优化要点)
7. [API 速查](#7-api-速查)
8. [上线与运维](#8-上线与运维)
9. [常见问题规避](#9-常见问题规避)
10. [附录：应急操作](#10-附录应急操作)

---

## 1. 环境要求

### 服务器最低配置

| 资源 | 要求 | 实际分配 |
|------|------|---------|
| CPU | 2 核 | 容器总计 ≤ 1.5 核 |
| 内存 | 2 GB | 容器总计 ≤ 704 MB |
| 磁盘 | 40 GB | 系统 + Docker + MongoDB + 图片 |
| 带宽 | 校园网 1-5 Mbps | 日均 10-50 笔交易够用 |

### 容器资源分配

| 容器 | CPU 硬限 | 内存硬限 | 说明 |
|------|---------|---------|------|
| MongoDB | 1.0 核 | 384 MB | Cache 仅 150MB |
| Backend | 1.0 核 | 256 MB | Node heap 200MB |
| Frontend | 0.5 核 | 64 MB | Nginx 1 worker |
| **合计** | **2.5 核** | **704 MB** | 预留 ~1.3GB 给系统 |

### 软件依赖

```
Docker Engine 20.10+
Docker Compose v3.8+
Node.js 18 (本地开发)
MongoDB 7.0 (Docker 内)
```

---

## 2. 项目架构

### 目录结构

```
Second-Hand-main/
├── Server/                  # Express 后端 (端口 8000)
│   ├── config/
│   │   ├── auth.js          # JWT 签发/验证，密码哈希
│   │   ├── db.js            # MongoDB 连接池配置
│   │   ├── bannedKeywords.js # 50+ 违禁词列表
│   │   └── majorMap.js      # 学院-专业映射
│   ├── controllers/
│   │   ├── userController.js
│   │   ├── productController.js
│   │   ├── cartController.js
│   │   ├── orderController.js
│   │   └── uploadController.js
│   ├── middleware/
│   │   └── authMiddleware.js # JWT + tokenVersion 校验
│   ├── models/
│   │   ├── User.js           # 用户 (含 loginAttempts, lockUntil)
│   │   ├── Product.js        # 商品 (6个复合索引)
│   │   ├── Order.js          # 订单 (状态机)
│   │   ├── Wanted.js         # 求购
│   │   ├── Report.js         # 举报
│   │   └── Message.js        # 系统通知
│   ├── routes/               # 9 个路由模块
│   ├── scripts/
│   │   └── seed.js           # 24 条种子商品
│   ├── uploads/              # 商品图片
│   ├── Dockerfile
│   ├── .dockerignore
│   └── server.js             # 入口文件
├── Client/                   # React 18 前端
│   ├── src/components/
│   ├── Dockerfile            # Nginx serve React build
│   └── nginx.conf            # 静态缓存 + API 代理
├── docker-compose.yml        # 3 容器编排
├── .env                      # 密钥配置（不要提交 git）
└── backup.sh                 # MongoDB 备份脚本
```

### 中间件栈（按加载顺序）

```
1. trust proxy         → 正确获取客户端 IP
2. compression()       → gzip 响应压缩
3. helmet()            → 安全响应头
4. bodyParser (10MB)   → JSON + URL 编码
5. CORS (白名单)       → 函数校验 origin
6. rate-limit (全局)   → 100 次/分钟 /api
7. 路由模块 × 9        → 业务逻辑
8. 静态文件 (uploads)  → 7 天缓存
9. Express error handler
10. unhandledRejection / uncaughtException
```

### 数据模型关系

```
User ──1:N──→ Product (上传)
User ──1:N──→ Order (买/卖)
User ──1:N──→ Wanted (求购)
User ──1:N──→ Report (举报)
User ──1:N──→ Message (通知)
Product ──1:1──→ Order (每个订单关联一个商品)
```

---

## 3. Docker 部署规范

### 首次部署

```bash
# 1. 确认 .env 存在且配置正确
cat .env
# 必须字段：MONGO_INITDB_ROOT_PASSWORD, JWT_SECRET, MONGODB_URI_FULL

# 2. 构建并启动
docker compose up -d --build

# 3. 等待健康检查通过
docker compose ps
# 三个容器状态均为 healthy

# 4. 初始化种子数据（首页不空）
docker exec second-hand-backend node scripts/seed.js

# 5. 验证
curl http://localhost:8000/api/health
curl http://localhost:5000/
```

### 日常运维命令

```bash
# 查看容器状态
docker compose ps

# 查看后端日志（最近 50 行）
docker compose logs --tail 50 backend

# 查看 MongoDB 日志
docker compose logs --tail 50 mongodb

# 重启单个服务
docker compose restart backend

# 全部重启
docker compose down && docker compose up -d

# 进入 MongoDB shell
docker exec -it second-hand-mongodb mongosh \
  -u admin -p "${MONGO_INITDB_ROOT_PASSWORD}" \
  --authenticationDatabase admin second-hand

# 重新构建（代码更新后）
docker compose up -d --build backend
```

### 日志管理

日志驱动为 `json-file`，自动轮转：
- 单文件最大 10 MB
- 最多保留 3 个文件
- 总日志占用 ≤ 90 MB（3容器 × 30MB）

```bash
# 查看日志占用
docker compose logs --tail 1 2>&1 | head -1
du -sh /var/lib/docker/containers/*/
```

### .dockerignore 规则

`Server/.dockerignore` 排除以下内容不进入 build context：
```
node_modules
.env
.env.*
uploads
*.log
.git
```

---

## 4. MongoDB 配置约束

### 连接参数

```javascript
// Server/config/db.js
mongoose.connect(uri, {
  maxPoolSize: 10,              // 最大 10 连接
  minPoolSize: 2,               // 最小保持 2
  serverSelectionTimeoutMS: 5000,
});
```

### 容器约束（不可突破）

```yaml
# docker-compose.yml mongodb 段
command: >
  --wiredTigerCacheSizeGB 0.15  # 缓存仅 150MB
  --wiredTigerConcurrentReadTransactions 32
  --wiredTigerConcurrentWriteTransactions 8
  --slowms 200                   # 慢查询阈值 200ms

ports:
  - "127.0.0.1:27017:27017"     # 仅本机回环，拒绝公网
```

### 索引清单

**Product 模型（6 个索引）**

| 索引 | 覆盖场景 |
|------|---------|
| `{ name: "text", description: "text" }` | 全文搜索 |
| `{ createdAt: -1 }` | 最新商品列表 |
| `{ status: 1, category: 1, createdAt: -1 }` | 分类筛选+最新 |
| `{ status: 1, "uploadedBy.department": 1, createdAt: -1 }` | 学院推荐 |
| `{ "uploadedBy.id": 1, status: 1 }` | 用户商品列表 |
| `{ "purchasedBy.id": 1 }` | 已购商品 |

**User 模型（3 个索引）**

| 索引 | 类型 | 覆盖场景 |
|------|------|---------|
| `{ email: 1 }` | unique | 登录查找 |
| `{ status: 1 }` | 普通 | 管理员筛选 |
| `{ role: 1 }` | 普通 | 管理员筛选 |

**Order 模型（3 个索引）**

| 索引 | 覆盖场景 |
|------|---------|
| `{ buyer: 1, createdAt: -1 }` | 我买的 |
| `{ seller: 1, createdAt: -1 }` | 我卖的 |
| `{ product: 1 }` | 某商品的订单 |

### 查询准则

1. **永远用 `.select()` 限制字段**：商品列表不需要返回 `specifications`、`description` 全文
2. **`$text` 搜索优于 `$regex`**：利用文本索引而非全表扫描
3. **分页参数**：`limit` 上限 100，`skip` = `(page - 1) * limit`
4. **避免 in-memory sort**：所有 sort 字段必须有对应索引
5. **查询条件顺序**：相等条件 → 范围条件 → 排序字段（匹配索引字段顺序）

---

## 5. 代码安全准则

### 认证体系

```
注册 → bcrypt 12轮哈希 → 存入 DB
登录 → 校验密码 → 签发 JWT (含 userId + tv(tokenVersion))
每次请求 → authMiddleware → jwt.verify → 查 DB 验证 tokenVersion
敏感操作 → 修改密码/封禁 → tokenVersion + 1 → 旧 token 全部失效
```

### 账户保护

| 机制 | 参数 | 说明 |
|------|------|------|
| 密码强度 | 8位以上 + 字母 + 数字 | Mongoose validator |
| 登录锁定 | 5次失败 → 锁15分钟 | loginAttempts + lockUntil |
| 模糊错误 | 统一 "邮箱或密码错误" | 防用户枚举 |
| token 吊销 | tokenVersion 自增 | 改密码/封禁立即生效 |

### API 安全规则

1. **`/api/users`** — 注册限流 5次/小时，登录限流 20次/15分钟
2. **`/api`（全局）** — 100次/分钟轻度限流
3. **CORS** — 函数白名单校验 origin，拒绝非白名单域名
4. **body-parser** — JSON/URL 编码上限 10MB
5. **密码绝不回传**：所有 API 返回前 `delete userData.password`
6. **防越权**：updateUser/deleteUser 校验 `req.user._id === targetUserId`

### 违禁词过滤

50+ 违禁关键词在 `createProduct` 和 `updateProductById` 时检查商品 `name + description`，分类包括：

- 违禁品（香烟、酒类、药品、管制刀具）
- 翻墙/VPN 工具
- 学术造假（代考、代写、代课）
- 仿冒品（高仿、A货、原单）
- 金融风险（比特币、校园贷、传销）

命中任何关键词 → 返回 400 + 指出违规词。

### 敏感信息保护

```
✅ 已做：
- JWT_SECRET 64字节随机 hex
- .env 已在 .gitignore
- MongoDB 仅监听 127.0.0.1
- 生产环境错误不泄漏堆栈
- helmet 安全头（X-Content-Type-Options, X-Frame-Options 等）

❌ 需要警惕：
- 不要在任何地方 log JWT_SECRET 或密码
- .env 文件不要通过任何方式分享
- 修改 .env 后执行 docker compose down && up -d
```

---

## 6. 性能优化要点

### 后端优化（已完成）

```
✅ compression() gzip 压缩
✅ MongoDB 连接池 max 10
✅ 响应数据 .select() 字段限制
✅ 推荐引擎两层（同学院 + 最新）
✅ uploads 静态文件 7 天缓存
✅ 日志轮转 10MB × 3
✅ 慢查询日志 > 200ms
```

### 前端优化（已完成）

```
✅ React.lazy + Suspense 代码分割
✅ Nginx gzip 压缩（level 5）
✅ JS/CSS 强缓存 1 年（文件名带 hash）
✅ 图片缓存 30 天
✅ Nginx 1 worker（匹配单核）
```

### 需要关注的性能指标

```
响应时间：API < 200ms，首页 < 2s
数据库连接数：当前使用 / maxPoolSize(10)
慢查询：检查 docker compose logs mongodb | grep "slow query"
MongoDB 缓存命中：wiredTiger cache usage
Node 堆使用：docker stats second-hand-backend
```

### 性能调优禁区

- **不要新增 MongoDB 聚合管道**（$lookup / $unwind → 太重）
- **不要引入 Redis**（多一个容器多 50MB 开销）
- **不要做 JOIN**（MongoDB embedded document 已够用）
- **不要用 WebSocket**（轮询对校园场景够用，5秒间隔不影响 2核）

---

## 7. API 速查

### 9 个路由模块，~30 个端点

| 路由前缀 | 文件 | 主要端点 |
|---------|------|---------|
| `/api/users` | userRoutes | register, login, profile, update, delete |
| `/api/products` | productRoutes | CRUD, search, recommendations, purchase |
| `/api/cart` | cartRoutes | get, add, updateQty, remove, clear, checkout |
| `/api/orders` | orderRoutes | buyOrders, sellOrders, updateStatus |
| `/api/wanted` | wantedRoutes | CRUD 求购 |
| `/api/reports` | reportRoutes | create, list (admin) |
| `/api/admin` | adminRoutes | stats, manage products/users/reports |
| `/api/upload` | uploadRoutes | 多图上传 (multer) |
| `/api/messages` | messageRoutes | 通知列表, 标记已读 |
| `/api/health` | server.js | 健康检查 |
| `/api/stats` | server.js | 首页统计 (userCount + productCount) |
| `/api/majorMap` | server.js | 学院-专业映射 |

### Order 状态机

```
pending ──→ confirmed ──→ completed
  │            │
  └── cancelled ←────────┘
```

状态转换规则：
- `pending` → `confirmed`：卖家操作
- `pending` → `cancelled`：买家或卖家操作
- `confirmed` → `completed`：买/卖家操作
- `confirmed` → `cancelled`：买/卖家操作（恢复库存）
- `completed` / `cancelled` → 终态，不可再变

---

## 8. 上线与运维

### 上线前检查清单

```
[ ] .env 所有密钥已配置（JWT_SECRET ≠ 默认值）
[ ] docker compose up -d --build 无报错
[ ] docker compose ps 全部 healthy
[ ] curl /api/health 返回 200
[ ] 前端页面可访问 (http://IP:5000)
[ ] 注册/登录/发布/购买/订单 全链路走通
[ ] 种子数据已初始化（24条商品）
[ ] 隐私政策页可访问 (/privacy)
[ ] FAQ 页可访问 (/faq)
[ ] 违禁词过滤生效（发布测试）
[ ] 管理员后台可用
```

### 数据备份

```bash
# backup.sh — crontab 每天凌晨 3 点
0 3 * * * /path/to/backup.sh >> /var/log/backup.log 2>&1

# backup.sh 内容
docker exec second-hand-mongodb mongodump \
  --username admin --password "${PWD}" \
  --authenticationDatabase admin \
  --archive=/tmp/backup.archive
docker cp second-hand-mongodb:/tmp/backup.archive ./backup_$(date +%Y%m%d).archive
# 保留最近 7 天
find ./ -name "backup_*.archive" -mtime +7 -delete
```

### 恢复备份

```bash
docker cp backup_20260601.archive second-hand-mongodb:/tmp/
docker exec second-hand-mongodb mongorestore \
  --username admin --password "${PWD}" \
  --authenticationDatabase admin \
  --archive=/tmp/backup_20260601.archive --drop
```

### 监控（轻量方案）

```bash
# 每 5 分钟检查一次容器存活
*/5 * * * * docker compose ps | grep -q "unhealthy" && docker compose restart

# 检查磁盘
df -h / | awk 'NR==2 {print $5}'  # 使用率超过 80% 需清理

# 检查内存（容器视角）
docker stats --no-stream --format "table {{.Name}}\t{{.MemUsage}}"
```

### 升级部署流程

```bash
# 1. 拉代码
git pull origin main

# 2. 构建新镜像
docker compose build backend frontend

# 3. 滚动更新（零停机）
docker compose up -d --no-deps backend frontend

# 4. 验证
docker compose ps
curl http://localhost:8000/api/health

# 5. 如果出问题，回滚
git checkout <previous-commit>
docker compose up -d --build
```

---

## 9. 常见问题规避

### 部署问题

**Q: 容器启动后 MongoDB 连接不上？**
```
症状：backend 日志显示 "MongoDB connection error"
原因：MongoDB 还没完成初始化
解决：backend 已配 depends_on + condition: service_healthy，
      等待 15 秒 start_period 即可。如果持续失败，
      检查 .env 中 MONGODB_URI_FULL 的密码是否与 MONGO_INITDB_ROOT_PASSWORD 一致。
```

**Q: 端口 8000 或 27017 被占用？**
```bash
# 查占用进程
lsof -i :8000
# 或被旧容器占用
docker ps -a | grep second-hand
docker rm -f second-hand-backend
```

**Q: 构建前端时内存不足？**
```
症状：react-scripts build OOM killed
原因：2GB 机器上跑 build 时内存不够
解决：
1. 在本地开发机器上 build，只把 build/ 目录上传到服务器
2. 或在服务器上临时加 swap：fallocate -l 2G /swapfile && mkswap /swapfile && swapon /swapfile
```

### 安全问题

**Q: JWT_SECRET 用了默认值？**
```
auth.js 启动时检测：如果 JWT_SECRET === "change-me-in-production"，进程拒绝启动。
生成新密钥：node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
将输出写入 .env 的 JWT_SECRET。
```

**Q: 用户被锁定了怎么解锁？**
```bash
docker exec -it second-hand-mongodb mongosh -u admin -p password \
  --authenticationDatabase admin second-hand \
  --eval 'db.users.updateOne({email:"xxx@xxx.com"},{$set:{loginAttempts:0,lockUntil:null}})'
```

**Q: 有人发布了违禁品怎么办？**
```
- 管理员后台 → 商品管理 → 下架（status → sold_out）
- 或直接 MongoDB：db.products.updateOne({_id:ObjectId("...")},{$set:{status:"sold_out"}})
- 违禁词列表追加新词：Server/config/bannedKeywords.js
```

### 性能问题

**Q: 首页加载慢（> 2 秒）？**
```
排查顺序：
1. MongoDB 慢查询日志：docker compose logs mongodb | grep slow
2. 检查是否缺索引：db.products.getIndexes()
3. 检查 Node 堆是否接近 200MB 上限
4. 检查图片是否过大（> 1MB 单张）
```

**Q: MongoDB 内存超过 384MB 硬限？**
```
后果：OOM Killer 杀掉 mongod 进程
原因：wiredTiger cache 150MB + 连接开销 + 索引 > 384MB
检测：docker stats second-hand-mongodb
解决：减少 cacheSizeGB（当前 0.15 = ~150MB）
```

**Q: Docker 日志占满磁盘？**
```bash
# 查看日志大小
du -sh /var/lib/docker/containers/*/
# 强制清理旧日志
docker compose down
truncate -s 0 /var/lib/docker/containers/*/*-json.log
docker compose up -d
```

### 数据问题

**Q: 购物车结算时部分商品失败？**
```
checkoutCart 逐项处理：成功的结算出库，失败的保留在购物车。
返回值包含 success[] 和 failed[] 列表，前端应展示失败原因。
常见失败原因：库存不足、商品已下架、购买自己的商品。
```

**Q: 图片上传了但显示不出来？**
```
1. 确认 uploads/ 目录权限可读写
2. 确认 docker-compose.yml 中 volumes 挂载：./Server/uploads:/app/uploads
3. 确认图片 URL 路径：/uploads/filename.ext
4. 确认 nginx.conf 中 /uploads/ 代理到 backend:8000
```

**Q: 用户注销后数据还在？**
```
注销逻辑：删除 User 文档。商品、订单等关联数据保留但 uploadedBy 信息会失去关联。
订单的 buyerInfo/sellerInfo 在创建时已快照（冗余存储），即使原用户删除也不影响订单记录。
```

### 冷启动问题

**Q: 首页空荡荡没商品？**
```bash
# 重新执行种子数据
docker exec second-hand-backend node scripts/seed.js
# 种子数据 24 条，images 为空数组（需准备占位图或真实照片）
```

**Q: 种子数据怎么配图？**
```
1. 准备 24 张占位图放入 Server/uploads/seed/
2. 修改 seed.js 中 images: ["/uploads/seed/xxx.jpg"]
3. 每张图建议 < 200KB（前端未做压缩）
```

---

## 10. 附录：应急操作

### 容器崩溃自动恢复

```yaml
# docker-compose.yml 已配置
restart: always  # 崩溃自动重启
```

### 手动恢复流程

```bash
# 1. 检查状态
docker compose ps -a

# 2. 如果某个容器反复重启（restart loop）
docker compose logs --tail 100 <service>

# 3. 停掉全部重建
docker compose down
docker compose up -d --build

# 4. 如果还不行，清理 Docker 缓存
docker system prune -af
docker compose up -d --build
```

### 紧急封禁某用户

```bash
docker exec -it second-hand-mongodb mongosh -u admin -p password \
  --authenticationDatabase admin second-hand \
  --eval '
    db.users.updateOne(
      {email:"xxx@xxx.com"},
      {$set:{status:"banned"}, $inc:{tokenVersion:1}}
    )
  '
# status "banned" → 下次请求 authMiddleware 返回 403
# tokenVersion +1 → 所有现存 JWT 立即失效
```

### 紧急下架某商品

```bash
docker exec -it second-hand-mongodb mongosh -u admin -p password \
  --authenticationDatabase admin second-hand \
  --eval 'db.products.updateOne({_id:ObjectId("...")},{$set:{status:"sold_out",delistReason:"管理员紧急下架"}})'
```

### 数据库紧急修复

```bash
# 检查并修复
docker exec -it second-hand-mongodb mongosh -u admin -p password \
  --authenticationDatabase admin second-hand \
  --eval 'db.repairDatabase()'
# 警告：repairDatabase 需要可用磁盘空间 ≥ 当前数据大小
```

### 全量备份 + 迁移到新服务器

```bash
# 旧服务器
docker exec second-hand-mongodb mongodump --username admin --password pwd \
  --authenticationDatabase admin --archive=/tmp/full.archive
docker cp second-hand-mongodb:/tmp/full.archive ./
scp full.archive user@new-server:/path/

# 新服务器
docker cp /path/full.archive second-hand-mongodb:/tmp/
docker exec second-hand-mongodb mongorestore --username admin --password pwd \
  --authenticationDatabase admin --archive=/tmp/full.archive
```

---

## 设计铁律（开发时牢记）

1. **适配 2核2G**：任何方案必须在此约束下运行，加功能前确认资源增量
2. **不做大厂功能拷贝**：校园场景优先微信/QQ 沟通、当面交易
3. **优先做减法**：砍功能比加功能更有价值
4. **无外部依赖**：不引入第三方 API、不新增 npm 包（除非必要）、不新增 Docker 容器
5. **可落地可复制**：每个改动必须是具体代码/命令，不写伪代码
6. **构建验证必备**：`node --check server.js` + `react-scripts build` 必须通过

---

## 快速链接

- 技能文件：`.claude/skills/项目长期优化助手.md`
- 发展方向：`development.md`
- 架构 Plan：`.claude/plans/`
- 记忆目录：`C:\Users\杨婷\.claude\projects\D--Second-Hand-main\memory\`
