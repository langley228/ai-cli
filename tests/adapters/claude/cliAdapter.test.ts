import { describe, it, expect, vi, beforeEach } from 'vitest';
import { spawnSync } from 'child_process';
import { cliAdapter } from '../../../src/adapters/claude/cliAdapter';

vi.mock('child_process');

const ctx = { tree: '', xml: '<xml/>' };

describe('cliAdapter 模組', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('狀態碼為 0 時應回傳 stdout', async () => {
    vi.mocked(spawnSync).mockReturnValue({ status: 0, stdout: 'ok output', stderr: '' } as any);

    const out = await cliAdapter.generate('hello', ctx, 'key');

    expect(out).toBe('ok output');
  });

  it('應移除觸發關鍵字前綴並帶入 --model 參數', async () => {
    vi.mocked(spawnSync).mockReturnValue({ status: 0, stdout: 'x', stderr: '' } as any);

    await cliAdapter.generate('claude 幫我寫測試', ctx, 'key', 'claude-haiku-4-5');

    const [cmd, args] = vi.mocked(spawnSync).mock.calls[0] as [string, string[], unknown];
    expect(cmd).toBe('claude');
    expect(args).toContain('幫我寫測試');
    expect(args).not.toContain('claude 幫我寫測試');
    expect(args).toContain('--model');
    expect(args).toContain('claude-haiku-4-5');
  });

  it('應從環境變數移除 ANTHROPIC_API_KEY 以保留 CLI 自身登入', async () => {
    vi.mocked(spawnSync).mockReturnValue({ status: 0, stdout: 'x', stderr: '' } as any);

    await cliAdapter.generate('hi', ctx, 'key');

    const opts = vi.mocked(spawnSync).mock.calls[0][2] as { env: Record<string, string> };
    expect(opts.env).not.toHaveProperty('ANTHROPIC_API_KEY');
  });

  it('狀態碼非零時應丟出錯誤並包含 stderr 內容', async () => {
    vi.mocked(spawnSync).mockReturnValue({ status: 1, stdout: '', stderr: 'Invalid API key' } as any);

    await expect(cliAdapter.generate('hi', ctx, 'key')).rejects.toThrow('Invalid API key');
  });
});
