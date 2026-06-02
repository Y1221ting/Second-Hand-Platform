import React from "react";
import { Link } from "react-router-dom";
import Navbar from "./Utility/Navbar";
import Footer from "./Utility/Footer";

const Privacy = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">隐私政策</h1>
        <p className="text-sm text-gray-500 mb-6">最后更新日期：2026 年 6 月</p>

        <div className="bg-white rounded-xl shadow-sm p-6 space-y-6 text-sm text-gray-700 leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">1. 我们收集哪些信息</h2>
            <p>当您注册和使用校园二手集市时，我们会收集以下信息：</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li><strong>账号信息：</strong>邮箱地址、密码（加密存储）</li>
              <li><strong>个人资料：</strong>姓名、手机号、学院、专业、宿舍楼</li>
              <li><strong>选填信息：</strong>微信号、QQ号、收货地址</li>
              <li><strong>使用记录：</strong>发布的商品、购买记录、购物车内容</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">2. 信息用来做什么</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>展示商品时显示卖家的学院、专业，方便买家判断可信度</li>
              <li>交易时向双方提供联系方式（手机号/微信/QQ），方便当面交易</li>
              <li>管理员审核新注册用户，维护平台安全</li>
              <li>发送交易相关的系统通知（购买成功、商品被下架等）</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">3. 信息不会分享给第三方</h2>
            <p>我们承诺：</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>不会将您的个人信息出售或分享给任何第三方</li>
              <li>不会用于任何商业广告或营销目的</li>
              <li>不会在您未授权的情况下公开您的完整手机号（购买前会打码显示）</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">4. 数据安全</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>密码使用 bcrypt 加密存储，任何人（包括管理员）无法查看您的原始密码</li>
              <li>数据库仅限服务器本地访问，不暴露在公网</li>
              <li>定期备份数据，防止数据丢失</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">5. 您的权利</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>您可以随时编辑个人资料中的信息</li>
              <li>您可以删除自己发布的商品</li>
              <li>您可以在个人设置中注销账号，注销后所有个人信息将被删除</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">6. 联系我们</h2>
            <p>如果您对隐私政策有任何疑问，或希望行使您的数据权利，请联系管理员：</p>
            <p className="mt-1">
              通过平台的
              <Link to="/faq" className="text-yellow-600 hover:text-yellow-700 underline mx-1">
                FAQ 页面
              </Link>
              了解常见问题，或在"系统通知"中联系管理员。
            </p>
          </section>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Privacy;
