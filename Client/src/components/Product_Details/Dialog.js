import React, { useState, useEffect } from "react";
import { FaTimes } from "react-icons/fa";
import FormField from "./FormField";
// china-area-data: { "86": {code:name,...}, provinceCode: {cityCode:cityName,...}, cityCode:{areaCode:areaName,...} }
import areaData from "china-area-data/v5/data.json";

// 省份列表：{code: name}
const provinces = areaData["86"] || {};

// 根据省份名称获取城市列表
function getCities(provinceName) {
  const code = Object.entries(provinces).find(
    ([, name]) => name === provinceName
  )?.[0];
  if (!code) return [];
  const cityObj = areaData[code] || {};
  return Object.entries(cityObj).map(([cCode, cName]) => ({ code: cCode, name: cName }));
}

// 根据省份名称+城市名称获取区/县列表
function getDistricts(provinceName, cityName) {
  const provinceCode = Object.entries(provinces).find(
    ([, name]) => name === provinceName
  )?.[0];
  if (!provinceCode) return [];
  const cities = areaData[provinceCode] || {};
  const cityCode = Object.entries(cities).find(
    ([, name]) => name === cityName
  )?.[0];
  if (!cityCode) return [];
  const districtObj = areaData[cityCode] || {};
  return Object.entries(districtObj).map(([dCode, dName]) => ({ code: dCode, name: dName }));
}

const Dialog = ({ isOpen, onClose, onSave, id }) => {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    college: "",
    phoneNo: "",
    address: "",
    district: "",
    city: "",
    state: "",
    zipCode: "",
  });

  const [formErrors, setFormErrors] = useState({});
  const [availableCities, setAvailableCities] = useState([]);
  const [availableDistricts, setAvailableDistricts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState("");
  const [addressHint, setAddressHint] = useState("");

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    // 地址字段检测"大学/学院" → 提示加寝室信息
    if (name === "address") {
      if (/(大学|学院)/.test(value) && !/(寝室|宿舍|栋|号楼|公寓)/.test(value)) {
        setAddressHint("检测到学校地址，请补充寝室楼栋号和寝室号");
      } else {
        setAddressHint("");
      }
    }

    setFormData({ ...formData, [name]: value });
    setFormErrors({ ...formErrors, [name]: value.trim() === "" });
  };

  const handleProvinceChange = (e) => {
    const province = e.target.value;
    const cities = province ? getCities(province) : [];
    setFormData({ ...formData, state: province, city: "", district: "" });
    setAvailableCities(cities);
    setAvailableDistricts([]);
  };

  const handleCityChange = (e) => {
    const city = e.target.value;
    const districts = city && formData.state ? getDistricts(formData.state, city) : [];
    setFormData({ ...formData, city, district: "" });
    setAvailableDistricts(districts);
  };

  const handleSave = () => {
    // 必填校验
    const required = ["fullName", "email", "college", "phoneNo", "address", "city", "state", "zipCode"];
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

    // 地址长度+合规字符校验
    const addr = formData.address || "";
    if (addr.length > 200) {
      alert("详细地址不能超过200个字符");
      return;
    }
    // 只允许中文、字母、数字、常用符号
    if (!/^[\u4e00-\u9fa5a-zA-Z0-9\-——,，。.、\s#（）()号栋楼室单元层]+$/.test(addr)) {
      alert("详细地址包含非法字符");
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
            college: userData.college || "",
            phoneNo: userData.phoneNo || "",
            address: userData.address || "",
            district: userData.district || "",
            city: userData.city || "",
            state: userData.state || "",
            zipCode: userData.zipCode || "",
          });
          if (userData.state) {
            setAvailableCities(getCities(userData.state));
            if (userData.city) {
              setAvailableDistricts(getDistricts(userData.state, userData.city));
            }
          }
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
              <FormField
                label="学校"
                name="college"
                type="text"
                value={formData.college}
                onChange={handleInputChange}
                error={formErrors.college}
              />
              <FormField
                label="手机号"
                name="phoneNo"
                type="tel"
                value={formData.phoneNo}
                onChange={handleInputChange}
                error={formErrors.phoneNo}
              />
            </div>
            <div className="w-full md:w-1/2 ml-1">
              {/* 详细地址 */}
              <div className="mb-3">
                <FormField
                  label="详细地址"
                  name="address"
                  type="text"
                  value={formData.address}
                  onChange={handleInputChange}
                  error={formErrors.address}
                />
                {addressHint && (
                  <p className="text-yellow-600 text-xs mt-1">{addressHint}</p>
                )}
              </div>
              {/* 省份 */}
              <div className="mb-3">
                <label className="block text-gray-600 mb-1">省份</label>
                <select
                  name="state"
                  value={formData.state}
                  onChange={handleProvinceChange}
                  className="w-full border rounded-lg py-2 px-3"
                  required
                >
                  <option value="">请选择省份</option>
                  {Object.entries(provinces).map(([code, name]) => (
                    <option key={code} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>
              {/* 城市 */}
              <div className="mb-3">
                <label className="block text-gray-600 mb-1">城市</label>
                <select
                  name="city"
                  value={formData.city}
                  onChange={handleCityChange}
                  className="w-full border rounded-lg py-2 px-3"
                  required
                  disabled={!formData.state}
                >
                  <option value="">请选择城市</option>
                  {availableCities.map((c) => (
                    <option key={c.code} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              {/* 区/县 */}
              <div className="mb-3">
                <label className="block text-gray-600 mb-1">区/县</label>
                <select
                  name="district"
                  value={formData.district}
                  onChange={handleInputChange}
                  className="w-full border rounded-lg py-2 px-3"
                  disabled={!formData.city || availableDistricts.length === 0}
                >
                  <option value="">
                    {availableDistricts.length > 0 ? "请选择区/县" : "暂无区/县数据"}
                  </option>
                  {availableDistricts.map((d) => (
                    <option key={d.code} value={d.name}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
              <FormField
                label="邮编"
                name="zipCode"
                type="text"
                value={formData.zipCode}
                onChange={handleInputChange}
                error={formErrors.zipCode}
              />
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
