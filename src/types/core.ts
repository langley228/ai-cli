import { ProjectContext } from './context';

/** 支援的 AI 平台類型 */
export type Platform = 'claude-code' | 'copilot-cli' | 'gemini-cli' | 'openai-codex';

/** 派發選項介面 */
export interface DispatchOptions {
  /** 是否強制使用 Mock 模式 */
  mock?: boolean;
  /** 選擇使用的適配器類型 */
  adapterType?: 'sdk' | 'cli';
  /** 指定使用的模型名稱 */
  model?: string;
}

/** 派發結果介面 */
export interface DispatchResult {
  /** 最終執行的平台或來源 */
  platform: Platform | 'local' | 'mock';
  /** AI 回傳的內容 */
  output: string;
}
