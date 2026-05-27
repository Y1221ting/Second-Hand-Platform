# Lighthouse 性能优化方案

> 基于 Lighthouse 13.0.2 三页面测试报告，按优先级排列，附带具体代码修改。

---

## P0 — Nginx 静态资源缓存 + Gzip（三板斧最有效的一板）

**影响**：三个页面都报"使用高效缓存可节省 439 KiB"，且是渲染阻塞请求的根因之一。改动最小，收益最大。

**现状**：`Client/nginx.conf` 没有任何缓存头。JS/CSS/图片每次都要重新下载。

**修改** `Client/nginx.conf`：

```nginx
server {
    listen 80;
    server_name localhost;

    client_max_body_size 50m;

    root /usr/share/nginx/html;
    index index.html;

    # ===== Gzip 压缩 =====
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_comp_level 5;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml text/javascript image/svg+xml;

    # ===== 静态资源强缓存（文件名带 hash，可永久缓存）=====
    location ~* \.(js|css|woff2?|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # ===== 图片缓存 =====
    location ~* \.(png|jpg|jpeg|gif|svg|ico|webp)$ {
        expires 30d;
        add_header Cache-Control "public";
    }

    # ===== 安全头 =====
    add_header X-Content-Type-Options "nosniff" always;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://second-hand-backend:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header Authorization $http_authorization;
        proxy_pass_header Authorization;
        proxy_cache_bypass $http_upgrade;
    }

    location /uploads/ {
        proxy_pass http://second-hand-backend:8000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

> **为什么不会缓存旧版本**：CRA 构建的 JS/CSS 文件名带 hash（如 `main.a3f2c1.js`），新版本部署后 `index.html` 引用的文件名变了，浏览器自然会重新下载。`index.html` 本身走 `location /`，不走正则匹配，不会被缓存。

**重新部署**：

```bash
cd Client && npm run build
git add Client/build Client/nginx.conf && git commit -m "perf: Nginx 缓存 + Gzip"
ssh root@8.162.24.145
cd /www/wwwroot/Second-Hand-main && git pull
docker compose up -d --build frontend
```

---

## P0 — 修复商品详情页 CLS 0.142（图片缺宽高 + 布局偏移）

**问题**：Lighthouse 报"图片元素没有明确的 width 和 height"，图片加载完成后浏览器才发现图片比预想的大/小，页面发生位移。

### 改 1：`ProductDetails.js` 第 135-138 行

**现状**：

```jsx
<img
  src={productDetails.images[0]}
  alt={productDetails.name}
  className="w-full md:w-1/2 h-auto rounded-lg"
/>
```

**修改为**：

```jsx
<img
  src={productDetails.images[0]}
  alt={productDetails.name}
  width={600}
  height={400}
  loading="lazy"
  className="w-full md:w-1/2 h-auto rounded-lg"
