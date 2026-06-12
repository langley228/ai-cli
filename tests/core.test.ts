import { describe, it, expect, vi, beforeEach } from 'vitest';
import { selectPlatformAndAdapter, dispatch } from '../src/core';
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

  describe('selectPlatformAndAdapter', () => {
    it('應該根據關鍵字挑選正確平台', async () => {
      expect((await selectPlatformAndAdapter('幫我重構這段程式碼')).platform).toBe('claude-code');
      expect((await selectPlatformAndAdapter('幫我提交 git commit')).platform).toBe('copilot-cli');
      expect((await selectPlatformAndAdapter('分析這份長文件')).platform).toBe('gemini-cli');
      expect((await selectPlatformAndAdapter('寫個測試案例')).platform).toBe('openai-codex');
    });

    it('應該從關鍵字偵測 Claude 模型名稱', async () => {
      expect((await selectPlatformAndAdapter('用 opus 重構架構')).model).toBe('claude-opus-4-8');
      expect((await selectPlatformAndAdapter('用 sonnet 重構')).model).toBe('claude-sonnet-4-6');
      expect((await selectPlatformAndAdapter('用 haiku 重構')).model).toBe('claude-haiku-4-5');
    });

    it('應該從關鍵字偵測適配器類型 (sdk / cli)', async () => {
      const sdk = await selectPlatformAndAdapter('claude-sdk 幫我寫');
      expect(sdk.platform).toBe('claude-code');
      expect(sdk.adapterType).toBe('sdk');

      const cli = await selectPlatformAndAdapter('claude-cli 幫我寫');
      expect(cli.platform).toBe('claude-code');
      expect(cli.adapterType).toBe('cli');
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

    it('Ollama 無法連線時應再降級至 mock', async () => {
      vi.mocked(fs.readFile).mockRejectedValue(new Error('File not found'));
      vi.mocked(runOllama).mockResolvedValue({ source: 'ollama', content: '無法連接到 Ollama: ECONNREFUSED' });
      vi.mocked(runMock).mockResolvedValue({ source: 'mock', content: 'mock fallback' });

      const result = await dispatch('test prompt', mockContext);

      expect(result.platform).toBe('mock');
      expect(result.output).toBe('mock fallback');
    });
  });
});
