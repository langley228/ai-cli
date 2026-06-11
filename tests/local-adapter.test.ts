import { describe, it, expect, vi, beforeEach } from 'vitest';
import { runOllama, runMock, OLLAMA_ENDPOINT } from '../src/local-adapter';

describe('local-adapter 模組', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  describe('runOllama', () => {
    it('應該正確呼叫 Ollama API 並回傳結果', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ response: 'hi from ollama' }),
      });
      vi.stubGlobal('fetch', mockFetch);

      const result = await runOllama('hello');

      expect(mockFetch).toHaveBeenCalledWith(
        `${OLLAMA_ENDPOINT}/api/generate`,
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('"prompt":"hello"'),
        })
      );
      expect(result.source).toBe('ollama');
      expect(result.content).toBe('hi from ollama');
    });

    it('呼叫失敗時應該回傳錯誤訊息', async () => {
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network Error')));

      const result = await runOllama('hello');

      expect(result.content).toContain('無法連接到 Ollama');
    });
  });

  describe('runMock', () => {
    it('應該回傳包含 prompt 的模擬訊息', async () => {
      const result = await runMock('test task');
      expect(result.source).toBe('mock');
      expect(result.content).toContain('test task');
    });
  });
});
