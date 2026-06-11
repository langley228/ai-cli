/**
 * 地端免 Token 防禦適配器：為個人開發者、企業隱私環境或無 Token 狀態提供降級方案。
 */

/** Ollama API 預設端點 */
export const OLLAMA_ENDPOINT = 'http://localhost:11434';

/** 地端或模擬回應的結構介面 */
export interface LocalResponse {
  /** 回應來源 */
  source: 'ollama' | 'mock';
  /** 回應文本內容 */
  content: string;
}

/**
 * 呼叫本地 Ollama 服務獲取回應
 * @param prompt 任務描述
 * @param model 使用的模型名稱，預設為 qwen2.5-coder
 * @returns 本地回應物件
 */
export async function runOllama(
  prompt: string,
  model: 'qwen2.5-coder' | 'llama3' = 'qwen2.5-coder'
): Promise<LocalResponse> {
  try {
    const response = await fetch(`${OLLAMA_ENDPOINT}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: model,
        prompt: prompt,
        stream: false,
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama 伺服器錯誤: ${response.statusText}`);
    }

    const data = (await response.json()) as { response: string };
    return { source: 'ollama', content: data.response };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { source: 'ollama', content: `無法連接到 Ollama: ${message}` };
  }
}

/**
 * 執行模擬回應 (Mock Mode)
 * @param prompt 任務描述
 * @returns 模擬的回應物件
 */
export async function runMock(prompt: string): Promise<LocalResponse> {
  return {
    source: 'mock',
    content: `[MOCK] 已收到任務：${prompt}\n(此為模擬回應，用於測試流程與打包結果)`,
  };
}
