/** 地端或模擬回應的結構介面 */
export interface LocalResponse {
  /** 回應來源 */
  source: 'ollama' | 'mock';
  /** 回應文本內容 */
  content: string;
}
