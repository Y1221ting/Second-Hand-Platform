import React, { useState, useEffect } from "react";

const WantedList = () => {
  const [wanteds, setWanteds] = useState([]);

  useEffect(() => {
    fetch("/api/wanted?limit=4")
      .then((res) => res.json())
      .then((data) => setWanteds(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  if (wanteds.length === 0) return null;

  return (
    <div className="mb-6">
      <h2 className="text-xl font-semibold mb-3 text-gray-800">
        📢 同学求购
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {wanteds.map((w) => (
          <div
            key={w._id}
            className="border-2 border-green-300 bg-green-50 rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <h3 className="font-semibold text-gray-900 truncate">{w.name}</h3>
            <p className="text-green-600 font-bold text-lg mt-1">
              ¥{Number(w.budget || 0).toFixed(1)}
            </p>
            {w.description && (
              <p className="text-xs text-gray-500 mt-1 line-clamp-2">{w.description}</p>
            )}
            <p className="text-xs text-gray-400 mt-2">
              {w.postedBy?.department} · {w.postedBy?.name}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WantedList;
