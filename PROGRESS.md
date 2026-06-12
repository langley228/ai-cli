# 📈 ai-cli 專案進度與後續規劃 (PROGRESS.md)

本文件用於追蹤 `ai-cli` (omni) 專案的開發進度、已完成里程碑以及未來的迭代計畫。

---

## 🏗️ 當前版本：v0.1.0 (原型驗證階段) - 🟢 100% 已完成

核心調度馬具架構已建立，驗證了從專案打包、憑證偵測到多級降級的完整流程。

- [x] **基礎架構建立**: Typescript 環境、Vitest 測試框架配置。
- [x] **通用上下文沙盒**: 遞迴掃描專案並包裝為 XML/CDATA 格式。
- [x] **一刀流初始化**: 自動偵測 `gh`, `claude`, `gcloud` 等工具憑證。
- [x] **安全性增強**: 使用 AES-256-GCM 加密存儲敏感 API Key。
- [x] **核心調度引擎**: 具備語義化平台挑選與「雲端 -> 地端 (Ollama) -> Mock」降級鏈。
- [x] **開發規範文件**: 完成架構、安全、Git、Coding Style、測試等 5 份核心文件。
- [x] **GEMINI.md**: 建立 AI 代理作業的最高行動綱領。

---

## 🚀 下一階段：v0.2.0 (實戰整合階段) - 🟡 進行中

目標是讓工具具備真正的生產力，整合官方 SDK 並強化憑證解析。

### 1. 憑證解析強化 (Credentials Parsing)
- [x] 實作各平台的專屬處理器 (Platform-specific handlers)。
- [x] 降級策略實作：環境變數 → 設定檔的依序解析（四平台皆已支援）。
- [ ] 接入各官方 CLI 工具：目前僅 GitHub Copilot 接入 `gh auth token`；Claude / OpenAI / Gemini 尚未接入官方 CLI。

### 2. 雲端 SDK 整合 (Cloud Integration)
- [x] 導入 Vercel AI SDK (`@ai-sdk/anthropic`) 作為 Claude SDK 適配器的通訊層。
- [ ] 將適配器重構至統一介面：Claude 已收斂至 `AiAdapter`（cli / sdk）；Gemini、OpenAI 仍在 `core.ts` 以官方 SDK 直接呼叫，待遷移。
- [ ] 完成 Claude `sdkAdapter` 串接（目前為未實作狀態，呼叫即丟出錯誤，見技術債）。
- [ ] 實作流式輸出 (Streaming) 支援 (v0.2.0 後續優化)。

### 3. 地端防禦優化
- [ ] 支援更多 Ollama 模型配置與自動下載檢查。
- [ ] 實作流式輸出 (Streaming)，提升終端機等待體驗。

### 4. 品質工程 (Quality Engineering)
- [x] 擴充單元測試：security、keygen、config、Claude cliAdapter / sdkAdapter，並補強 core 分支（共 9 檔 27 測試）。
- [x] `tests/` 結構鏡像 `src/`（含 `tests/adapters/claude/`）。
- [x] 文件對齊程式碼：更新 README 與 `docs/`（憑證路徑、模組規格、CLI 選項、技術債標註）。
- [ ] 接上覆蓋率門檻（核心模組 90%）與 CI 自動化檢查。

---

## ⚠️ 已知問題 / 技術債 (Known Issues & Tech Debt)

- **Claude `sdkAdapter` 未串接**：`src/adapters/claude/sdkAdapter.ts` 在實際呼叫前即 `throw`，其下 `generateText` 為無法執行的死碼。`--adapterType sdk` 目前不可用。
- **scrypt 使用固定 salt**：`src/security.ts` 以固定字串 `'salt'` 衍生金鑰，相同密碼會得到相同金鑰，應改為隨機 salt 並隨設定檔儲存。
- **`decrypt` 邏輯重複**：`core.ts` 與 `config.ts` 各有一份相同實作，宜抽至 `security.ts` 共用。
- **DEBUG log 殘留**：`cli.ts`、`cliAdapter.ts` 有未加 dev guard 的除錯輸出（含 `OMNI_MASTER_KEY` 存在與否），正式版前須清除。
- **命名混用**：套件名為 `ai-cli`，但設定目錄與環境變數仍沿用 `omni`（`.omni/config.json`、`OMNI_MASTER_KEY`）。

---

## 🎨 中期規劃：v0.3.0 (體驗優化階段) - ⚪ 待啟動

提升開發者體驗 (DX) 與互動性。

- [ ] **互動式 UI**: 使用 `inquirer` 或 `enquirer` 引導使用者輸入缺失憑證。
- [ ] **設定管理**: 支援 `omni config` 查看與修改當前使用的模型與降級行為。
- [ ] **CI/CD 自動化**: 建立 GitHub Actions，確保每次提交皆通過測試與 Build。
- [ ] **效能優化**: 實作增量掃描 (Incremental Scan)，避免大型專案重複打包。

---

## 🌟 長期願景：v1.0.0 (企業級馬具) - ⚪ 遠期目標

- [ ] **外掛系統**: 支援自定義適配器，讓開發者自行接入私有模型。
- [ ] **多語言支援**: CLI 輸出與文件全面支援國際化 (i18n)。
- [ ] **安全性稽核**: 通過第三方安全稽核，確保憑證加密萬無一失。
- [ ] **社群生態**: 發佈至 npm，建立開源社群貢獻機制。

---

## 📅 更新日誌 (Changelog)

- **2026-06-11**: 專案啟動，完成 v0.1.0 核心開發、開發規範建立及 GEMINI.md 指令集。
- **2026-06-12**: 整合 Claude SDK / CLI 適配器與安全性金鑰管理；擴充單元測試並使 `tests/` 鏡像 `src/`；對齊 README 與 `docs/` 文件，新增技術債追蹤。
