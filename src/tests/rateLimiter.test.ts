// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// 使用 vi.hoisted 确保 mock 变量在 hoisted 的 vi.mock 之前初始化
const { mockGetConfig, mockGetDefaultRateLimit, mockOnConfigChanged } = vi.hoisted(() => ({
  mockGetConfig: vi.fn().mockResolvedValue(20),
  mockGetDefaultRateLimit: vi.fn().mockReturnValue(20),
  mockOnConfigChanged: vi.fn(),
}));

// 模拟 configService（vi.mock 会自动 hoist 到顶部）
vi.mock('../../server/configService.js', () => ({
  getConfig: (...args: any[]) => mockGetConfig(...args),
  getDefaultRateLimit: (...args: any[]) => mockGetDefaultRateLimit(...args),
  onConfigChanged: (...args: any[]) => mockOnConfigChanged(...args),
  removeConfigListener: vi.fn(),
}));

// 导入 rateLimiter
import {
  rateLimiter,
  resetRateLimiter,
  getCurrentRateLimit,
  getActiveClientCount,
  getClientRequestCount,
} from '../../server/rateLimiter.js';

// 模拟 Express 的 req/res/next
function createMockReq(userId?: string, ip?: string) {
  return {
    user: userId ? { id: userId } : undefined,
    ip: ip || '127.0.0.1',
    connection: { remoteAddress: ip || '127.0.0.1' },
    headers: {},
  };
}

function createMockRes() {
  const headers: Record<string, string> = {};
  return {
    statusCode: 200,
    status: vi.fn(function (this: any, code: number) {
      this.statusCode = code;
      return this;
    }),
    json: vi.fn(function (this: any, data: any) {
      this.body = data;
      return this;
    }),
    setHeader: vi.fn(function (this: any, key: string, value: any) {
      headers[key] = String(value);
      return this;
    }),
    getHeader: (key: string) => headers[key],
  };
}

