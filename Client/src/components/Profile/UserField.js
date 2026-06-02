import React from "react";

const UserField = ({ label, name, value, onChange, editMode, error, onBlur }) => {
  return (
    <div className="mb-4">
      <label className="font-semibold">{label}:</label>{" "}
      {editMode ? (
        <>
          <input
            type="text"
            name={name}
            value={value}
            onChange={onChange}
            onBlur={onBlur}
            className={`w-full py-2 px-4 rounded-lg bg-gray-100 border ${
              error ? "border-red-400 bg-red-50" : "border-gray-900"
            } focus:border-transparent focus:outline-none focus:ring-2 focus:ring-yellow-500`}
          />
          {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
        </>
      ) : (
        <input
          type="text"
          name={name}
          value={value}
          onChange={onChange}
          className="w-full py-2 px-4 rounded-lg bg-gray-100 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
          disabled
        />
      )}
    </div>
  );
};

export default UserField;
