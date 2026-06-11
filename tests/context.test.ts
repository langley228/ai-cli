import { describe, it, expect, vi } from 'vitest';
import { buildContext } from '../src/context';
import * as fs from 'fs/promises';

vi.mock('fs/promises');

describe('context 模組', () => {
  it('應該能正確生成 XML 結構', async () => {
    // 模擬 readdir
    vi.mocked(fs.readdir).mockResolvedValue(['test.ts'] as any);
    // 模擬 stat
    vi.mocked(fs.stat).mockResolvedValue({ isDirectory: () => false } as any);
    // 模擬 readFile
    vi.mocked(fs.readFile).mockResolvedValue('console.log("hello");');

    const result = await buildContext('/fake/root');

    expect(result.tree).toContain('test.ts');
    expect(result.xml).toContain('<project_context>');
    expect(result.xml).toContain('<![CDATA[');
    expect(result.xml).toContain('console.log("hello");');
  });
});
