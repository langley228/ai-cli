/**
 * 設定管理模組：提供憑證檢視與設定檢查功能。
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import * as crypto from 'crypto';
import chalk from 'chalk';

const ENCRYPTION_KEY = crypto.scryptSync('omni-secret-salt', 'salt', 32);

/**
 * 解密 Base64 編碼的加密文本
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
 * 讀取並列出所有已儲存的憑證平台
 */
export async function listCredentials(): Promise<void> {
  try {
    const configPath = path.join(os.homedir(), '.omni/config.json');
    const content = await fs.readFile(configPath, 'utf-8');
    const { data } = JSON.parse(content);
    const decrypted = decrypt(data);
    const credentials = JSON.parse(decrypted);

    console.log(chalk.bold.cyan('\n📋 目前已偵測並加密儲存的憑證：'));
    if (credentials.length === 0) {
      console.log(chalk.yellow('   無已儲存的憑證。'));
    } else {
      credentials.forEach((c: { platform: string, source: string }) => {
        console.log(chalk.green(`   ✔ ${c.platform.padEnd(20)} (來源: ${c.source})`));
      });
    }
    console.log('');
  } catch (error) {
    console.error(chalk.red('\n❌ 無法讀取或解密設定檔，請嘗試重新執行 `init`。'));
  }
}
