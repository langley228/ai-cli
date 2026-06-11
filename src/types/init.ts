/**
 * 偵測到的憑證結構
 */
export interface DetectedCredential {
  /** 平台名稱 */
  platform: 'github-copilot' | 'claude-code' | 'openai' | 'gemini';
  /** 設定檔來源路徑 */
  source: string;
  /** 提取的金鑰值 */
  value?: string;
}
