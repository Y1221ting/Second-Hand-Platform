import React, { useState, useEffect } from "react";
import { FaTimes } from "react-icons/fa";
import FormField from "./FormField";

const Dialog = ({ isOpen, onClose, onSave, id }) => {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phoneNo: "",
    dormitory: "",
  });

  const [formErrors, setFormErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState("");

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setFormErrors({ ...formErrors, [name]: value.trim() === "" });
  };

  const handleSave = () => {
    const required = ["fullName", "email", "phoneNo"];
    const errors = {};
    let hasError = false;

    for (const field of required) {
      if (!formData[field] || formData[field].trim() === "") {
        errors[field] = true;
        hasError = true;
      }
    }

    if (hasError) {
      setFormErrors(errors);
      alert("请填写所有必填字段！");
      return;
    }

    const phoneRegex = /^1[3-9]\d{9}$/;
    if (!phoneRegex.test(formData.phoneNo)) {
      alert("手机号格式不正确，请输入11位中国手机号码");
      return;
    }

    onSave(formData);
  };

  useEffect(() => {
    const fetchUserDetails = async () => {
      if (!id) {
        setFetchError("用户ID无效");
        setLoading(false);
        return;
      }
      setLoading(true);
      setFetchError("");
      try {
        const response = await fetch(`/api/users/${id}`);
        if (response.ok) {
          const userData = await response.json();
          setFormData({
            fullName: userData.fullName || "",
            email: userData.email || "",
            phoneNo: userData.phoneNo || "",
            dormitory: userData.dormitory || "",
          });
        } else if (response.status === 404) {
          setFetchError("未找到用户信息，请重新登录");
        } else {
          setFetchError("获取用户信息失败");
        }
      } catch (error) {
        console.error(error);
        setFetchError("网络错误，请检查连接");
      } finally {
        setLoading(false);
      }
    };

    if (isOpen) {
      fetchUserDetails();
    }
  }, [id, isOpen]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="dialog-overlay bg-gray-800 opacity-50 absolute inset-0"></div>
      <div className="dialog-content bg-white p-8 rounded-lg shadow-lg z-50 w-full md:w-1/2">
        <button
          className="absolute top-2 right-2 text-gray-700"
          onClick={onClose}
        >
          <FaTimes />
        </button>
        <h2 className="text-2xl font-semibold mb-4">确认收货信息</h2>
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500 mx-auto"></div>
            <p className="text-gray-500 mt-2">加载中...</p>
          </div>
        ) : fetchError ? (
          <div className="text-center py-8">
            <p className="text-red-500 mb-4">{fetchError}</p>
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600 transition duration-300"
            >
              关闭
            </button>
          </div>
        ) : (
        <form className="dialog-form">
          <div className="flex flex-col md:flex-row w-full justify-between">
            <div className="w-full md:w-1/2 mr-1">
              <FormField
                label="姓名"
                name="fullName"
                type="text"
                value={formData.fullName}
                onChange={handleInputChange}
                error={formErrors.fullName}
              />
              <FormField
                label="邮箱"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                error={formErrors.email}
              />
            </div>
            <div className="w-full md:w-1/2 ml-1">
              <FormField
                label="手机号"
                name="phoneNo"
                type="tel"
                value={formData.phoneNo}
                onChange={handleInputChange}
                error={formErrors.phoneNo}
              />
              <div className="mb-3">
                <FormField
                  label="宿舍楼（方便当面交易）"
                  name="dormitory"
                  type="text"
                  value={formData.dormitory}
                  onChange={handleInputChange}
                  error={formErrors.dormitory}
                />
                <p className="text-gray-400 text-xs mt-1">选填，默认当面交易，填宿舍楼更方便（如：2栋405）</p>
              </div>
            </div>
          </div>
          <div className="flex justify-around">
            <button
              type="button"
              onClick={onClose}
              className="w-1/3 md:w-1/4 bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-800 transition duration-300"
            >
              取消
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="w-1/3 md:w-1/4 bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-800 transition duration-300"
            >
              确认
            </button>
          </div>
        </form>
        )}
      </div>
    </div>
  );
};

export default Dialog;
