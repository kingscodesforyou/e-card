# 大模型API调用频率限制功能说明

## 功能概述

本功能为大模型API调用提供基于请求速率的限流机制，防止单一客户端过度调用API，保障服务的稳定性和公平性。

## 核心特性

- **滑动窗口算法**：基于时间窗口的精准限流，窗口大小为 60 秒
- **动态配置**：限流阈值可通过后台管理界面实时修改，无需重启服务
- **客户端隔离**：不同用户/IP 的请求计数互不影响
- **状态反馈**：响应头携带限流状态信息，便于客户端自适应
- **异常降级**：配置读取失败时自动使用默认值(20rpm)，确保系统可用性

## 限流规则

- **默认限制**：20 次/分钟 (rpm)
- **窗口大小**：60 秒（滑动窗口）
- **客户端标识**：已认证用户使用 `user:{userId}`，未认证用户使用 `ip:{clientIp}`
- **超限响应**：HTTP 429 状态码 + 错误信息 + 建议重试时间

## 限流响应

当请求被限流时，API 返回：

```json
{
  "error": "请求过于频繁，请稍后重试",
  "retryAfter": 45,
  "limit": 20,
  "windowMs": 60000
}
```

同时会在响应头中包含限流状态：

| 响应头 | 说明 |
|--------|------|
| `X-RateLimit-Limit` | 每分钟允许的最大请求数 |
| `X-RateLimit-Remaining` | 当前窗口剩余的请求数 |
| `X-RateLimit-Reset` | 窗口重置的 Unix 时间戳 |

## 使用指南

### 1. 管理后台配置

1. 登录后台管理系统（`/admin/login`）
2. 点击左侧导航栏「**系统设置**」
3. 找到 `model_api_rate_limit` 配置项
4. 点击「**编辑**」按钮
5. 输入新的限流值（正整数，建议 1-100）
6. 点击「**保存**」按钮

配置修改将**实时生效**，无需重启服务。

### 2. 验证限流效果

通过连续请求测试限流是否生效：

```bash
# 快速连续发送请求测试限流
for i in $(seq 1 25); do
  curl -s -o /dev/null -w "%{http_code}\n" \
    -X POST http://localhost:3001/api/ai/greeting \
    -H "Content-Type: application/json" \
    -d '{"occasion":"生日"}'
done
```

预期结果：
- 前 20 次返回 `200`
- 第 21 次返回 `429`

### 3. 监控与排查

限流日志输出格式：
```
[RateLimiter] 请求被限流: user:xxx, 当前窗口请求数: 20, 限制: 20/min, 请 60 秒后重试
[RateLimiter] 限流值已更新为 50 rpm
[RateLimiter] 无效的限流值: "-5"，保持当前值 20
[RateLimiter] 已清理 100 条过期记录，当前客户端数: 5
```

## 架构设计

### 组件关系

```
┌─────────────────────────────────────────────────┐
│                  请求流程                          │
│                                                   │
│  请求 → rateLimiter中间件 → 检查限流 → 通过 → AI路由   │
│                              │                    │
│                              ├── 超限 → 返回429   │
│                                                   │
│  rateLimiter ← 监听配置变化 ← configService        │
│                               │                   │
│                         system_configs 表          │
└─────────────────────────────────────────────────┘
```

### 配置更新流程

```
管理页面 → PUT /api/admin/configs/:key → 更新数据库
                                              │
                                              ↓
                                     configService 清除缓存
                                              │
                                              ↓
                                    EventEmitter 通知 rateLimiter
                                              │
                                              ↓
                                   rateLimiter 更新内部限制值
                                              │
                                              ↓
                                  下次请求使用新的限流值
```

## 限流算法说明

采用**滑动窗口算法**，实现比固定窗口更平滑的限流效果：

```
时间线: |--- 60秒窗口 ---|
请求序列: 1 2 3 ... 20 | 21(被拒)
                        ↑
                    当前时刻

60秒后：窗口滑动，过期记录被清理，请求恢复可用
```

**优点**：实现简单、内存开销小、误差在可接受范围内
**缺点**：在极端高并发下可能存在毫秒级精度误差（对API限流场景可接受）

## 开发指南

### 文件结构

| 文件 | 说明 |
|------|------|
| `server/rateLimiter.js` | 限流中间件实现 |
| `server/configService.js` | 配置服务（缓存、读取、更新、监听） |
| `db/init/04-system-configs.sql` | 配置表迁移脚本 |
| `src/pages/admin/SettingsPage.tsx` | 后台配置管理页面 |
| `src/tests/rateLimiter.test.ts` | 限流逻辑单元测试 |

### API 参考

#### rateLimiter.js 导出的函数

```javascript
rateLimiter(req, res, next)          // Express 中间件
getCurrentRateLimit()                // 获取当前限流值
resetRateLimiter()                   // 重置限流状态（测试用）
getActiveClientCount()               // 获取活跃客户端数
getClientRequestCount(clientId)      // 获取指定客户端的请求数
```

#### 配置键

| 配置键 | 默认值 | 类型 | 说明 |
|--------|--------|------|------|
| `model_api_rate_limit` | 20 | integer | 大模型API调用频率限制(rpm) |
