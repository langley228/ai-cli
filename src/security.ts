/**
 * 安全配置模組：管理敏感憑證的加解密金鑰。
 */
import * as crypto from 'crypto';
import chalk from 'chalk';

/**
 * 取得主金鑰，若不存在則提示使用者設定
 */
export function getMasterKey(): Buffer {
  const masterKey = process.env.OMNI_MASTER_KEY;
  if (!masterKey) {
    console.error(chalk.red('\n❌ 錯誤: 缺少環境變數 OMNI_MASTER_KEY'));
    console.error(chalk.yellow('   請設定 OMNI_MASTER_KEY 以啟用憑證加解密功能：'));
    console.error(chalk.white('   export OMNI_MASTER_KEY="您的強密碼或金鑰"'));
    process.exit(1);
  }
  // 使用 scrypt 將密碼轉換為 32 位元金鑰
  return crypto.scryptSync(masterKey, 'salt', 32);
}
