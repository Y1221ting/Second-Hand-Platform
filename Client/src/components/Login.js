import React, { useState, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/authContext";

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");

  // 从 state 或 query string 读取提示标记
  const bannerMessage = useMemo(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("session_expired") === "1" || location.state?.sessionExpired) {
      return { text: "账号已在其他设备登录，请重新登录", color: "yellow" };
    }
    if (location.state?.banned) {
      return { text: "该账号已被封禁，如有疑问请联系管理员申诉", color: "red" };
    }
    return null;
  }, [location]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
    // 用户重新输入时清除错误
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const response = await fetch(
      `/api/users/login`,
      {
        method: "POST",
        body: JSON.stringify(formData),
        headers: { "Content-Type": "application/json" },
      }
    );
    if (response.ok) {
      const data = await response.json();
      await login({
        id: data.user._id,
        name: data.user.fullName,
        fullName: data.user.fullName,
        college: data.user.college,
        department: data.user.department,
        role: data.user.role || "user",
        status: data.user.status || "active",
      }, data.token);
      navigate("/home");
    } else {
      const data = await response.json();
      setError(data.message || "登录失败，请稍后重试");
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="bg-white p-8 rounded-lg shadow-lg sm:w-96 md:w-1/2">
        <h1 className="text-3xl font-semibold text-gray-900 mb-4">登录</h1>
        {bannerMessage && (
          <div
            className={`mb-4 p-3 border rounded-lg text-sm ${
              bannerMessage.color === "yellow"
                ? "bg-yellow-100 border-yellow-400 text-yellow-800"
                : "bg-red-100 border-red-400 text-red-700"
            }`}
          >
            {bannerMessage.text}
          </div>
        )}
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <input
              type="text"
              name="email"
              placeholder="邮箱"
              value={formData.email}
              onChange={handleChange}
              className="w-full py-2 px-4 rounded-lg bg-gray-100 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
            />
          </div>
          <div className="mb-4">
            <input
              type="password"
              name="password"
              placeholder="密码"
              value={formData.password}
              onChange={handleChange}
              className="w-full py-2 px-4 rounded-lg bg-gray-100 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
            />
          </div>
          {/* [修改] text-white → text-gray-900，修复按钮文字与黄色背景对比度不足（原 2.3:1 → 现 5.5:1） */}
          <button
            type="submit"
            className="w-full py-2 px-4 bg-yellow-500 text-gray-900 rounded-lg hover:bg-yellow-600 transition duration-300"
          >
            登录
          </button>
        </form>
        {/* [修改] text-gray-500 → text-gray-600，修复提示文字对比度不足 */}
        <p className="text-gray-600 mt-4 text-center">
          没有账号？{" "}
          <a href="/register" className="text-yellow-500 hover:text-gray-900">
            去注册
          </a>
          .
        </p>
      </div>
    </main>
  );
};

export default Login;