# 压力测试执行方案

## 环境信息

- 服务器：阿里云 2 核 2G，Ubuntu 22.04
- 公网 IP：8.162.24.145
- SSH 端口：22
- 后端：Docker 容器（second-hand-backend），端口 8000
- Nginx：宿主机端口 5000
- MongoDB：Docker 容器（second-hand-mongodb）

---

## 一、前置检查（必须做，跳过会有问题）

### 1.1 关掉 AI 推荐（防烧钱）

推荐接口会调通义千问 API。1000 次测试 = 约 20-50 元费用。测试前必须加缓存或关掉 AI：

**方案 A：在容器里加临时环境变量（推荐）**

```bash
docker exec -it second-hand-backend sh
export DISABLE_AI_RECOMMEND=true
```

然后在 productController.js 或 aiService.js 里加判断：

```javascript
if (process.env.DISABLE_AI_RECOMMEND) {
  // 只走规则引擎，不走通义千问 API
}
```

**方案 B：直接在代码中给推荐结果加内存缓存（更彻底）**

在推荐函数里加一个 `Map` 做 5 分钟缓存：

```javascript
const cache = new Map();
const cacheTTL = 5 * 60 * 1000;

function getRecommendations(userId) {
  const key = `rec_${userId}`;
  const cached = cache.get(key);
  if (cached && Date.now() - cached.time < cacheTTL) {
    return cached.data;
  }
  // ...正常推荐逻辑...
  cache.set(key, { data: result, time: Date.now() });
  return result;
}
```

### 1.2 检查 MongoDB 连接池

```bash
docker exec -it second-hand-mongodb mongosh
> db.serverStatus().connections
{ current: 3, available: 97, totalCreated: 10 }
```

如果 `available` < 50，等一等再测或重启 MongoDB 容器。

### 1.3 确认接口不需要认证

商品列表和推荐接口如果要求 `Authorization` 头，ab 测试会全部返回 401。

先用 curl 确认：

```bash
# 商品列表（不需要 token）
curl -s -o /dev/null -w "%{http_code}" "http://localhost:8000/api/products/?page=1&limit=20"

# 推荐接口
curl -s -o /dev/null -w "%{http_code}" "http://localhost:8000/api/products/recommendations"

# 商品详情（换真实 ID）
curl -s -o /dev/null -w "%{http_code}" "http://localhost:8000/api/products/6a06c5ba866d7b3ae52ea3ed"
```

如果返回 401，ab 命令需要加 token 头：

```bash
ab -n 1000 -c 10 -H "Authorization: Bearer 你的token" "http://localhost:8000/api/products/..."
```

先拿一个有效 token：

```bash
curl -X POST http://localhost:8000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"你的测试账号","password":"你的密码"}' | grep token
```

### 1.4 清理 Docker 日志（防磁盘爆炸）

```bash
# 查看当前日志大小
docker inspect --format='{{.LogPath}}' second-hand-backend
ls -lh $(docker inspect --format='{{.LogPath}}' second-hand-backend)

# 清空日志（不会影响容器运行）
truncate -s 0 $(docker inspect --format='{{.LogPath}}' second-hand-backend)
```

### 1.5 记录测试前的服务器状态

```bash
# CPU 和内存
free -h && top -bn1 | head -5

# 磁盘
df -h /

# MongoDB 慢查询
docker exec -it second-hand-mongodb mongosh --eval "db.currentOp({active:true}).inprog.forEach(op => print(op.op, op.ns, op.microsecs_running))"
```

---

## 二、执行压力测试（两种模式）

### 模式 A：容器内测试（不走 Nginx，纯测 Node.js 性能）

```bash
# SSH 连上服务器
ssh root@8.162.24.145

# 进入后端容器
docker exec -it second-hand-backend sh

# 安装 ab（Alpine Linux）
apk add --no-cache apache2-utils

# === 测试1：商品列表接口 ===
ab -n 1000 -c 10 "http://localhost:8000/api/products/?page=1&limit=20"

# === 测试2：推荐接口 ===
ab -n 1000 -c 10 "http://localhost:8000/api/products/recommendations"

# === 测试3：商品详情（替换真实 ID）===
ab -n 1000 -c 10 "http://localhost:8000/api/products/6a06c5ba866d7b3ae52ea3ed"

# === 测试4：极限模式（商品列表，50并发）===
ab -n 2000 -c 50 "http://localhost:8000/api/products/?page=1&limit=20"

# === 测试5：极限模式（推荐接口，50并发）===
ab -n 2000 -c 50 "http://localhost:8000/api/products/recommendations"

# 退出容器
exit
```

