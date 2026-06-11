import { describe, it, expect, vi, beforeEach } from 'vitest';
import { selectPlatform, dispatch } from '../src/core';
import * as fs from 'fs/promises';
import * as os from 'os';
import { runOllama, runMock } from '../src/local-adapter';

vi.mock('fs/promises');
vi.mock('os');
vi.mock('../src/local-adapter');

describe('core 模組', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(os.homedir).mockReturnValue('/fake/home');
  });

  describe('selectPlatform', () => {
    it('應該根據關鍵字挑選正確平台', async () => {
      expect(await selectPlatform('幫我重構這段程式碼')).toBe('claude-code');
      expect(await selectPlatform('幫我提交 git commit')).toBe('copilot-cli');
      expect(await selectPlatform('分析這份長文件')).toBe('gemini-cli');
      expect(await selectPlatform('寫個測試案例')).toBe('openai-codex');
    });
  });

  describe('dispatch', () => {
    const mockContext = { tree: '', xml: '<xml></xml>' };

    it('應該在 mock 選項開啟時回傳 mock 結果', async () => {
      vi.mocked(runMock).mockResolvedValue({ source: 'mock', content: 'mocked output' });

      const result = await dispatch('test prompt', mockContext, { mock: true });

      expect(result.platform).toBe('mock');
      expect(result.output).toBe('mocked output');
    });

    it('在無憑證時應該嘗試降級至 Ollama', async () => {
      // 模擬讀取設定檔失敗 (無憑證)
      vi.mocked(fs.readFile).mockRejectedValue(new Error('File not found'));
      vi.mocked(runOllama).mockResolvedValue({ source: 'ollama', content: 'ollama output' });

      const result = await dispatch('test prompt', mockContext);

      expect(result.platform).toBe('local');
      expect(result.output).toBe('ollama output');
    });
  });
});
