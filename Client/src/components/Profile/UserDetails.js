// UserDetails.js
import React from "react";
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
  return (
    <div className="w-full md:w-3/4 p-4">
      <form>
        {/* Use UserField component for each field */}
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
          </div>
          <div className="mb-4">
            <UserField
              label="学校"
              name="college"
              value={editMode ? formData.college : userData.college}
              onChange={handleChange}
              editMode={editMode}
            />
          </div>
          <div className="mb-4">
            <UserField
              label="学号"
              name="collegeId"
              value={editMode ? formData.collegeId : userData.collegeId}
              onChange={handleChange}
              editMode={editMode}
            />
          </div>
          <div className="mb-4">
            <UserField
              label="地址"
              name="address"
              value={editMode ? formData.address : userData.address}
              onChange={handleChange}
              editMode={editMode}
            />
          </div>
          <div className="mb-4">
            <UserField
              label="城市"
              name="city"
              value={editMode ? formData.city : userData.city}
              onChange={handleChange}
              editMode={editMode}
            />
          </div>
          <div className="mb-4">
            <UserField
              label="省份"
              name="state"
              value={editMode ? formData.state : userData.state}
              onChange={handleChange}
              editMode={editMode}
            />
          </div>
          <div className="mb-4">
            <UserField
              label="邮编"
              name="zipCode"
              value={editMode ? formData.zipCode : userData.zipCode}
              onChange={handleChange}
              editMode={editMode}
            />
          </div>
        </div>
      </form>
      {displayEdit && (
        // Show the buttons only when the user is viewing their own profile
        <>
          {editMode ? (
            // Edit mode
            <button
              type="button"
              onClick={handleSaveClick}
              className="w-full py-2 px-4 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition duration-300"
            >
              保存
            </button>
          ) : (
            // Read-only mode
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
