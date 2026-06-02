import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";

const HomeBanner = ({ departments }) => {
  const [stats, setStats] = useState({ userCount: 0, productCount: 0 });

  useEffect(() => {
    fetch("/api/stats")
      .then((res) => res.json())
      .then((data) => setStats(data))
      .catch(() => {});
  }, []);

  return (
    <div className="bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 rounded-xl p-6 mb-6 text-gray-900">
      <h1 className="text-2xl font-bold mb-2">校园二手集市</h1>
      <p className="text-lg mb-4">
        已有 <span className="font-bold text-xl">{stats.userCount}</span> 位同学加入，
        <span className="font-bold text-xl"> {stats.productCount} </span> 件商品在售
      </p>
      <div className="flex flex-wrap gap-2">
        {departments.slice(0, 6).map((dept) => (
          <Link
            key={dept}
            to={`/home`}
            className="bg-white bg-opacity-30 hover:bg-opacity-50 px-3 py-1 rounded-full text-sm transition-colors"
          >
            {dept}
          </Link>
        ))}
      </div>
    </div>
  );
};

export default HomeBanner;
