// =====================================================
// API 调用频率限制中间件（滑动窗口算法）
// 用于限制大模型 API 的调用频率
// =====================================================

import { getConfig, onConfigChanged, getDefaultRateLimit } from './configService.js';

// 配置键名
const RATE_LIMIT_CONFIG_KEY = 'model_api_rate_limit';
// 滑动窗口大小（毫秒）
const WINDOW_MS = 60 * 1000; // 60秒
// 清理间隔（毫秒）
const CLEANUP_INTERVAL_MS = 60 * 1000; // 60秒

// 存储每个客户端的请求时间戳
// Map<clientId, number[]>
const requestTimestamps = new Map();

// 当前限流值（由配置动态更新）
let currentRateLimit = getDefaultRateLimit();

// 状态标志
let cleanupTimer = null;
let listenerRegistered = false;

/**
 * 初始化限流器
 */
function init() {
  // 启动定时清理任务，防止内存泄漏
  if (!cleanupTimer) {
    cleanupTimer = setInterval(cleanupExpiredEntries, CLEANUP_INTERVAL_MS);
    // 确保 Node.js 进程可以退出（不阻止事件循环关闭）
    if (cleanupTimer && cleanupTimer.unref) {
      cleanupTimer.unref();
    }
  }

  // 注册配置变更监听（只注册一次）
  if (!listenerRegistered) {
    onConfigChanged(RATE_LIMIT_CONFIG_KEY, (newValue) => {
      const parsed = parseInt(newValue, 10);
      if (!isNaN(parsed) && parsed > 0) {
        currentRateLimit = parsed;
        console.log(`[RateLimiter] 限流值已更新为 ${currentRateLimit} rpm`);
      } else {
        console.warn(`[RateLimiter] 无效的限流值: "${newValue}"，保持当前值 ${currentRateLimit}`);
      }
    });
    listenerRegistered = true;
  }
}

/**
 * 清理过期的请求记录
 */
function cleanupExpiredEntries() {
  const now = Date.now();
  const cutoff = now - WINDOW_MS;
  let totalCleaned = 0;

  for (const [clientId, timestamps] of requestTimestamps.entries()) {
    // 过滤掉过期的记录
    const valid = timestamps.filter(ts => ts > cutoff);
    if (valid.length === 0) {
      requestTimestamps.delete(clientId);
      totalCleaned++;
    } else if (valid.length < timestamps.length) {
      requestTimestamps.set(clientId, valid);
      totalCleaned += timestamps.length - valid.length;
    }
  }

  if (totalCleaned > 0) {
    console.log(`[RateLimiter] 已清理 ${totalCleaned} 条过期记录，当前客户端数: ${requestTimestamps.size}`);
  }
}

/**
 * 获取客户端标识
 * @param {object} req - Express 请求对象
 * @returns {string} 客户端唯一标识
 */
function getClientId(req) {
  // 优先使用用户ID（已认证用户），其次使用 IP 地址
  if (req.user && req.user.id) {
    return `user:${req.user.id}`;
  }

  // 尝试从 headers 中获取真实 IP
  const forwarded = req.headers['x-forwarded-for'];
  const ip = forwarded
    ? forwarded.split(',')[0].trim()
    : req.ip || req.connection?.remoteAddress || 'unknown';

  return `ip:${ip}`;
}

/**
 * 限流中间件
 * 在请求处理前检查是否超出频率限制
 */
export async function rateLimiter(req, res, next) {
  // 确保已初始化
  init();

  const clientId = getClientId(req);
  const now = Date.now();
  const cutoff = now - WINDOW_MS;

  // 获取当前客户端的请求时间戳列表
  let timestamps = requestTimestamps.get(clientId) || [];

  // 清理当前窗口之前的过期记录
  timestamps = timestamps.filter(ts => ts > cutoff);

  // 检查是否超出限制
  if (timestamps.length >= currentRateLimit) {
    const oldestTimestamp = timestamps[0];
    const retryAfter = Math.max(1, Math.ceil((oldestTimestamp + WINDOW_MS - now) / 1000));

    console.warn(
      `[RateLimiter] 请求被限流: ${clientId}, ` +
      `当前窗口请求数: ${timestamps.length}, 限制: ${currentRateLimit}/min, ` +
      `请 ${retryAfter} 秒后重试`
    );

    return res.status(429).json({
      error: '请求过于频繁，请稍后重试',
      retryAfter,
      limit: currentRateLimit,
      windowMs: WINDOW_MS,
    });
  }

  // 记录当前请求
  timestamps.push(now);
  requestTimestamps.set(clientId, timestamps);

  // 添加响应头，方便客户端了解限流状态
  res.setHeader('X-RateLimit-Limit', currentRateLimit);
  res.setHeader('X-RateLimit-Remaining', Math.max(0, currentRateLimit - timestamps.length));
  res.setHeader('X-RateLimit-Reset', Math.ceil((cutoff + WINDOW_MS) / 1000));

  next();
}

/**
 * 获取当前限流值
 * @returns {number}
 */
export function getCurrentRateLimit() {
  return currentRateLimit;
}

/**
 * 重置限流状态（用于测试）
 */
export function resetRateLimiter() {
  requestTimestamps.clear();
  currentRateLimit = getDefaultRateLimit();

  if (cleanupTimer) {
    clearInterval(cleanupTimer);
    cleanupTimer = null;
  }
  listenerRegistered = false;

  console.log('[RateLimiter] 状态已重置');
}

/**
 * 获取当前记录的客户端数量（用于监控/测试）
 * @returns {number}
 */
export function getActiveClientCount() {
  return requestTimestamps.size;
}

/**
 * 获取指定客户端的当前请求数（用于测试）
 * @param {string} clientId
 * @returns {number}
 */
export function getClientRequestCount(clientId) {
  const timestamps = requestTimestamps.get(clientId);
  if (!timestamps) return 0;
  const cutoff = Date.now() - WINDOW_MS;
  return timestamps.filter(ts => ts > cutoff).length;
}
