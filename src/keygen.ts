/**
 * 金鑰管理工具：提供安全性金鑰生成功能。
 */

import * as crypto from 'crypto';
import chalk from 'chalk';

/**
 * 生成一個高強度的隨機金鑰，用於 OMNI_MASTER_KEY
 */
export function generateKey(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * 顯示生成的金鑰並提示使用者設定
 */
export function showKeyGeneration(): void {
  const key = generateKey();
  console.log(chalk.bold.yellow('\n🔑 已生成新的主金鑰 (OMNI_MASTER_KEY)：'));
  console.log(chalk.white(`\n   ${key}\n`));
  console.log(chalk.cyan('請將此金鑰複製並設定至您的 .env.local 檔案中：'));
  console.log(chalk.white(`   OMNI_MASTER_KEY=${key}\n`));
}
