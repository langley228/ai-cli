// 多平台 API 發送器 (Core)：接收標準化 XML Context，派發給最適合的 AI 平台。

import { ProjectContext } from './context';
import { runMock } from './local-adapter';

export type Platform = 'claude-code' | 'copilot-cli' | 'gemini-cli' | 'openai-codex';

export interface DispatchOptions {
  mock?: boolean;
}

export interface DispatchResult {
  platform: Platform | 'local';
  output: string;
}

export async function selectPlatform(prompt: string): Promise<Platform> {
  // TODO: 依任務類型挑選最適合的平台
  // - claude-code: 深度架構重構
  // - copilot-cli: Git/PR 整合
  // - gemini-cli: 長文本平行分析
  // - openai-codex: 多任務自動測試
  return 'claude-code';
}

export async function dispatch(
  prompt: string,
  context: ProjectContext,
  options: DispatchOptions = {}
): Promise<DispatchResult> {
  if (options.mock) {
    const result = await runMock(prompt);
    return { platform: 'local', output: result.content };
  }

  const platform = await selectPlatform(prompt);

  // TODO: 呼叫對應平台 API，傳入 context.xml
  return { platform, output: '' };
}
