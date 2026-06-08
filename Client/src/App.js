// 路由级代码分割 + ErrorBoundary 兜底
import React, { lazy, Suspense, useState, useEffect } from "react";
import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import { AuthProvider } from "./context/authContext";
import { NotificationProvider } from "./context/NotificationContext";

// 高频入口页面保持同步加载
import Home from "./components/Home";
import ProductPage from "./components/ProductPage";
import LandingPage from "./components/Landing";
import Login from "./components/Login";
import Register from "./components/Register";
import ProtectedRoute from "./components/ProtectedRoute";

// 低频页面懒加载
const UserProfile = lazy(() => import("./components/UserProfile"));
const AddProduct = lazy(() => import("./components/AddProduct"));
const EditProduct = lazy(() => import("./components/EditProduct"));
const Cart = lazy(() => import("./components/Cart"));
const Warnings = lazy(() => import("./components/Warnings"));
const Privacy = lazy(() => import("./components/Privacy"));
const FAQ = lazy(() => import("./components/FAQ"));

// 管理后台
const AdminLayout = lazy(() => import("./components/Admin/AdminLayout"));
const Dashboard = lazy(() => import("./components/Admin/Dashboard"));
const AdminReports = lazy(() => import("./components/Admin/Reports"));
const AdminProducts = lazy(() => import("./components/Admin/Products"));
const AdminUsers = lazy(() => import("./components/Admin/Users"));

const PageLoading = () => (
  <div className="flex items-center justify-center min-h-screen bg-gray-900">
    <div className="animate-spin h-10 w-10 border-4 border-yellow-500 border-t-transparent rounded-full" />
  </div>
);

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
  const [online, setOnline] = useState(navigator.onLine);

  useEffect(() => {
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  return (
    <AuthProvider>
      <NotificationProvider>
        <Router>
          {!online && (
            <div className="fixed top-0 left-0 right-0 bg-red-500 text-white text-center py-2 text-sm z-[100] shadow-lg">
              当前无网络连接，部分功能不可用
            </div>
          )}
          <ErrorBoundary>
            <Suspense fallback={<PageLoading />}>
              <Routes>
                {/* 公开路由 */}
                <Route path="/register" element={<Register />} />
                <Route path="/login" element={<Login />} />
                <Route path="/" element={<LandingPage />} />
                <Route path="/home" element={<Home />} />
                <Route path="/product/:id" element={<ProductPage />} />
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/faq" element={<FAQ />} />

                {/* 需要登录的路由 */}
                <Route
                  path="/add-product"
                  element={<ProtectedRoute><AddProduct /></ProtectedRoute>}
                />
                <Route
                  path="/product/:id/edit"
                  element={<ProtectedRoute><EditProduct /></ProtectedRoute>}
                />
                <Route
                  path="/profile/:id"
                  element={<ProtectedRoute><UserProfile /></ProtectedRoute>}
                />
                <Route
                  path="/cart"
                  element={<ProtectedRoute><Cart /></ProtectedRoute>}
                />
                <Route
                  path="/warnings"
                  element={<ProtectedRoute><Warnings /></ProtectedRoute>}
                />

                {/* 管理员后台 */}
                <Route
                  path="/admin"
                  element={<ProtectedRoute requireAdmin><AdminLayout /></ProtectedRoute>}
                >
                  <Route index element={<Dashboard />} />
                  <Route path="dashboard" element={<Dashboard />} />
                  <Route path="reports" element={<AdminReports />} />
                  <Route path="products" element={<AdminProducts />} />
                  <Route path="users" element={<AdminUsers />} />
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
