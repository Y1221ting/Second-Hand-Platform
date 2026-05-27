import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/authContext";

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");

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
      localStorage.setItem("token", data.token);
      login({
        id: data.user._id,
        name: data.user.fullName,
        college: data.user.college,
      });
      navigate("/home");
    } else {
      const data = await response.json();
      setError(data.message || "登录失败，请稍后重试");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="bg-white p-8 rounded-lg shadow-lg sm:w-96 md:w-1/2">
        <h1 className="text-3xl font-semibold text-gray-900 mb-4">登录</h1>
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
    </div>
  );
};

export default Login;