import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/authContext";

const Footer = () => {
  const { user } = useAuth();

  return (
    <footer className="bg-gray-900 text-white text-right p-12">
      <div className="max-w-screen-xl mx-auto px-4">
        <div className="flex flex-col md:flex-row md:justify-between align-middle">
          <div className="md:w-1/4 text-center md:text-left">
            <h2 className="text-xl font-bold">
              <span className="text-yellow-500">校园</span>二手市场
            </h2>
            <p>连接同学，实惠交易！</p>
          </div>
          <div className="w-full md:w-3/4 grid grid-cols-2 text-center md:text-right md:flex md:flex-row justify-between mt-4 md:mt-0">
            <div className="md:w-1/4 my-2 md:my-0">
              <h3 className="text-lg font-semibold">快速导航</h3>
              <ul className="text-gray-300">
                <li>
                  <Link to="/" className="hover:text-yellow-500 transition duration-300">
                    首页
                  </Link>
                </li>
                <li>
                  <Link to="/home" className="hover:text-yellow-500 transition duration-300">
                    商品列表
                  </Link>
                </li>
                <li>
                  <Link to="/add-product" className="hover:text-yellow-500 transition duration-300">
                    发布商品
                  </Link>
                </li>
                <li>
                  {user ? (
                    <Link
                      to={`/profile/${user.id}`}
                      className="hover:text-yellow-500 transition duration-300"
                    >
                      个人中心
                    </Link>
                  ) : (
                    <Link to="/login" className="hover:text-yellow-500 transition duration-300">
                      个人中心
                    </Link>
                  )}
                </li>
              </ul>
            </div>
            <div className="md:w-1/4 my-2 md:my-0">
              <h3 className="text-lg font-semibold">帮助中心</h3>
              <ul className="text-gray-300">
                <li>使用指南</li>
                <li>常见问题</li>
                <li>交易规则</li>
                <li>联系客服</li>
              </ul>
            </div>
            <div className="md:w-1/4 my-2 md:my-0">
              <h3 className="text-lg font-semibold">关于我们</h3>
              <ul className="text-gray-300">
                <li>平台介绍</li>
                <li>用户协议</li>
                <li>隐私政策</li>
                <li>意见反馈</li>
              </ul>
            </div>
          </div>
        </div>
        <hr className="border-gray-800 my-8" />
        <div className="text-gray-300 text-center">
          &copy; {new Date().getFullYear()} 校园二手市场. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
