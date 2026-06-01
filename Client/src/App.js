// [修改] 引入 lazy, Suspense 实现路由级代码分割
// [新增] ErrorBoundary 组件兜底 chunk 加载失败
import React, { lazy, Suspense } from "react";
import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import { AuthProvider } from "./context/authContext";
import { NotificationProvider } from "./context/NotificationContext";
import NotificationModal from "./components/NotificationModal";

// 高频 + 入口页面保持同步加载，避免直接访问时出现瀑布加载
import Home from "./components/Home";
import ProductPage from "./components/ProductPage";
import LandingPage from "./components/Landing";
import Login from "./components/Login";        // [修正] 改回同步：直接访问 /login 是高频入口
import Register from "./components/Register";  // [修正] 改回同步：直接访问 /register 是高频入口
import ProtectedRoute from "./components/ProtectedRoute";

// 低频页面懒加载，减少首屏 JS 体积
const UserProfile = lazy(() => import("./components/UserProfile"));
const AddProduct = lazy(() => import("./components/AddProduct"));
const EditProduct = lazy(() => import("./components/EditProduct"));
const Cart = lazy(() => import("./components/Cart"));
const Warnings = lazy(() => import("./components/Warnings"));
const ConversationList = lazy(() => import("./components/ConversationList"));
const ChatWindow = lazy(() => import("./components/ChatWindow"));

// 管理后台懒加载
const AdminLayout = lazy(() => import("./components/Admin/AdminLayout"));
const Dashboard = lazy(() => import("./components/Admin/Dashboard"));
const AdminReports = lazy(() => import("./components/Admin/Reports"));
const AdminProducts = lazy(() => import("./components/Admin/Products"));
const AdminUsers = lazy(() => import("./components/Admin/Users"));
const AdminAppeals = lazy(() => import("./components/Admin/Appeals"));
const AdminWarnings = lazy(() => import("./components/Admin/Warnings"));

// [新增] 懒加载时显示的 loading 状态
const PageLoading = () => (
  <div className="flex items-center justify-center min-h-screen bg-gray-900">
    <div className="animate-spin h-10 w-10 border-4 border-yellow-500 border-t-transparent rounded-full" />
  </div>
);

// [新增] chunk 加载失败兜底，避免网络异常时白屏
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
      <NotificationProvider>
        <Router>
          <ErrorBoundary>
            <Suspense fallback={<PageLoading />}>
              <NotificationModal />
              <Routes>
              {/* 公开路由 */}
              <Route path="/register" element={<Register />} />
              <Route path="/login" element={<Login />} />
              <Route path="/" element={<LandingPage />} />
              <Route path="/home" element={<Home />} />
              <Route path="/product/:id" element={<ProductPage />} />

              {/* 需要登录的路由 */}
              <Route
                path="/add-product"
                element={
                  <ProtectedRoute>
                    <AddProduct />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/product/:id/edit"
                element={
                  <ProtectedRoute>
                    <EditProduct />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile/:id"
                element={
                  <ProtectedRoute>
                    <UserProfile />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/cart"
                element={
                  <ProtectedRoute>
                    <Cart />
                  </ProtectedRoute>
                }
              />

              {/* 用户警告页 */}
              <Route
                path="/warnings"
                element={
                  <ProtectedRoute>
                    <Warnings />
                  </ProtectedRoute>
                }
              />

              {/* 站内私信 */}
              <Route
                path="/messages"
                element={
                  <ProtectedRoute>
                    <ConversationList />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/messages/:conversationId"
                element={
                  <ProtectedRoute>
                    <ChatWindow />
                  </ProtectedRoute>
                }
              />

              {/* 管理员后台 */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute requireAdmin>
                    <AdminLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Dashboard />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="reports" element={<AdminReports />} />
                <Route path="products" element={<AdminProducts />} />
                <Route path="users" element={<AdminUsers />} />
                <Route path="appeals" element={<AdminAppeals />} />
                <Route path="warnings" element={<AdminWarnings />} />
              </Route>
            </Routes>
          </Suspense>
        </ErrorBoundary>
      </Router>
    </NotificationProvider>
  </AuthProvider>
  );
};

export default App;