### 模式 B：宿主机测试（走 Nginx 完整链路）

```bash
# 在服务器上安装 ab
apt-get update && apt-get install -y apache2-utils

# === 测试1：商品列表（完整链路）===
ab -n 1000 -c 10 "http://localhost:5000/api/products/?page=1&limit=20"

# === 测试2：首页 HTML ===
ab -n 1000 -c 10 "http://localhost:5000/"

# === 测试3：极限模式（50并发）===
ab -n 2000 -c 50 "http://localhost:5000/api/products/?page=1&limit=20"
```

---

## 三、需要记录的数据

每次测试完成后，从 ab 输出中提取以下数据：

```
Concurrency Level:      10/50          ← 并发数
Complete requests:      1000/2000      ← 总请求数
Failed requests:        0              ← 失败数（必须为 0）
Requests per second:    xxx [#/sec]   ← QPS（核心指标）
Time per request:       xx [ms]       ← 平均响应时间

Percentage of the requests served within a certain time (ms)
  50%      xx
  95%      xx                          ← P95 延迟（核心指标）
  99%      xx                          ← P99 延迟
```

填写到下表：

| 接口 | 并发 | QPS | P95 延迟 | P99 延迟 | 失败请求 |
|------|:---:|:---:|:--------:|:--------:|:--------:|
| 商品列表 (c=10) | 10 | | | | 0 |
| 商品列表 (c=50) | 50 | | | | 0 |
| 推荐接口 (c=10) | 10 | | | | 0 |
| 推荐接口 (c=50) | 50 | | | | 0 |
| 商品详情 (c=10) | 10 | | | | 0 |
| 首页 HTML (c=10) | 10 | | | | 0 |

---

## 四、测试后检查

### 4.1 检查服务器是否正常

```bash
# 如果 MongoDB 或后端容器挂了，重启
docker ps | grep second-hand

# 查看容器重启状态
docker inspect second-hand-backend --format='{{.RestartCount}}'

# 恢复环境变量（如果改了的话）
docker restart second-hand-backend
```

### 4.2 清理 ab 安装

```bash
# 容器内装的 ab，退出容器就没了，不用管
# 宿主机装的，可以留着
```

### 4.3 确认线上功能没问题

```bash
curl -s http://localhost:5000/api/products/?page=1&limit=1 | head -c 200
```

返回正常 JSON 即可。

---

## 五、注意事项（知根知底）

### 5.1 为什么不能直接跑？

| 风险 | 说明 | 规避措施 |
|------|------|---------|
| AI 推荐烧钱 | 1000次×0.02元=20元，图文模式×0.05元=50元 | 方案1.1 关AI或加缓存 |
| MongoDB 连接池打满 | 默认100连接，并发50时可能不够 | 方案1.2 先检查 |
| 接口需要token | 无token全401，全部算Fail | 方案1.3 先curl确认 |
| Docker日志撑爆磁盘 | 1000次请求日志~几百MB | 方案1.4 先清空 |
| 商品详情ID不存在或已删除 | 接口返回404导致Fail | curl确认商品ID有效 |
| 服务器OOM | 2GB内存，50并发+日志写入可能撑爆 | 先跑c=10再跑c=50 |

### 5.2 推荐参数为什么先c=10再c=50？

c=10 是**保底测试**，验证接口基本性能和稳定性。
c=50 是**极限测试**，摸清 2C2G 的真实容量上限。

两个都测了，PPT 数据更有说服力。

### 5.3 需要多长时间？

- SSH 连上服务器 + 前置检查：约 3 分钟
- 容器内 5 轮测试：约 2-3 分钟
- 宿主机 3 轮测试：约 1-2 分钟
- 记录结果：约 2 分钟

**总计：约 10 分钟**
