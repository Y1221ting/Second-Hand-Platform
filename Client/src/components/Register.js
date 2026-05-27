import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import JIANGXI_COLLEGES from "../constants/colleges";

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
  const [showCollegeDropdown, setShowCollegeDropdown] = useState(false);
  const collegeDropdownRef = useRef(null);

  // 点击下拉外面时关闭
  useEffect(() => {
    const handleClick = (e) => {
      if (collegeDropdownRef.current && !collegeDropdownRef.current.contains(e.target)) {
        setShowCollegeDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // 过滤匹配的学校列表（最多8条）
  const filteredColleges = JIANGXI_COLLEGES.filter((c) =>
    c.includes(formData.college)
  ).slice(0, 8);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  // 学校字段输入：匹配列表则弹出下拉，匹配不到则是自定义输入
  const handleCollegeChange = (e) => {
    const value = e.target.value;
    setFormData((prev) => ({ ...prev, college: value }));
    setShowCollegeDropdown(value.trim() !== "");
    // 清除错误
    if (formErrors.college) setFormErrors((prev) => ({ ...prev, college: "" }));
  };

  // 从下拉列表选中学校
  const handleCollegeSelect = (name) => {
    setFormData((prev) => ({ ...prev, college: name }));
    setShowCollegeDropdown(false);
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

    // 手机号格式校验
    const phoneRegex = /^1[3-9]\d{9}$/;
    if (!phoneRegex.test(formData.phoneNo)) {
      setFormErrors((prev) => ({ ...prev, phoneNo: "手机号格式不正确（11位，1开头）" }));
      return;
    }

    // 地址长度校验
    if (formData.address.trim().length < 5) {
      setFormErrors((prev) => ({ ...prev, address: "地址至少需要5个字符" }));
      return;
    }

    // 学校后缀校验：手动输入的必须以"大学"或"学院"结尾
    const collegeVal = formData.college || "";
    if (!JIANGXI_COLLEGES.includes(collegeVal) && !/(大学|学院)$/.test(collegeVal)) {
      setFormErrors((prev) => ({ ...prev, college: '学校名称必须以"大学"或"学院"结尾' }));
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
      alert("注册成功！请登录");
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
              <div className="mb-4 relative" ref={collegeDropdownRef}>
                <input
                  type="text"
                  name="college"
                  placeholder="学校"
                  value={formData.college}
                  onChange={handleCollegeChange}
                  onFocus={() => formData.college && setShowCollegeDropdown(true)}
                  className={`w-full py-2 px-4 rounded-lg bg-gray-100 border ${
                    formErrors.college ? "border-red-500" : "border-gray-300"
                  } focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent`}
                />
                {formErrors.college && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.college}</p>
                )}
                {/* 模糊搜索下拉 */}
                {showCollegeDropdown && filteredColleges.length > 0 && (
                  <div className="absolute z-50 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {filteredColleges.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => handleCollegeSelect(c)}
                        className="w-full text-left px-4 py-2 text-sm hover:bg-yellow-100 focus:bg-yellow-100 transition-colors"
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="mb-4">
                <input
                  type="tel"
                  name="phoneNo"
                  placeholder="手机号（11位）"
                  value={formData.phoneNo}
                  onChange={handleChange}
                  maxLength="11"
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
                  placeholder="地址（宿舍楼/门牌号等，至少5个字符）"
                  value={formData.address}
                  onChange={handleChange}
                  minLength={5}
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
              className="w-full py-2 px-4 bg-yellow-500 text-gray-900 rounded-lg hover:bg-yellow-600 transition duration-300"
            >
              注册
            </button>
          </div>
        </form>
        <p className="text-gray-600 mt-4 text-center">
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