import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sdkAdapter } from '../../../src/adapters/claude/sdkAdapter';

const ctx = { tree: '', xml: '<xml/>' };

describe('sdkAdapter 模組', () => {
  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  // 註：sdkAdapter 目前刻意在串接完成前丟出未實作錯誤；
  // 待 Vercel AI SDK 串接完成後，這個測試應更新為驗證實際回應。
  it('目前尚未完成串接，呼叫時應丟出未實作錯誤', async () => {
    await expect(sdkAdapter.generate('hi', ctx, 'sk-ant-api-xxx')).rejects.toThrow('尚未完成串接');
  });

  it('OAuth token 路徑也應丟出相同的未實作錯誤', async () => {
    await expect(sdkAdapter.generate('hi', ctx, 'sk-ant-oat-xxx')).rejects.toThrow('尚未完成串接');
  });
});
