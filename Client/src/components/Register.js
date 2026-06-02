import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

// 校验规则
const RULES = {
  email: [
    { test: (v) => !v || !v.trim(), msg: "请输入邮箱" },
    { test: (v) => v && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), msg: "邮箱格式不正确" },
  ],
  password: [
    { test: (v) => !v || !v.trim(), msg: "请输入密码" },
    { test: (v) => v && v.length < 8, msg: "密码至少8位" },
    { test: (v) => v && (!/[a-zA-Z]/.test(v) || !/\d/.test(v)), msg: "需包含字母和数字" },
  ],
  fullName: [
    { test: (v) => !v || !v.trim(), msg: "请输入姓名" },
  ],
  department: [
    { test: (v) => !v || !v.trim(), msg: "请选择学院" },
  ],
  major: [
    { test: (v) => !v || !v.trim(), msg: "请选择专业" },
  ],
  phoneNo: [
    { test: (v) => !v || !v.trim(), msg: "请输入手机号" },
    { test: (v) => v && !/^1[3-9]\d{9}$/.test(v), msg: "请输入11位手机号" },
  ],
};

// 后端错误 → 字段映射
function mapBackendError(message) {
  if (!message) return null;
  if (message.includes("手机号") || message.includes("phone")) return { field: "phoneNo", msg: message };
  if (message.includes("邮箱") || message.includes("email") || message.includes("注册失败")) return { field: "email", msg: message };
  if (message.includes("密码") || message.includes("Password")) return { field: "password", msg: message };
  return { field: null, msg: message }; // 表单级错误
}

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "", password: "", fullName: "", department: "", major: "", phoneNo: "", dormitory: "",
  });
  const [formErrors, setFormErrors] = useState({});
  const [formError, setFormError] = useState(""); // 表单级错误
  const [submitting, setSubmitting] = useState(false);

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

  // 校验单个字段，返回错误文案或 ""
  const validateField = (name, value) => {
    const rules = RULES[name];
    if (!rules) return "";
    for (const rule of rules) {
      if (rule.test(value)) return rule.msg;
    }
    return "";
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) setFormErrors((prev) => ({ ...prev, [name]: "" }));
    if (formError) setFormError("");
  };

  // 失焦校验
  const handleBlur = (e) => {
    const { name, value } = e.target;
    const msg = validateField(name, value);
    setFormErrors((prev) => ({ ...prev, [name]: msg }));
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
    setFormError("");

    // 全字段校验
    const fields = ["email", "password", "fullName", "department", "major", "phoneNo"];
    const errors = {};
    for (const field of fields) {
      const msg = validateField(field, formData[field]);
      if (msg) errors[field] = msg;
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setSubmitting(true);
    try {
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
        const mapped = mapBackendError(data.message);
        if (mapped.field) {
          setFormErrors((prev) => ({ ...prev, [mapped.field]: mapped.msg }));
        } else {
          setFormError(mapped.msg || "注册失败，请稍后重试");
        }
      }
    } catch {
      setFormError("网络错误，请检查连接后重试");
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass = (name) =>
    `w-full py-2.5 px-4 rounded-lg bg-gray-50 border ${
      formErrors[name] ? "border-red-400 bg-red-50" : "border-gray-200"
    } focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent text-sm transition-colors`;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 px-4 py-8">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-8">
        <div className="text-center mb-7">
          <h1 className="text-2xl font-bold text-gray-900">注册</h1>
          <p className="text-gray-400 text-sm mt-1">校园二手交易平台</p>
        </div>

        {/* 表单级错误 */}
        {formError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm text-center">
            {formError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* ===== 账号信息 ===== */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">账号信息</p>
            <div className="space-y-3">
              <div>
                <input type="text" name="email" placeholder="邮箱"
                  value={formData.email} onChange={handleChange} onBlur={handleBlur} className={inputClass("email")} />
                {formErrors.email && <p className="text-red-500 text-xs mt-1 ml-1">{formErrors.email}</p>}
              </div>
              <div>
                <input type="password" name="password" placeholder="密码（至少8位，需含字母和数字）"
                  value={formData.password} onChange={handleChange} onBlur={handleBlur} className={inputClass("password")} />
                {formErrors.password && <p className="text-red-500 text-xs mt-1 ml-1">{formErrors.password}</p>}
              </div>
            </div>
          </div>

          {/* ===== 个人资料 ===== */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">个人资料</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <input type="text" name="fullName" placeholder="姓名"
                  value={formData.fullName} onChange={handleChange} onBlur={handleBlur} className={inputClass("fullName")} />
                {formErrors.fullName && <p className="text-red-500 text-xs mt-1 ml-1">{formErrors.fullName}</p>}
              </div>
              <div>
                <input type="tel" name="phoneNo" placeholder="手机号" maxLength="11"
                  value={formData.phoneNo} onChange={handleChange} onBlur={handleBlur} className={inputClass("phoneNo")} />
                {formErrors.phoneNo && <p className="text-red-500 text-xs mt-1 ml-1">{formErrors.phoneNo}</p>}
              </div>
              <div>
                <select name="department" value={formData.department}
                  onChange={handleDepartmentChange} onBlur={handleBlur} className={inputClass("department")}>
                  <option value="">选择学院</option>
                  {departments.map((dept) => (<option key={dept} value={dept}>{dept}</option>))}
                </select>
                {formErrors.department && <p className="text-red-500 text-xs mt-1 ml-1">{formErrors.department}</p>}
              </div>
              <div>
                <select name="major" value={formData.major} onChange={handleChange}
                  onBlur={handleBlur} disabled={majorDisabled}
                  className={`w-full py-2.5 px-4 rounded-lg bg-gray-50 border ${formErrors.major ? "border-red-400 bg-red-50" : "border-gray-200"} focus:outline-none focus:ring-2 focus:ring-yellow-400 text-sm transition-colors ${majorDisabled ? "text-gray-400 cursor-not-allowed" : ""}`}>
                  <option value="">{majorDisabled ? "先选学院" : "选择专业"}</option>
                  {majors.map((m) => (<option key={m} value={m}>{m}</option>))}
                </select>
                {formErrors.major && <p className="text-red-500 text-xs mt-1 ml-1">{formErrors.major}</p>}
              </div>
            </div>
            <div className="mt-3">
              <input type="text" name="dormitory" placeholder="宿舍楼（选填，如 2栋405）"
                value={formData.dormitory} onChange={handleChange}
                className="w-full py-2.5 px-4 rounded-lg bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-yellow-400 text-sm transition-colors" />
            </div>
          </div>

          <button type="submit" disabled={submitting}
            className={`w-full py-3 rounded-lg font-semibold transition-all duration-200 active:scale-[0.98] ${
              submitting ? "bg-gray-300 text-gray-500 cursor-not-allowed" : "bg-yellow-500 text-gray-900 hover:bg-yellow-600"
            }`}>
            {submitting ? "注册中..." : "注册"}
          </button>
        </form>

        <p className="text-gray-500 text-sm text-center mt-5">
          已有账号？{" "}
          <a href="/login" className="text-yellow-600 hover:text-gray-900 font-medium transition-colors">去登录</a>
        </p>
      </div>
    </div>
  );
};

export default Register;
