import React from "react";
import { Link } from "react-router-dom";
import { FaArrowRight } from "react-icons/fa";

const LandingPage = () => {
  return (
    <div className="h-screen flex flex-col justify-center items-center text-white relative overflow-hidden">
      {/* 多层渐变背景：基础深色渐变 + 左上/右下金色光晕 */}
      <div className="absolute inset-0" style={{
        background: `
          radial-gradient(ellipse at 20% 20%, rgba(251, 191, 36, 0.12) 0%, transparent 50%),
          radial-gradient(ellipse at 80% 80%, rgba(180, 120, 30, 0.08) 0%, transparent 50%),
          linear-gradient(135deg, #111827 0%, #1f2937 50%, #78350f 100%)
        `,
      }} />
      {/* 极淡噪点纹理 — 纯 CSS，无图片请求 */}
      <div className="absolute inset-0 opacity-[0.035]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        backgroundSize: '200px 200px',
      }} />

      <div className="relative z-10 flex flex-col items-center">
        <div
          className="text-yellow-500 text-[6vh] md:text-[12vh] font-bold animate__animated animate__bounceInDown hover:scale-125 hover:animate-bounce transition-all"
          style={{ textShadow: "2px 2px 4px #000000" }}
        >
          Second<span className="text-white">Hand</span>
        </div>
        <div className="text-center flex flex-col items-center px-4">
          <h1
            className="text-3xl md:text-5xl font-bold mb-6 animate__animated animate__fadeInDown text-white"
            style={{ WebkitTextStroke: "1px black" }}
          >
            校园二手市场
            <br />
            连接同学，实惠交易！
          </h1>
          <p className="w-full max-w-lg text-lg text-gray-100 md:text-xl mb-8 animate__animated animate__fadeInUp">
            在校园社区内买卖闲置物品。学长学姐可以将物品传递给学弟学妹，
            降低成本，减少浪费。
          </p>
          <Link
            to="/register"
            className="w-64 mx-auto text-lg bg-yellow-500 hover:bg-gray-900 text-gray-900 hover:text-white font-semibold py-4 px-8 rounded-3xl flex items-center justify-center space-x-2 transition duration-300 animate__animated animate__pulse hover:animate-pulse"
          >
            立即开始
            <FaArrowRight className="text-xl ml-2" />
          </Link>
          <Link
            to="/home"
            className="my-4 text-white hover:text-yellow-500 text-xl font-semibold animate__animated animate__pulse transition-all"
          >
            浏览商品
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
