import { describe, it, expect, vi, beforeEach } from 'vitest';
import { detectCredentials, encryptAndStore, utils } from '../src/init';
import * as fs from 'fs/promises';
import * as os from 'os';

vi.mock('fs/promises');
vi.mock('os');

describe('init 模組', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(os.homedir).mockReturnValue('/fake/home');
    process.env.OMNI_MASTER_KEY = 'test-master-key';
  });

  it('應該能偵測到各平台存在的設定檔', async () => {
    // 0. 模擬 fs.access 成功
    vi.mocked(fs.access).mockResolvedValue(undefined);

    // 1. 模擬 GitHub CLI 成功
    vi.spyOn(utils, 'execAsync').mockResolvedValue({ stdout: 'github-token-123', stderr: '' });

    // 2. 模擬 Claude, OpenAI, Gemini 設定檔讀取
    vi.mocked(fs.readFile).mockImplementation(async (filePath: any) => {
      const p = filePath.toString();
      if (p.includes('.claude/settings.json')) return JSON.stringify({ env: { ANTHROPIC_API_KEY: 'claude-key' } });
      if (p.includes('.openai/config.json')) return JSON.stringify({ apiKey: 'openai-key' });
      if (p.includes('application_default_credentials.json')) return JSON.stringify({ client_id: 'gemini-id' });
      return ''; // fallback for gh hosts.yml
    });

    const creds = await detectCredentials();
    
    // 驗證四個平台全數偵測到
    expect(creds.length).toBe(4);
    const platforms = creds.map(c => c.platform);
    expect(platforms).toContain('github-copilot');
    expect(platforms).toContain('claude-code');
    expect(platforms).toContain('openai');
    expect(platforms).toContain('gemini');
  });

  it('應該能將憑證加密並儲存', async () => {
    const mockCreds: any[] = [{ platform: 'openai', value: 'key123' }];
    vi.mocked(fs.mkdir).mockResolvedValue(undefined);
    vi.mocked(fs.writeFile).mockResolvedValue(undefined);

    await encryptAndStore(mockCreds);

    expect(fs.mkdir).toHaveBeenCalled();
    expect(fs.writeFile).toHaveBeenCalled();
  });
});
