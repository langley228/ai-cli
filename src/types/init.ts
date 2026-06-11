/**
 * 偵測到的憑證結構
 */
export interface DetectedCredential {
  /** 平台名稱 */
  platform: 'github-copilot' | 'claude-code' | 'openai' | 'gemini';
  /** 設定檔來源路徑或指令 */
  source: string;
  /** 提取的金鑰值 */
  value?: string;
}

/**
 * 憑證提供者介面：統一各平台的探索邏輯
 */
export interface CredentialProvider {
  /** 平台識別碼 */
  readonly platform: DetectedCredential['platform'];
  /** 執行探索邏輯 */
  discover(): Promise<DetectedCredential | undefined>;
}
