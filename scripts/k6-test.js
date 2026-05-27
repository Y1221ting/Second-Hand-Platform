import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 10 },  // 30秒内逐步加到10个并发
    { duration: '1m',  target: 10 },  // 保持10并发跑1分钟
    { duration: '30s', target: 0 },   // 30秒内逐步降到0
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'], // 95%请求应在2秒内完成
    http_req_failed: ['rate<0.05'],    // 失败率低于5%
  },
};

const BASE_URL = 'http://freevian.top:5000';

export default function () {
  // 商品列表（高频访问）
  const list = http.get(`${BASE_URL}/api/products/?page=1&limit=20`);
  check(list, { '商品列表 200': (r) => r.status === 200 });

  // 推荐接口
  const rec = http.get(`${BASE_URL}/api/products/recommendations`);
  check(rec, { '推荐接口 200': (r) => r.status === 200 });

  // 静态资源
  const home = http.get(`${BASE_URL}/`);
  check(home, { '首页 200': (r) => r.status === 200 });

  sleep(1);
}

export function handleSummary(data) {
  return {
    'stdout': `\n
====================================
  压测结果摘要
====================================
总请求数:     ${data.metrics.http_reqs.values.count}
失败请求:     ${data.metrics.http_req_failed.values.passes}
平均响应:     ${data.metrics.http_req_duration.values.avg.toFixed(0)}ms
P95 响应:     ${data.metrics.http_req_duration.values['p(95)'].toFixed(0)}ms
P99 响应:     ${data.metrics.http_req_duration.values['p(99)'].toFixed(0)}ms
峰值 RPS:     ${data.metrics.http_reqs.values.rate.toFixed(1)} req/s
====================================\n`,
  };
}
