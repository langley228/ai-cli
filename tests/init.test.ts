import { describe, it, expect, vi, beforeEach } from 'vitest';
import { detectCredentials, encryptAndStore } from '../src/init';
import * as fs from 'fs/promises';
import * as os from 'os';

vi.mock('fs/promises');
vi.mock('os');

describe('init 模組', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(os.homedir).mockReturnValue('/fake/home');
    
    // 預設模擬 fs.access 失敗
    vi.mocked(fs.access).mockRejectedValue(new Error('File not found'));
  });

  it('應該能偵測到各平台存在的設定檔', async () => {
    // 模擬特定路徑成功
    vi.mocked(fs.access).mockImplementation(async (filePath: any) => {
      const p = filePath.toString();
      if (
        p.includes('hosts.yml') || 
        p.includes('claude/settings.json') || 
        p.includes('auth.json') ||
        p.includes('gemini/settings.json')
      ) {
        return undefined;
      }
      throw new Error('File not found');
    });

    // 模擬 fs.readFile
    vi.mocked(fs.readFile).mockResolvedValue('oauth_token: key123');

    const creds = await detectCredentials();
    
    // 驗證是否偵測到四個平台
    expect(creds.length).toBe(4);
    const platforms = creds.map(c => c.platform);
    expect(platforms).toContain('github-copilot');
    expect(platforms).toContain('claude-code');
    expect(platforms).toContain('openai');
    expect(platforms).toContain('gemini');
  });

  it('應該能將憑證加密並儲存', async () => {
    const mockCreds: any[] = [{ platform: 'openai', value: 'key123' }];
    const mkdirSpy = vi.mocked(fs.mkdir).mockResolvedValue(undefined as any);
    const writeFileSpy = vi.mocked(fs.writeFile).mockResolvedValue(undefined as any);

    await encryptAndStore(mockCreds);

    expect(mkdirSpy).toHaveBeenCalledWith(expect.stringContaining('.omni'), { recursive: true });
    expect(writeFileSpy).toHaveBeenCalled();
    
    const callArgs = writeFileSpy.mock.calls[0];
    const writtenContent = JSON.parse(callArgs[1] as string);
    expect(writtenContent).toHaveProperty('data');
  });
});
