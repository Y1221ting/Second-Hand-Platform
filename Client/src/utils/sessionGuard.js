// 全局 fetch 拦截：检测 SESSION_EXPIRED，自动清除登录态
const originalFetch = window.fetch.bind(window);

window.fetch = async (...args) => {
  const res = await originalFetch(...args);
  if (res.status === 401) {
    try {
      const clone = res.clone();
      const body = await clone.json();
      if (body.code === "SESSION_EXPIRED") {
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        window.dispatchEvent(new CustomEvent("session-expired"));
      }
    } catch (_) {
      // 非 JSON 响应忽略
    }
  }
  return res;
};
