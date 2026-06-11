# 🛡️ 地端適配與降級機制

## Ollama 適配
- **預設 Endpoint**: `http://localhost:11434`
- **預設模型**: `qwen2.5-coder` (針對程式碼優化)
- **備選模型**: `llama3`
- **通訊方式**: 使用 Node.js 原生 `fetch` 呼叫 `/api/generate` 接口。

## 降級邏輯 (The Fallback Chain)
當 `core.ts` 執行 `dispatch` 時，會依照以下順序嘗試獲取回應：
1. **Cloud Service**: 檢查 `~/.omni/config.json` 是否有對應平台的憑證。
2. **Local Ollama**: 若無雲端憑證，嘗試連線本地 Ollama 服務。
3. **Mock Mode**: 若 Ollama 無法連線，回傳預設的 Mock 資訊，確保程式不崩潰並給予使用者提示。

## 擴充規範
若要新增地端模型支援，請在 `local-adapter.ts` 中新增對應的適配函數，並在 `LocalResponse` 介面中擴充 source 類型。