/>
```

> `width={600} height={400}` 告诉浏览器按 3:2 预估占位空间。即使实际图片比例略有偏差，偏差也很小（CLS 能降 80% 以上），且不加 `aspectRatio` CSS 不会裁切图片。

### 改 2：`ProductCard.js` 第 71-85 行，div 背景图 → `<img>` 标签

**现状**：

```jsx
<div
  ref={imageRef}
  className="w-full h-40 mb-1.5 rounded-md bg-gray-700"
  style={
    imageLoaded
      ? {
          backgroundImage: `url(${product.images[0]})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }
      : {}
  }
></div>
```

**修改为**：

```jsx
<div
  ref={imageRef}
  className="w-full h-40 mb-1.5 rounded-md bg-gray-700 overflow-hidden"
>
  {imageLoaded && product.images?.[0] && (
    <img
      src={product.images[0]}
      alt={product.name}
      width={400}
      height={160}
      loading="lazy"
      className="w-full h-full object-cover"
    />
  )}
</div>
```

> 容器 `h-40`（160px）固定了高度，图片用 `object-cover` 填充，宽高比不会变，CLS 归零。

---

## P0 — React.lazy 代码分割（减少首屏 JS 体积）

**问题**：CRA 默认把所有组件打包成一个 bundle.js，第一次访问要全下载。Lighthouse 报"减少未使用 JavaScript 可节省 139-185 KiB"。

**原则**：高频页面保持同步加载（秒切），低频页面懒加载（省带宽）。

**文件**：`Client/src/App.js`

**修改为**：

```jsx
import React, { lazy, Suspense } from "react";
import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import { AuthProvider } from "./context/authContext";
import ProtectedRoute from "./components/ProtectedRoute";

// 高频页面保持同步加载，切换不等待
import Home from "./components/Home";
import ProductPage from "./components/ProductPage";
import LandingPage from "./components/Landing";

// 低频页面懒加载
const Register = lazy(() => import("./components/Register"));
const Login = lazy(() => import("./components/Login"));
const UserProfile = lazy(() => import("./components/UserProfile"));
const AddProduct = lazy(() => import("./components/AddProduct"));
const EditProduct = lazy(() => import("./components/EditProduct"));
const Cart = lazy(() => import("./components/Cart"));

const PageLoading = () => (
  <div className="flex items-center justify-center min-h-screen bg-gray-900">
    <div className="animate-spin h-10 w-10 border-4 border-yellow-500 border-t-transparent rounded-full" />
  </div>
);

// 网络异常兜底
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
          <div className="text-center">
            <p className="text-xl mb-4">页面加载失败</p>
            <button
              className="px-6 py-2 bg-yellow-500 text-gray-900 rounded"
              onClick={() => window.location.reload()}
            >
              刷新页面
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <ErrorBoundary>
          <Suspense fallback={<PageLoading />}>
            <Routes>
              <Route path="/register" element={<Register />} />
              <Route path="/login" element={<Login />} />
              <Route path="/" element={<LandingPage />} />
              <Route path="/home" element={<Home />} />
              <Route path="/product/:id" element={<ProductPage />} />

              <Route path="/add-product" element={
                <ProtectedRoute><AddProduct /></ProtectedRoute>
              } />
              <Route path="/product/:id/edit" element={
                <ProtectedRoute><EditProduct /></ProtectedRoute>
              } />
              <Route path="/profile/:id" element={
                <ProtectedRoute><UserProfile /></ProtectedRoute>
              } />
              <Route path="/cart" element={
                <ProtectedRoute><Cart /></ProtectedRoute>
              } />
            </Routes>
          </Suspense>
        </ErrorBoundary>
      </Router>
    </AuthProvider>
  );
};

export default App;
```

---

## P1 — 后端 API Gzip 压缩

**问题**：API 返回的 JSON 数据没有压缩。

```bash
cd Server && npm install compression
```

在 `Server/server.js` 中间件区域最前面加：

```js
const compression = require("compression");
app.use(compression());
```

---

## P2 — 禁用生产环境 source map（减包体积）

在 `Client/` 下新建 `.env.production`，内容：

```
GENERATE_SOURCEMAP=false
```

重新 `npm run build` 后 JS 体积减少约 30%。代价是线上报错看不到原始代码位置，赛后如需排查去掉这行重新构建即可。

---

## P2 — 无障碍对比度修复（登录页）

Lighthouse 报登录页"前景色与背景色对比度不足"。检查 Login 组件中深色背景上使用的 `text-gray-400` 或类似弱对比度文字，替换为 `text-gray-200` 或 `text-gray-300`。不改逻辑，只改颜色值。

---

## 优先级总览

| 优先级 | 任务 | 改动文件 | 预计提升 | 耗时 |
|--------|------|---------|---------|------|
| **P0** | Nginx 缓存 + Gzip | nginx.conf | 所有页面 +8~15 分 | 5 分钟 |
| **P0** | 图片 width/height | ProductDetails.js, ProductCard.js | 详情页 CLS→0, +10~15 分 | 10 分钟 |
| **P0** | React.lazy 代码分割 | App.js | 首屏 JS 减半, +10~20 分 | 10 分钟 |
| **P1** | 后端 API Gzip | server.js | API 响应体积减 40% | 5 分钟 |
| **P2** | 禁用 source map | .env.production | 包体积减 30% | 1 分钟 |
| **P2** | 无障碍对比度 | Login.js | 无障碍 +5 分 | 5 分钟 |

## 预计效果

| 页面 | 当前分数 | 优化后目标 |
|------|---------|-----------|
| 商品详情页 | 51 | **75+** |
| 首页 | 89 | **95+** |
| 登录页 | 84 | **92+** |

---

## 风险与规避

| 方案 | 风险 | 规避方式 |
|------|------|---------|
| Nginx 强缓存 | 用户看不到新版本 | CRA 文件名带 hash，index.html 不缓存，新部署自动生效 |
| 图片 width/height | 实际图片比例不匹配 | 用 3:2 近似值，去掉 `aspectRatio`，CSS `h-auto` 自适应 |
| React.lazy | 切页面时短暂转圈 | 高频页面（Home/ProductPage）保持同步加载，只懒加载低频页面 |
| React.lazy | 网络异常 chunk 加载失败 | Error Boundary 兜底，显示"刷新页面"按钮 |
| 禁用 source map | 线上报错难调试 | 赛后如需排查，删掉 `.env.production` 重新构建即可 |
