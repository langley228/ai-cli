// 多平台 API 發送器 (Core)：接收標準化 XML Context，派發給最適合的 AI 平台。

import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import * as crypto from 'crypto';
import { ProjectContext } from './context';
import { runMock, runOllama } from './local-adapter';

export type Platform = 'claude-code' | 'copilot-cli' | 'gemini-cli' | 'openai-codex';

export interface DispatchOptions {
  mock?: boolean;
}

export interface DispatchResult {
  platform: Platform | 'local' | 'mock';
  output: string;
}

const ENCRYPTION_KEY = crypto.scryptSync('omni-secret-salt', 'salt', 32);

function decrypt(encryptedText: string): string {
  const data = Buffer.from(encryptedText, 'base64');
  const iv = data.subarray(0, 16);
  const tag = data.subarray(16, 32);
  const encrypted = data.subarray(32);

  const decipher = crypto.createDecipheriv('aes-256-gcm', ENCRYPTION_KEY, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
}

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

export async function dispatch(
  prompt: string,
  context: ProjectContext,
  options: DispatchOptions = {}
): Promise<DispatchResult> {
  if (options.mock) {
    const result = await runMock(prompt);
    return { platform: 'mock', output: result.content };
  }

  const credentials = await getStoredCredentials();
  const platform = await selectPlatform(prompt);

  // 檢查是否有對應憑證 (簡化邏輯：目前只檢查是否存在)
  const hasCreds = credentials.some(c => c.platform.startsWith(platform.split('-')[0]));

  if (hasCreds) {
    // TODO: 真正呼叫雲端 API
    // 這裡暫時回傳 "模擬雲端回應"，因為還沒接 SDK
    return { platform, output: `[模擬 ${platform} 回應] 正在處理：${prompt.substring(0, 20)}...` };
  }

  // 降級至 Ollama
  console.log('未偵測到雲端憑證，嘗試降級至 Ollama...');
  const ollamaResult = await runOllama(`${prompt}\n\nContext:\n${context.xml}`);

  if (ollamaResult.content.startsWith('無法連接到 Ollama')) {
    const mockResult = await runMock(prompt);
    return { platform: 'mock', output: mockResult.content };
  }

  return { platform: 'local', output: ollamaResult.content };
}

