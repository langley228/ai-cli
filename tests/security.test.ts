import { describe, it, expect, vi, afterEach } from 'vitest';
import { getMasterKey } from '../src/security';

describe('security 模組', () => {
  const original = process.env.OMNI_MASTER_KEY;
  afterEach(() => {
    if (original === undefined) delete process.env.OMNI_MASTER_KEY;
    else process.env.OMNI_MASTER_KEY = original;
    vi.restoreAllMocks();
  });

  it('設定 OMNI_MASTER_KEY 時應回傳 32 bytes 的金鑰', () => {
    process.env.OMNI_MASTER_KEY = 'test-key';
    const key = getMasterKey();
    expect(Buffer.isBuffer(key)).toBe(true);
    expect(key.length).toBe(32);
  });

  it('相同密碼應產生相同金鑰 (deterministic)', () => {
    process.env.OMNI_MASTER_KEY = 'same-password';
    expect(getMasterKey().equals(getMasterKey())).toBe(true);
  });

  it('缺少 OMNI_MASTER_KEY 時應呼叫 process.exit(1)', () => {
    delete process.env.OMNI_MASTER_KEY;
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const exitSpy = vi
      .spyOn(process, 'exit')
      .mockImplementation((() => {
        throw new Error('process.exit called');
      }) as any);

    expect(() => getMasterKey()).toThrow('process.exit called');
    expect(exitSpy).toHaveBeenCalledWith(1);
  });
});
