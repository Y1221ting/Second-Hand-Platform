import React, { useState } from "react";
import Navbar from "./Utility/Navbar";
import Footer from "./Utility/Footer";

const faqData = [
  {
    q: "怎么发布商品？",
    a: "登录后点击导航栏的「发布闲置」，上传商品图片、填写名称和价格、选择分类、补充描述，点击发布即可。整个过程不超过 2 分钟。"
  },
  {
    q: "怎么搜索想要的商品？",
    a: "在首页顶部的搜索框中输入关键词（如「高等数学」「台灯」），按回车即可搜索。也可以在首页左侧使用分类和学院筛选。"
  },
  {
    q: "怎么联系卖家？",
    a: "购买商品后，商品详情页会显示卖家的手机号、微信、QQ 等联系方式。购买前手机号会打码显示（如 138****1234），保护卖家隐私。"
  },
  {
    q: "怎么购买商品？",
    a: "在商品详情页点击「立即购买」填写收货信息，或点击「加入购物车」稍后批量结算。购买成功后系统会自动创建订单，卖家的联系方式也会对你可见。"
  },
  {
    q: "交易怎么完成？",
    a: "购买后卖家会确认订单，双方通过微信/QQ/电话约定时间地点当面交易。交易完成后在订单中点击「确认完成」。如果 24 小时内卖家未确认，可以联系管理员介入。"
  },
  {
    q: "买卖过程中出了问题怎么办？",
    a: "首先双方自行协商解决。如果协商失败，可以在系统通知中联系管理员介入。管理员会根据双方提供的证据（聊天记录、实物照片）做出裁决。恶意行为会被记录警告，三次警告将永久封禁。"
  },
  {
    q: "商品被下架了怎么办？",
    a: "商品被下架通常是因为被举报或违反了平台规则。你可以在「个人中心 → 已下架」中查看下架原因。如有异议，请联系管理员。"
  },
  {
    q: "怎么注销账号？",
    a: "在「个人中心 → 编辑个人资料」页面底部有「注销账号」按钮。注销后你的所有个人信息和商品将被删除，此操作不可撤销。"
  },
  {
    q: "为什么注册后不能发布商品？",
    a: "新注册用户需要等待管理员审核通过后才能发布商品。这是为了防止机器人批量注册和发布垃圾信息。审核通常在 24 小时内完成。"
  },
  {
    q: "这个平台是谁做的？收费吗？",
    a: "这是学生自主开发的校园二手交易平台，完全免费。欢迎在系统通知中给开发者提建议和反馈。"
  },
];

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState(null);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">常见问题</h1>
        <p className="text-sm text-gray-500 mb-6">找不到答案？在系统通知中联系管理员</p>

        <div className="space-y-2">
          {faqData.map((item, idx) => (
            <div key={idx} className="bg-white rounded-xl shadow-sm overflow-hidden">
              <button
                onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
                className="w-full text-left px-5 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <span className="font-medium text-gray-900 text-sm">{item.q}</span>
                <svg
                  className={`w-4 h-4 text-gray-400 transition-transform ${openIndex === idx ? "rotate-180" : ""}`}
                  fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {openIndex === idx && (
                <div className="px-5 pb-4 text-sm text-gray-600 leading-relaxed">
                  {item.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default FAQ;