describe('Rate Limiter - 限流中间件', () => {
  beforeEach(() => {
    resetRateLimiter();
    vi.clearAllMocks();
    mockGetConfig.mockResolvedValue(20);
    mockGetDefaultRateLimit.mockReturnValue(20);
  });

  afterEach(() => {
    resetRateLimiter();
  });

  describe('正常请求场景', () => {
    it('前19次请求应该全部通过（限制20rpm）', async () => {
      const req = createMockReq('user-1');
      const results: boolean[] = [];

      for (let i = 0; i < 19; i++) {
        const res = createMockRes();
        let calledNext = false;
        await rateLimiter(req, res, () => { calledNext = true; });
        results.push(calledNext);
      }

      // 全部应该放行
      expect(results.every(r => r === true)).toBe(true);
      expect(getClientRequestCount('user:user-1')).toBe(19);
    });

    it('第20次请求应该通过（达到限制边界值）', async () => {
      const req = createMockReq('user-2');

      for (let i = 0; i < 20; i++) {
        const res = createMockRes();
        let calledNext = false;
        await rateLimiter(req, res, () => { calledNext = true; });
        expect(calledNext).toBe(true);
      }

      expect(getClientRequestCount('user:user-2')).toBe(20);
    });
  });

  describe('超出限制场景', () => {
    it('第21次请求应该被拒绝（超出20rpm限制）', async () => {
      const req = createMockReq('user-3');

      // 先发20次正常请求
      for (let i = 0; i < 20; i++) {
        const res = createMockRes();
        await rateLimiter(req, res, () => {});
      }

      // 第21次请求应被限流
      const res = createMockRes();
      let calledNext = false;
      await rateLimiter(req, res, () => { calledNext = true; });

      expect(calledNext).toBe(false);
      expect(res.statusCode).toBe(429);
      expect(res.body).toHaveProperty('error');
      expect(res.body.error).toContain('频繁');
      expect(res.body).toHaveProperty('retryAfter');
      expect(res.body).toHaveProperty('limit', 20);
    });

    it('返回的响应头应包含限流信息', async () => {
      const req = createMockReq('user-header-test');

      // 发10次请求
      for (let i = 0; i < 10; i++) {
        const res = createMockRes();
        await rateLimiter(req, res, () => {});
      }

      // 再发一次请求，验证响应头（此时为第11次请求）
      const res = createMockRes();
      await rateLimiter(req, res, () => {});

      expect(res.getHeader('X-RateLimit-Limit')).toBeDefined();
      expect(res.getHeader('X-RateLimit-Remaining')).toBeDefined();
      expect(res.getHeader('X-RateLimit-Reset')).toBeDefined();
      expect(Number(res.getHeader('X-RateLimit-Remaining'))).toBe(9); // 20 - 11 = 9
    });
  });

  describe('不同客户端隔离', () => {
    it('不同用户的请求应该互不影响', async () => {
      const req1 = createMockReq('user-a');
      const req2 = createMockReq('user-b');

      // user-a 发20次请求
      for (let i = 0; i < 20; i++) {
        const res = createMockRes();
        await rateLimiter(req1, res, () => {});
      }

      // user-a 第21次被限流
      const res1 = createMockRes();
      let called1 = false;
      await rateLimiter(req1, res1, () => { called1 = true; });
      expect(called1).toBe(false);
      expect(res1.statusCode).toBe(429);

      // user-b 第1次请求应该正常通过
      const res2 = createMockRes();
      let called2 = false;
      await rateLimiter(req2, res2, () => { called2 = true; });
      expect(called2).toBe(true);
      expect(res2.statusCode).toBe(200);
    });

    it('未认证用户使用IP作为标识', async () => {
      const req1 = createMockReq(undefined, '192.168.1.1');
      const req2 = createMockReq(undefined, '192.168.1.2');

      // IP1 发20次请求
      for (let i = 0; i < 20; i++) {
        const res = createMockRes();
        await rateLimiter(req1, res, () => {});
      }

      // IP1 第21次被限流
      const res1 = createMockRes();
      let called1 = false;
      await rateLimiter(req1, res1, () => { called1 = true; });
      expect(called1).toBe(false);

      // IP2 正常通过
      const res2 = createMockRes();
      let called2 = false;
      await rateLimiter(req2, res2, () => { called2 = true; });
      expect(called2).toBe(true);
    });
  });

  describe('配置更新场景', () => {
    it('更新限流值后应该立即生效（从20改为50）', async () => {
      mockGetConfig.mockResolvedValue(20);

      // 触发初始化（调用一次中间件来注册监听器）
      const req = createMockReq('user-config');
      const res = createMockRes();
      await rateLimiter(req, res, () => {});

      // 验证onConfigChanged被调用
      expect(mockOnConfigChanged).toHaveBeenCalledWith(
        'model_api_rate_limit',
        expect.any(Function)
      );

      // 获取注册的回调并执行（模拟配置变更）
      const configChangeCallback = mockOnConfigChanged.mock.calls[0][1];
      configChangeCallback('50');

      // 验证currentRateLimit已更新
      expect(getCurrentRateLimit()).toBe(50);
    });

    it('无效的限流值应被忽略，保持原值', async () => {
      const req = createMockReq('user-invalid');
      const res = createMockRes();
      await rateLimiter(req, res, () => {});

      expect(mockOnConfigChanged).toHaveBeenCalled();

      const configChangeCallback = mockOnConfigChanged.mock.calls[0][1];
      const beforeValue = getCurrentRateLimit();

      // 尝试设置为无效值（负数）
      configChangeCallback('-5');

      // 限流值应保持不变
      expect(getCurrentRateLimit()).toBe(beforeValue);
    });
  });

  describe('重置功能', () => {
    it('重置后所有客户端计数应归零', async () => {
      const req = createMockReq('user-reset');

      for (let i = 0; i < 15; i++) {
        const res = createMockRes();
        await rateLimiter(req, res, () => {});
      }

      expect(getClientRequestCount('user:user-reset')).toBe(15);
      expect(getActiveClientCount()).toBe(1);

      // 重置
      resetRateLimiter();

      expect(getClientRequestCount('user:user-reset')).toBe(0);
      expect(getActiveClientCount()).toBe(0);
      expect(getCurrentRateLimit()).toBe(20); // 恢复默认值
    });
  });
});
