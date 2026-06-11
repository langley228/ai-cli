// 地端免 Token 防禦適配器：為個人開發者、企業隱私環境或無 Token 狀態提供降級方案。

export const OLLAMA_ENDPOINT = 'http://localhost:11434';

export interface LocalResponse {
  source: 'ollama' | 'mock';
  content: string;
}

export async function runOllama(
  prompt: string,
  model: 'qwen2.5-coder' | 'llama3' = 'qwen2.5-coder'
): Promise<LocalResponse> {
  // TODO: 呼叫 OLLAMA_ENDPOINT 取得回應
  return { source: 'ollama', content: '' };
}

export async function runMock(prompt: string): Promise<LocalResponse> {
  return { source: 'mock', content: `[MOCK] 已收到任務：${prompt}` };
}
