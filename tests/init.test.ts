import { describe, it, expect, vi, beforeEach } from 'vitest';
import { detectCredentials, encryptAndStore } from '../src/init';
import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';

vi.mock('fs/promises');
vi.mock('os');

describe('init 模組', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(os.homedir).mockReturnValue('/fake/home');
  });

  it('應該能偵測到存在的設定檔', async () => {
    // 模擬 fs.access 成功 (檔案存在)
    vi.mocked(fs.access).mockResolvedValue(undefined);
    // 模擬 fs.readFile
    vi.mocked(fs.readFile).mockResolvedValue('fake content');

    const creds = await detectCredentials();
    
    // 應該偵測到 CONFIG_PATHS 中的四個平台
    expect(creds.length).toBe(4);
    expect(creds[0].platform).toBe('github-copilot');
  });

  it('應該能將憑證加密並儲存', async () => {
    const mockCreds: any[] = [{ platform: 'openai', value: 'key123' }];
    const mkdirSpy = vi.mocked(fs.mkdir).mockResolvedValue(undefined as any);
    const writeFileSpy = vi.mocked(fs.writeFile).mockResolvedValue(undefined as any);

    await encryptAndStore(mockCreds);

    expect(mkdirSpy).toHaveBeenCalledWith(expect.stringContaining('.omni'), { recursive: true });
    expect(writeFileSpy).toHaveBeenCalled();
    
    // 檢查寫入的內容是否包含 'data' 欄位 (加密後的 JSON)
    const callArgs = writeFileSpy.mock.calls[0];
    const writtenContent = JSON.parse(callArgs[1] as string);
    expect(writtenContent).toHaveProperty('data');
  });
});
