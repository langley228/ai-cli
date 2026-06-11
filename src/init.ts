/**
 * 一刀流智慧初始化模組：自動掃描、提取並確認全平台 AI 憑證，完成高強度加密儲存。
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import * as crypto from 'crypto';
import chalk from 'chalk';
import { DetectedCredential } from './types/init';

/**
 * 獲取預設的官方設定檔路徑清單
 * @returns 平台與路徑的對應物件
 */
function getConfigPaths() {
  const home = os.homedir();
  return {
    'github-copilot': path.join(home, '.config/gh/hosts.yml'),
    'claude-code': path.join(home, '.config/claude-code/config.json'),
    'openai': path.join(home, '.config/openai.json'),
    'gemini': path.join(home, '.config/gcloud/application_default_credentials.json'),
  };
}

/** 加密使用的金鑰 (應從環境變數或安全存儲獲取，此處為示範) */
const ENCRYPTION_KEY = crypto.scryptSync('omni-secret-salt', 'salt', 32);
const IV_LENGTH = 16;

/**
 * 使用 AES-256-GCM 加密字串
 * @param text 待加密文本
 * @returns Base64 編碼的加密結果 (包含 IV + Tag + Ciphertext)
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
 * @returns 偵測到的憑證列表
 */
export async function detectCredentials(): Promise<DetectedCredential[]> {
  const detected: DetectedCredential[] = [];
  const configPaths = getConfigPaths();

  for (const [platform, configPath] of Object.entries(configPaths)) {
    try {
      await fs.access(configPath);
      // 模擬提取邏輯：實際開發時應根據各平台格式解析檔案
      detected.push({
        platform: platform as DetectedCredential['platform'],
        source: configPath,
        value: `extracted-key-from-${platform}`,
      });
      console.log(chalk.blue(`偵測到 ${platform} 設定檔：${configPath}`));
    } catch {
      // 檔案不存在則跳過
    }
  }

  return detected;
}

/**
 * 將憑證加密並儲存至使用者目錄
 * @param credentials 待儲存的憑證
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
    console.log(chalk.yellow('未偵測到任何現有 AI 憑證。'));
  } else {
    console.log(chalk.green(`成功偵測到 ${credentials.length} 個平台憑證。`));
  }
  await encryptAndStore(credentials);
}
