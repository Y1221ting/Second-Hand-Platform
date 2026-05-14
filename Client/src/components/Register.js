import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    fullName: "",
    college: "",
    phoneNo: "",
    address: "",
  });
  const [formErrors, setFormErrors] = useState({
    email: "",
    password: "",
    fullName: "",
    college: "",
    phoneNo: "",
    address: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const errors = {};
    let isValid = true;

    for (const field in formData) {
      if (formData[field] === "") {
        errors[field] = "此项为必填";
        isValid = false;
      }
    }

    if (!isValid) {
      setFormErrors(errors);
      return;
    }

    const response = await fetch(
      `/api/users/register`,
      {
        method: "POST",
        body: JSON.stringify(formData),
        headers: { "Content-Type": "application/json" },
      }
    );

    const data = await response.json();

    if (response.ok) {
      navigate("/login");
    } else {
      // 显示后端返回的错误信息
      alert(data.message || "注册失败，请稍后重试");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="bg-white p-8 rounded-lg shadow-lg sm:w-96 md:w-2/3">
        <h1 className="text-3xl font-semibold text-gray-900 mb-4">注册</h1>
        <form onSubmit={handleSubmit}>
          <div className="flex flex-col md:flex-row">
            <div className="md:w-1/2 pr-0 md:pr-2">
              <div className="mb-4">
                <input
                  type="text"
                  name="fullName"
                  placeholder="姓名"
                  value={formData.fullName}
                  onChange={handleChange}
                  className={`w-full py-2 px-4 rounded-lg bg-gray-100 border ${
                    formErrors.fullName ? "border-red-500" : "border-gray-300"
                  } focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent`}
                />
                {formErrors.fullName && (
                  <p className="text-red-500 text-sm mt-1">
                    {formErrors.fullName}
                  </p>
                )}
              </div>
              <div className="mb-4">
                <input
                  type="text"
                  name="email"
                  placeholder="邮箱"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full py-2 px-4 rounded-lg bg-gray-100 border ${
                    formErrors.email ? "border-red-500" : "border-gray-300"
                  } focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent`}
                />
                {formErrors.email && (
                  <p className="text-red-500 text-sm mt-1">
                    {formErrors.email}
                  </p>
                )}
              </div>
              <div className="mb-4">
                <input
                  type="password"
                  name="password"
                  placeholder="密码"
                  value={formData.password}
                  onChange={handleChange}
                  className={`w-full py-2 px-4 rounded-lg bg-gray-100 border ${
                    formErrors.password ? "border-red-500" : "border-gray-300"
                  } focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent`}
                />
                {formErrors.password && (
                  <p className="text-red-500 text-sm mt-1">
                    {formErrors.password}
                  </p>
                )}
              </div>
            </div>
            <div className="md:w-1/2 pr-0 md:pr-2">
              <div className="mb-4">
                <input
                  type="text"
                  name="college"
                  placeholder="学校"
                  value={formData.college}
                  onChange={handleChange}
                  className={`w-full py-2 px-4 rounded-lg bg-gray-100 border ${
                    formErrors.college ? "border-red-500" : "border-gray-300"
                  } focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent`}
                />
                {formErrors.college && (
                  <p className="text-red-500 text-sm mt-1">
                    {formErrors.college}
                  </p>
                )}
              </div>
              <div className="mb-4">
                <input
                  type="text"
                  name="phoneNo"
                  placeholder="手机号"
                  value={formData.phoneNo}
                  onChange={handleChange}
                  className={`w-full py-2 px-4 rounded-lg bg-gray-100 border ${
                    formErrors.phoneNo ? "border-red-500" : "border-gray-300"
                  } focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent`}
                />
                {formErrors.phoneNo && (
                  <p className="text-red-500 text-sm mt-1">
                    {formErrors.phoneNo}
                  </p>
                )}
              </div>
              <div className="mb-4">
                <input
                  type="text"
                  name="address"
                  placeholder="地址"
                  value={formData.address}
                  onChange={handleChange}
                  className={`w-full py-2 px-4 rounded-lg bg-gray-100 border ${
                    formErrors.address ? "border-red-500" : "border-gray-300"
                  } focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent`}
                />
                {formErrors.address && (
                  <p className="text-red-500 text-sm mt-1">
                    {formErrors.address}
                  </p>
                )}
              </div>
            </div>
          </div>
          <div className="flex justify-center">
            <button
              type="submit"
              className="w-full py-2 px-4 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition duration-300"
            >
              注册
            </button>
          </div>
        </form>
        <p className="text-gray-500 mt-4 text-center">
          已有账号？{" "}
          <a href="/login" className="text-yellow-500 hover:text-gray-900">
            去登录
          </a>
          .
        </p>
      </div>
    </div>
  );
};

export default Register;