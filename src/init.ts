/**
 * 一刀流智慧初始化模組：協調各平台的專屬偵測器，並進行 AES-256-GCM 加密儲存。
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import * as crypto from 'crypto';
import { exec } from 'child_process';
import { promisify } from 'util';
import chalk from 'chalk';
import { DetectedCredential } from './types/init';

const execAsync = promisify(exec);
export const utils = { execAsync };

/** 加密使用的金鑰 */
const ENCRYPTION_KEY = crypto.scryptSync('omni-secret-salt', 'salt', 32);
const IV_LENGTH = 16;

/**
 * 偵測 GitHub Copilot 憑證
 */
async function detectGitHubCopilot(): Promise<string | undefined> {
  // 1. CLI
  try {
    const { stdout } = await utils.execAsync('gh auth token');
    return stdout.trim();
  } catch (e) {
    // 忽略 CLI 失敗，靜默處理
  }
  // 2. ENV
  if (process.env.GH_TOKEN || process.env.GITHUB_TOKEN) return process.env.GH_TOKEN || process.env.GITHUB_TOKEN;
  // 3. File
  try {
    const content = await fs.readFile(path.join(os.homedir(), '.config/gh/hosts.yml'), 'utf-8');
    const match = content.match(/oauth_token:\s*(\S+)/);
    return match ? match[1] : undefined;
  } catch { return undefined; }
}

/**
 * 偵測 Claude Code 憑證
 */
async function detectClaudeCode(): Promise<string | undefined> {
  // 1. ENV
  if (process.env.ANTHROPIC_API_KEY) return process.env.ANTHROPIC_API_KEY;
  // 2. File: settings.json
  try {
    const content = await fs.readFile(path.join(os.homedir(), '.claude/settings.json'), 'utf-8');
    const json = JSON.parse(content);
    if (json.env?.ANTHROPIC_API_KEY || json.apiKey) return json.env?.ANTHROPIC_API_KEY || json.apiKey;
  } catch { /* ignore */ }
  // 3. File: .credentials.json (Linux/OAuth)
  try {
    const content = await fs.readFile(path.join(os.homedir(), '.claude/.credentials.json'), 'utf-8');
    const json = JSON.parse(content);
    // 修正: 解析嵌套的 claudeAiOauth 結構
    return json.claudeAiOauth?.accessToken || json.sessionToken || json.apiKey;
  } catch { return undefined; }
}

/**
 * 偵測 OpenAI 憑證
 */
async function detectOpenAI(): Promise<string | undefined> {
  // 1. ENV
  if (process.env.OPENAI_API_KEY) return process.env.OPENAI_API_KEY;
  // 2. File
  try {
    const content = await fs.readFile(path.join(os.homedir(), '.openai/config.json'), 'utf-8');
    const json = JSON.parse(content);
    return json.apiKey;
  } catch { return undefined; }
}

/**
 * 偵測 Gemini 憑證
 */
async function detectGemini(): Promise<string | undefined> {
  // 1. ENV
  if (process.env.GEMINI_API_KEY) return process.env.GEMINI_API_KEY;
  // 2. ADC File
  try {
    const content = await fs.readFile(path.join(os.homedir(), '.config/gcloud/application_default_credentials.json'), 'utf-8');
    const json = JSON.parse(content);
    return json.client_id; // 簡易 ADC 識別
  } catch { return undefined; }
}

/**
 * 使用 AES-256-GCM 加密字串
 */
function encrypt(text: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-gcm', ENCRYPTION_KEY, iv);
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString('base64');
}

/**
 * 自動偵測本地已存在的 AI 平台憑證
 */
export async function detectCredentials(): Promise<DetectedCredential[]> {
  const handlers: { platform: DetectedCredential['platform'], detector: () => Promise<string | undefined> }[] = [
    { platform: 'github-copilot', detector: detectGitHubCopilot },
    { platform: 'claude-code', detector: detectClaudeCode },
    { platform: 'openai', detector: detectOpenAI },
    { platform: 'gemini', detector: detectGemini },
  ];

  const detected: DetectedCredential[] = [];
  for (const { platform, detector } of handlers) {
    const value = await detector();
    if (value) {
      detected.push({ platform, source: 'auto-detected', value });
      console.log(chalk.blue(`偵測到 ${platform} 憑證。`));
    }
  }
  return detected;
}

/**
 * 將憑證加密並儲存至使用者目錄
 */
export async function encryptAndStore(credentials: DetectedCredential[]): Promise<void> {
  try {
    const configDir = path.join(os.homedir(), '.omni');
    await fs.mkdir(configDir, { recursive: true });
    const configPath = path.join(configDir, 'config.json');
    
    const data = JSON.stringify(credentials);
    const encryptedData = encrypt(data);
    
    await fs.writeFile(configPath, JSON.stringify({ data: encryptedData }, null, 2));
    console.log(chalk.gray(`設定檔已加密儲存於：${configPath}`));
  } catch (error) {
    console.error(chalk.red('儲存設定檔失敗:'), error);
  }
}

/**
 * 執行初始化流程
 */
export async function runInit(): Promise<void> {
  const credentials = await detectCredentials();
  if (credentials.length === 0) {
    console.log(chalk.yellow('未偵測到任何現有 AI 憑證，已跳過加密儲存。'));
    return;
  }
  
  console.log(chalk.green(`成功偵測到 ${credentials.length} 個平台憑證。`));
  await encryptAndStore(credentials);
}
