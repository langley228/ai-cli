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
  });

  it('應該能偵測到存在的設定檔', async () => {
    // 模擬 fs.access
    vi.mocked(fs.access).mockImplementation(async (filePath: any) => {
      // console.log('Checking path:', filePath);
      const p = filePath.toString();
      if (
        p.includes('hosts.yml') || 
        p.includes('settings.json') || 
        p.includes('auth.json') ||
        p.includes('application_default_credentials.json')
      ) {
        return undefined;
      }
      throw new Error('File not found');
    });

    // 模擬 fs.readFile
    vi.mocked(fs.readFile).mockImplementation(async (filePath: any) => {
      const p = filePath.toString();
      if (p.endsWith('.json')) {
        return JSON.stringify({ oauth_token: 'key123' });
      }
      return 'oauth_token: key123';
    });

    const creds = await detectCredentials();
    
    // 應該偵測到四個平台 (github-copilot, claude-code, openai, gemini)
    expect(creds.length).toBe(4);
    expect(creds[0].platform).toBe('github-copilot');
    expect(creds[1].platform).toBe('claude-code');
    expect(creds[2].platform).toBe('openai');
    expect(creds[3].platform).toBe('gemini');
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
