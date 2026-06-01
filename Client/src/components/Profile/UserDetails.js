import React, { useState, useEffect } from "react";
import UserField from "./UserField";

const UserDetails = ({
  userData,
  displayEdit,
  editMode,
  formData,
  handleChange,
  handleEditClick,
  handleSaveClick,
}) => {
  const [majorMap, setMajorMap] = useState({});
  const [departments, setDepartments] = useState([]);
  const [majors, setMajors] = useState([]);

  useEffect(() => {
    fetch("/api/majorMap")
      .then((res) => res.json())
      .then((data) => {
        setMajorMap(data);
        setDepartments(Object.keys(data));
        // 如果已有 department，加载对应专业列表
        const dept = formData.department || userData.department;
        if (dept && data[dept]) {
          setMajors(data[dept]);
        }
      })
      .catch(() => console.error("获取学院列表失败"));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDepartmentChange = (e) => {
    const dept = e.target.value;
    handleChange({ target: { name: "department", value: dept } });
    handleChange({ target: { name: "major", value: "" } });
    if (dept && majorMap[dept]) {
      setMajors(majorMap[dept]);
    } else {
      setMajors([]);
    }
  };

  // 手机号实时校验
  const phoneRegex = /^1[3-9]\d{9}$/;
  const phoneError =
    editMode && formData.phoneNo && !phoneRegex.test(formData.phoneNo)
      ? "手机号格式不正确"
      : "";

  return (
    <div className="w-full md:w-3/4 p-4">
      <form>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="mb-4">
            <UserField
              label="姓名"
              name="fullName"
              value={editMode ? formData.fullName : userData.fullName}
              onChange={handleChange}
              editMode={editMode}
            />
          </div>
          <div className="mb-4">
            <UserField
              label="邮箱"
              name="email"
              value={editMode ? formData.email : userData.email}
              onChange={handleChange}
              editMode={editMode}
            />
          </div>
          <div className="mb-4">
            <UserField
              label="手机号"
              name="phoneNo"
              value={editMode ? formData.phoneNo : userData.phoneNo}
              onChange={handleChange}
              editMode={editMode}
            />
            {phoneError && (
              <p className="text-red-500 text-xs mt-1">{phoneError}</p>
            )}
          </div>

          {/* 学院 — 编辑模式下拉，展示模式禁用输入框 */}
          <div className="mb-4">
            <label className="font-semibold">学院:</label>{" "}
            {editMode ? (
              <select
                name="department"
                value={formData.department || ""}
                onChange={handleDepartmentChange}
                className="w-full py-2 px-4 rounded-lg bg-gray-100 border border-gray-900 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-yellow-500"
              >
                <option value="">请选择学院</option>
                {departments.map((dept) => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={userData.department || ""}
                readOnly
                disabled
                className="w-full py-2 px-4 rounded-lg bg-gray-100 border border-gray-300 focus:outline-none"
              />
            )}
          </div>

          {/* 专业 — 编辑模式联动下拉，展示模式禁用输入框 */}
          <div className="mb-4">
            <label className="font-semibold">专业:</label>{" "}
            {editMode ? (
              <select
                name="major"
                value={formData.major || ""}
                onChange={handleChange}
                disabled={!formData.department}
                className={`w-full py-2 px-4 rounded-lg bg-gray-100 border border-gray-900 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-yellow-500 ${
                  !formData.department ? "text-gray-400 cursor-not-allowed" : ""
                }`}
              >
                <option value="">
                  {!formData.department ? "请先选择学院" : "请选择专业"}
                </option>
                {majors.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={userData.major || ""}
                readOnly
                disabled
                className="w-full py-2 px-4 rounded-lg bg-gray-100 border border-gray-300 focus:outline-none"
              />
            )}
          </div>

          {/* 宿舍楼 — 选填 */}
          <div className="mb-4">
            <UserField
              label="宿舍楼"
              name="dormitory"
              value={editMode ? (formData.dormitory || "") : (userData.dormitory || "")}
              onChange={handleChange}
              editMode={editMode}
            />
          </div>
        </div>
      </form>
      {displayEdit && (
        <>
          {editMode ? (
            <button
              type="button"
              onClick={handleSaveClick}
              className="w-full py-2 px-4 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition duration-300"
            >
              保存
            </button>
          ) : (
            <button
              type="button"
              onClick={handleEditClick}
              className="w-full py-2 px-4 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition duration-300"
            >
              编辑
            </button>
          )}
        </>
      )}
    </div>
  );
};

export default UserDetails;
