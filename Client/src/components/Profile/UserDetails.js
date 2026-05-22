import React, { useState } from "react";
import UserField from "./UserField";
import JIANGXI_COLLEGES from "../../constants/colleges";

const UserDetails = ({
  userData,
  displayEdit,
  editMode,
  formData,
  handleChange,
  handleEditClick,
  handleSaveClick,
}) => {
  const [showCollegeDropdown, setShowCollegeDropdown] = useState(false);
  const [collegeFocused, setCollegeFocused] = useState(false);

  // 根据输入过滤学校列表
  const filteredColleges = formData.college
    ? JIANGXI_COLLEGES.filter((c) =>
        c.toLowerCase().includes(formData.college.toLowerCase())
      )
    : [];

  // 手动输入的学校后缀校验
  const isCustomCollege =
    formData.college &&
    !JIANGXI_COLLEGES.includes(formData.college);
  const isCollegeValid =
    !isCustomCollege ||
    /(大学|学院)$/.test(formData.college);

  // 手机号实时校验
  const phoneRegex = /^1[3-9]\d{9}$/;
  const phoneError =
    editMode && formData.phoneNo && !phoneRegex.test(formData.phoneNo)
      ? "手机号格式不正确"
      : "";

  // 地址长度实时校验
  const addressError =
    editMode && formData.address && formData.address.trim().length > 0 && formData.address.trim().length < 5
      ? "地址至少需要5个字符"
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
          {/* 学校 — 编辑模式下模糊搜索+下拉 */}
          <div className="mb-4 relative">
            <label className="font-semibold">学校:</label>{" "}
            {editMode ? (
              <div>
                <input
                  type="text"
                  name="college"
                  value={formData.college || ""}
                  onChange={(e) => {
                    handleChange(e);
                    setShowCollegeDropdown(true);
                  }}
                  onFocus={() => {
                    setCollegeFocused(true);
                    setShowCollegeDropdown(true);
                  }}
                  onBlur={() =>
                    setTimeout(() => setShowCollegeDropdown(false), 200)
                  }
                  className="w-full py-2 px-4 rounded-lg bg-gray-100 border border-gray-900 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-yellow-500"
                />
                {/* 手动输入且后缀无效时显示提示 */}
                {isCustomCollege && !isCollegeValid && (
                  <p className="text-red-500 text-xs mt-1">
                    学校名称必须以"大学"或"学院"结尾
                  </p>
                )}
                {/* 下拉列表 */}
                {showCollegeDropdown &&
                  collegeFocused &&
                  filteredColleges.length > 0 && (
                    <ul className="absolute z-50 w-full bg-white border border-gray-300 rounded-lg mt-1 max-h-48 overflow-y-auto shadow-lg">
                      {filteredColleges.slice(0, 8).map((college) => (
                        <li
                          key={college}
                          className="px-3 py-2 hover:bg-yellow-100 cursor-pointer text-sm"
                          onMouseDown={() => {
                            handleChange({
                              target: { name: "college", value: college },
                            });
                            setShowCollegeDropdown(false);
                          }}
                        >
                          {college}
                        </li>
                      ))}
                    </ul>
                  )}
              </div>
            ) : (
              <input
                type="text"
                name="college"
                value={userData.college || ""}
                readOnly
                disabled
                className="w-full py-2 px-4 rounded-lg bg-gray-100 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              />
            )}
          </div>

          <div className="mb-4">
            <UserField
              label="地址"
              name="address"
              value={editMode ? formData.address : userData.address}
              onChange={handleChange}
              editMode={editMode}
            />
            {addressError && (
              <p className="text-red-500 text-xs mt-1">{addressError}</p>
            )}
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
