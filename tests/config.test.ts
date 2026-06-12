import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fs from 'fs/promises';
import * as os from 'os';
import * as crypto from 'crypto';
import { listCredentials } from '../src/config';
import { getMasterKey } from '../src/security';

vi.mock('fs/promises');
vi.mock('os');

/** 以與 init.ts 相同的格式 (IV + Tag + Ciphertext) 加密，供解密路徑測試使用 */
function encrypt(text: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', getMasterKey(), iv);
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString('base64');
}

describe('config 模組', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(os.homedir).mockReturnValue('/fake/home');
    process.env.OMNI_MASTER_KEY = 'test-master-key';
  });

  it('應正確解密並列出已儲存的平台與來源', async () => {
    const creds = [
      { platform: 'openai', source: 'auto-detected', value: 'k1' },
      { platform: 'claude-code', source: 'auto-detected', value: 'k2' },
    ];
    const payload = JSON.stringify({ data: encrypt(JSON.stringify(creds)) });
    vi.mocked(fs.readFile).mockResolvedValue(payload);
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    await listCredentials();

    const output = logSpy.mock.calls.flat().join(' ');
    expect(output).toContain('openai');
    expect(output).toContain('claude-code');
    expect(output).toContain('auto-detected');
  });

  it('憑證為空陣列時應提示無已儲存憑證', async () => {
    const payload = JSON.stringify({ data: encrypt(JSON.stringify([])) });
    vi.mocked(fs.readFile).mockResolvedValue(payload);
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    await listCredentials();

    const output = logSpy.mock.calls.flat().join(' ');
    expect(output).toContain('無已儲存的憑證');
  });

  it('讀取或解密失敗時應印出錯誤提示', async () => {
    vi.mocked(fs.readFile).mockRejectedValue(new Error('no file'));
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await listCredentials();

    expect(errSpy).toHaveBeenCalled();
  });
});
