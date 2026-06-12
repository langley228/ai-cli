# 🏗️ ai-cli 架構總覽

## 模組職責
- **`cli.ts`**: 入口點，負責命令解析 (Commander) 與 UI 呈現 (Chalk)。
- **`init.ts`**: 初始化模組，負責協調各平台的專屬偵測器，並進行 AES-256 加密存儲。
- **`context.ts`**: 上下文引擎，負責遞迴掃描專案目錄並將其轉譯為 XML/CDATA 結構。
- **`core.ts`**: 分發核心，負責語義化平台/適配器/模型挑選與多級降級策略；Gemini、OpenAI 目前在此以各自官方 SDK 直接呼叫。
- **`adapters/claude/`**: Claude 專屬適配器。`cliAdapter` 封裝官方 `claude` CLI；`sdkAdapter` 基於 **Vercel AI SDK (`@ai-sdk/anthropic`)**（串接施工中）。
- **`security.ts` / `keygen.ts` / `config.ts`**: 主金鑰衍生、金鑰產生與憑證檢視工具。
- **`local-adapter.ts`**: 地端適配器，負責與 Ollama 通訊或提供 Mock 回應。

## 資料流向
1. 使用者輸入指令 ➔ `cli.ts`
2. `cli.ts` 呼叫 `context.ts` 打包專案 ➔ 生成 XML
3. `cli.ts` 呼叫 `core.ts` 進行任務分發
4. `core.ts` 檢查憑證並決定路由：
   - 有雲端憑證 ➔ Claude 走 `adapters/claude`（CLI 或 SDK）；Gemini / OpenAI 以官方 SDK 直接呼叫
   - 無雲端憑證 ➔ `local-adapter.ts` ➔ Ollama
   - 無 Ollama ➔ `local-adapter.ts` ➔ Mock
5. 結果回傳至 `cli.ts` 顯示給使用者。
