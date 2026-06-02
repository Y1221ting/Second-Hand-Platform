import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    fullName: "",
    department: "",
    major: "",
    phoneNo: "",
    dormitory: "",
  });
  const [formErrors, setFormErrors] = useState({});

  const [majorMap, setMajorMap] = useState({});
  const [departments, setDepartments] = useState([]);
  const [majors, setMajors] = useState([]);
  const [majorDisabled, setMajorDisabled] = useState(true);

  useEffect(() => {
    fetch("/api/majorMap")
      .then((res) => res.json())
      .then((data) => {
        setMajorMap(data);
        setDepartments(Object.keys(data));
      })
      .catch(() => console.error("获取学院列表失败"));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleDepartmentChange = (e) => {
    const dept = e.target.value;
    setFormData((prev) => ({ ...prev, department: dept, major: "" }));
    if (formErrors.department) setFormErrors((prev) => ({ ...prev, department: "" }));
    if (dept && majorMap[dept]) {
      setMajors(majorMap[dept]);
      setMajorDisabled(false);
    } else {
      setMajors([]);
      setMajorDisabled(true);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const errors = {};
    const requiredFields = ["email", "password", "fullName", "department", "major", "phoneNo"];
    const labels = {
      email: "邮箱",
      password: "密码",
      fullName: "姓名",
      department: "学院",
      major: "专业",
      phoneNo: "手机号",
    };
    requiredFields.forEach((field) => {
      if (!formData[field] || !formData[field].trim()) {
        errors[field] = `请输入${labels[field]}`;
      }
    });

    // 邮箱格式
    if (!errors.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = "邮箱格式不正确";
    }

    // 密码强度
    if (!errors.password) {
      if (formData.password.length < 8) {
        errors.password = "密码至少8位";
      } else if (!/[a-zA-Z]/.test(formData.password) || !/\d/.test(formData.password)) {
        errors.password = "需包含字母和数字";
      }
    }

    // 手机号
    if (!errors.phoneNo && !/^1[3-9]\d{9}$/.test(formData.phoneNo)) {
      errors.phoneNo = "请输入11位手机号";
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    const response = await fetch("/api/users/register", {
      method: "POST",
      body: JSON.stringify(formData),
      headers: { "Content-Type": "application/json" },
    });

    const data = await response.json();

    if (response.ok) {
      alert("注册成功！您的账号正在等待管理员审核，审核通过后即可发布商品。\n\n您现在可以先登录浏览商品。");
      navigate("/login");
    } else {
      alert(data.message || "注册失败，请稍后重试");
    }
  };

  const inputClass = (name) =>
    `w-full py-2.5 px-4 rounded-lg bg-gray-50 border ${
      formErrors[name] ? "border-red-400 bg-red-50" : "border-gray-200"
    } focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent text-sm transition-colors`;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 px-4 py-8">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-8">
        {/* 标题 */}
        <div className="text-center mb-7">
          <h1 className="text-2xl font-bold text-gray-900">注册</h1>
          <p className="text-gray-400 text-sm mt-1">校园二手交易平台</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* ===== 账号信息 ===== */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              账号信息
            </p>
            <div className="space-y-3">
              <div>
                <input
                  type="text"
                  name="email"
                  placeholder="邮箱"
                  value={formData.email}
                  onChange={handleChange}
                  className={inputClass("email")}
                />
                {formErrors.email && (
                  <p className="text-red-500 text-xs mt-1 ml-1">{formErrors.email}</p>
                )}
              </div>
              <div>
                <input
                  type="password"
                  name="password"
                  placeholder="密码（至少8位，需含字母和数字）"
                  value={formData.password}
                  onChange={handleChange}
                  className={inputClass("password")}
                />
                {formErrors.password && (
                  <p className="text-red-500 text-xs mt-1 ml-1">{formErrors.password}</p>
                )}
              </div>
            </div>
          </div>

          {/* ===== 个人资料 ===== */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              个人资料
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <input
                  type="text"
                  name="fullName"
                  placeholder="姓名"
                  value={formData.fullName}
                  onChange={handleChange}
                  className={inputClass("fullName")}
                />
                {formErrors.fullName && (
                  <p className="text-red-500 text-xs mt-1 ml-1">{formErrors.fullName}</p>
                )}
              </div>
              <div>
                <input
                  type="tel"
                  name="phoneNo"
                  placeholder="手机号"
                  value={formData.phoneNo}
                  onChange={handleChange}
                  maxLength="11"
                  className={inputClass("phoneNo")}
                />
                {formErrors.phoneNo && (
                  <p className="text-red-500 text-xs mt-1 ml-1">{formErrors.phoneNo}</p>
                )}
              </div>
              <div>
                <select
                  name="department"
                  value={formData.department}
                  onChange={handleDepartmentChange}
                  className={inputClass("department")}
                >
                  <option value="">选择学院</option>
                  {departments.map((dept) => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
                {formErrors.department && (
                  <p className="text-red-500 text-xs mt-1 ml-1">{formErrors.department}</p>
                )}
              </div>
              <div>
                <select
                  name="major"
                  value={formData.major}
                  onChange={handleChange}
                  disabled={majorDisabled}
                  className={`w-full py-2.5 px-4 rounded-lg bg-gray-50 border ${
                    formErrors.major ? "border-red-400 bg-red-50" : "border-gray-200"
                  } focus:outline-none focus:ring-2 focus:ring-yellow-400 text-sm transition-colors ${
                    majorDisabled ? "text-gray-400 cursor-not-allowed" : ""
                  }`}
                >
                  <option value="">{majorDisabled ? "先选学院" : "选择专业"}</option>
                  {majors.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
                {formErrors.major && (
                  <p className="text-red-500 text-xs mt-1 ml-1">{formErrors.major}</p>
                )}
              </div>
            </div>
            {/* 宿舍楼 — 选填，独占一行 */}
            <div className="mt-3">
              <input
                type="text"
                name="dormitory"
                placeholder="宿舍楼（选填，如 2栋405）"
                value={formData.dormitory}
                onChange={handleChange}
                className="w-full py-2.5 px-4 rounded-lg bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-yellow-400 text-sm transition-colors"
              />
            </div>
          </div>

          {/* 提交 */}
          <button
            type="submit"
            className="w-full py-3 bg-yellow-500 text-gray-900 rounded-lg font-semibold hover:bg-yellow-600 active:scale-[0.98] transition-all duration-200"
          >
            注册
          </button>
        </form>

        <p className="text-gray-500 text-sm text-center mt-5">
          已有账号？{" "}
          <a href="/login" className="text-yellow-600 hover:text-gray-900 font-medium transition-colors">
            去登录
          </a>
        </p>
      </div>
    </div>
  );
};

export default Register;
