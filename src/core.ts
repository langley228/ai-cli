/**
 * 多平台 API 發送器 (Core)：接收標準化 XML Context，派發給最適合的 AI 平台。
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import * as crypto from 'crypto';
import { ProjectContext } from './types/context';
import { Platform, DispatchOptions, DispatchResult } from './types/core';
import { runMock, runOllama } from './local-adapter';

/** 加密使用的金鑰 (必須與 init.ts 一致) */
const ENCRYPTION_KEY = crypto.scryptSync('omni-secret-salt', 'salt', 32);

/**
 * 解密 Base64 編碼的加密文本
 * @param encryptedText 包含 IV + Tag + Ciphertext 的字串
 * @returns 解密後的原始文本
 */
function decrypt(encryptedText: string): string {
  const data = Buffer.from(encryptedText, 'base64');
  const iv = data.subarray(0, 16);
  const tag = data.subarray(16, 32);
  const encrypted = data.subarray(32);

  const decipher = crypto.createDecipheriv('aes-256-gcm', ENCRYPTION_KEY, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
}

/**
 * 根據任務描述語義化挑選最適合的平台
 * @param prompt 任務描述
 * @returns 建議的平台名稱
 */
export async function selectPlatform(prompt: string): Promise<Platform> {
  const p = prompt.toLowerCase();
  if (p.includes('重構') || p.includes('refactor') || p.includes('架構')) {
    return 'claude-code';
  }
  if (p.includes('git') || p.includes('pr') || p.includes('commit')) {
    return 'copilot-cli';
  }
  if (p.includes('分析') || p.includes('analyze') || p.includes('long')) {
    return 'gemini-cli';
  }
  return 'openai-codex';
}

/**
 * 讀取並解密儲存在本地的憑證
 * @returns 憑證陣列
 */
async function getStoredCredentials(): Promise<any[]> {
  try {
    const configPath = path.join(os.homedir(), '.omni/config.json');
    const content = await fs.readFile(configPath, 'utf-8');
    const { data } = JSON.parse(content);
    const decrypted = decrypt(data);
    return JSON.parse(decrypted);
  } catch {
    return [];
  }
}

/**
 * 將任務派發至 AI 平台，包含多級降級策略
 * @param prompt 任務描述
 * @param context 專案上下文
 * @param options 額外選項
 * @returns 派發執行結果
 */
export async function dispatch(
  prompt: string,
  context: ProjectContext,
  options: DispatchOptions = {}
): Promise<DispatchResult> {
  // 1. 檢查是否強制 Mock
  if (options.mock) {
    const result = await runMock(prompt);
    return { platform: 'mock', output: result.content };
  }

  // 2. 挑選平台並檢查憑證
  const credentials = await getStoredCredentials();
  const platform = await selectPlatform(prompt);
  
  // 簡易憑證匹配邏輯
  const hasCreds = credentials.some((c) => c.platform.startsWith(platform.split('-')[0]));

  if (hasCreds) {
    // TODO: 串接實際平台 SDK (如 @anthropic-ai/sdk)
    return {
      platform,
      output: `[模擬 ${platform} 回應] 專案打包大小: ${context.xml.length} bytes。正在處理任務: ${prompt}`,
    };
  }

  // 3. 降級至本地 Ollama
  console.log('未偵測到雲端憑證，嘗試降級至 Ollama...');
  const ollamaResult = await runOllama(`${prompt}\n\nContext:\n${context.xml}`);
  
  if (ollamaResult.content.startsWith('無法連接到 Ollama')) {
    // 4. 最後降級至 Mock
    const mockResult = await runMock(prompt);
    return { platform: 'mock', output: mockResult.content };
  }

  return { platform: 'local', output: ollamaResult.content };
}
