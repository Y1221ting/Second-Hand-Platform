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
  const [formErrors, setFormErrors] = useState({
    email: "",
    password: "",
    fullName: "",
    department: "",
    major: "",
    phoneNo: "",
  });

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
    if (formErrors.department) {
      setFormErrors((prev) => ({ ...prev, department: "" }));
    }
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
    requiredFields.forEach((field) => {
      if (!formData[field]) {
        errors[field] = "此项为必填";
      }
    });

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    const phoneRegex = /^1[3-9]\d{9}$/;
    if (!phoneRegex.test(formData.phoneNo)) {
      setFormErrors((prev) => ({ ...prev, phoneNo: "手机号格式不正确（11位，1开头）" }));
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="bg-white p-8 rounded-lg shadow-lg sm:w-96 md:w-2/3">
        <h1 className="text-3xl font-semibold text-gray-900 mb-4">
          注册 · 南昌师范学院
        </h1>
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
                  <p className="text-red-500 text-sm mt-1">{formErrors.fullName}</p>
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
                  <p className="text-red-500 text-sm mt-1">{formErrors.email}</p>
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
                  <p className="text-red-500 text-sm mt-1">{formErrors.password}</p>
                )}
              </div>
            </div>
            <div className="md:w-1/2 pr-0 md:pr-2">
              <div className="mb-4">
                <select
                  name="department"
                  value={formData.department}
                  onChange={handleDepartmentChange}
                  className={`w-full py-2 px-4 rounded-lg bg-gray-100 border ${
                    formErrors.department ? "border-red-500" : "border-gray-300"
                  } focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent`}
                >
                  <option value="">请选择学院</option>
                  {departments.map((dept) => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
                {formErrors.department && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.department}</p>
                )}
              </div>
              <div className="mb-4">
                <select
                  name="major"
                  value={formData.major}
                  onChange={handleChange}
                  disabled={majorDisabled}
                  className={`w-full py-2 px-4 rounded-lg bg-gray-100 border ${
                    formErrors.major ? "border-red-500" : "border-gray-300"
                  } focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent ${
                    majorDisabled ? "text-gray-400 cursor-not-allowed" : ""
                  }`}
                >
                  <option value="">{majorDisabled ? "请先选择学院" : "请选择专业"}</option>
                  {majors.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
                {formErrors.major && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.major}</p>
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
                  <p className="text-red-500 text-sm mt-1">{formErrors.phoneNo}</p>
                )}
              </div>
              <div className="mb-4">
                <input
                  type="text"
                  name="dormitory"
                  placeholder="宿舍楼（选填，方便同宿舍楼当面交易，如：1栋302）"
                  value={formData.dormitory}
                  onChange={handleChange}
                  className="w-full py-2 px-4 rounded-lg bg-gray-100 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                />
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
        </p>
      </div>
    </div>
  );
};

export default Register;
