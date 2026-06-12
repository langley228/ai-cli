import { describe, it, expect, vi, afterEach } from 'vitest';
import { generateKey, showKeyGeneration } from '../src/keygen';

describe('keygen 模組', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('generateKey', () => {
    it('應產生 64 字元的 hex 字串 (32 bytes)', () => {
      expect(generateKey()).toMatch(/^[0-9a-f]{64}$/);
    });

    it('每次產生的金鑰應不同', () => {
      expect(generateKey()).not.toBe(generateKey());
    });
  });

  describe('showKeyGeneration', () => {
    it('應輸出含 OMNI_MASTER_KEY 的提示與金鑰', () => {
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      showKeyGeneration();

      const output = logSpy.mock.calls.flat().join(' ');
      expect(output).toContain('OMNI_MASTER_KEY');
      expect(output).toMatch(/[0-9a-f]{64}/);
    });
  });
});
