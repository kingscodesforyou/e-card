// 简单测试服务器
const http = require('http');

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ status: 'ok' }));
});

server.listen(3001, () => {
  console.log('Server running on http://localhost:3001');
  
  // 保持服务器运行
  setInterval(() => {}, 1000);
});
