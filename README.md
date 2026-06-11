# 🤖 ai-cli 開發者技術文件

ai-cli 是一款專為終端機（Terminal）設計的**開源 AI 代理調度馬具（AI CLI Harness）**。它旨在解決開發者面臨的「AI 工具鏈碎片化」痛點。透過統一的上下文沙盒、全平台一刀流憑證偵測與智慧降級引擎，ai-cli 向上封裝各大 AI 平台能力，向下提供統一、極簡的 CLI 開發體驗。

---

## 📌 技術架構總覽

```
        [ 終端機使用者 / CI/CD 流程 ]
                     │
                     ▼
┌──────────────────────────────┐
│        ai-cli CLI 核心         │
└──────────────────────────────┘
                     │
   ┌─────────────────┼─────────────────┐
   ▼                  ▼                  ▼
┌───────────────┐ ┌───────────────┐ ┌───────────────┐
│ 一刀流智慧偵測 │ │ 通用上下文沙盒 │ │ 地端防禦適配器 │
│  (src/init)    │ │ (src/context)  │ │ (local-adapt)  │
└───────────────┘ └───────────────┘ └───────────────┘
   │                  │                  │
   └─────────────────┼─────────────────┘
                     │ (標準化 XML Context)
                     ▼
┌──────────────────────────────┐
│     多平台 API 發送器 (Core)    │
└──────────────────────────────┘
                     │
   ┌──────────────┬──────┴──────┬──────────────┐
   ▼               ▼             ▼               ▼
[Claude Code]   [Copilot CLI] [Gemini CLI]   [OpenAI Codex]
(深度架構重構)   (Git/PR 整合) (長文本平行分析) (多任務自動測試)
```

---

## 🛠️ 核心模組技術規格

### 1. 一刀流智慧初始化模組 (`src/init.ts`)
* **核心職責**：自動掃描、提取並確認全平台 AI 憑證，完成高強度加密儲存。
* **一刀流自動偵測機制**：
  * **GitHub Copilot**：自動讀取 GitHub CLI 的 `~/.config/gh/hosts.yml` 憑證。
  * **Claude Code**：自動自 Anthropic 官方 `~/.config/claude-code/config.json` 提取 API Key。
  * **OpenAI / Gemini**：主動掃描 `~/.config/openai.json` 及 Google Cloud 的預設憑證路徑。
* **超優體驗 (UX)**：若電腦已登入過上述官方工具，`omni init` 會**秒速自動抓取並預先勾選**，使用者盲按 `Enter` 鍵即可在 3 秒內完成 AES-256-GCM 加密綁定。

### 2. 通用上下文沙盒 (`src/context.ts`)
* **核心職責**：將複雜的本地專案目錄結構，轉譯為 AI 可高效讀取的結構化文本。
* **優化機制**：
  * **智慧過濾**：內建黑名單（如 `node_modules`、`.git`、編譯產物），避免無效檔案消耗 Token。
  * **動態樹狀圖**：遞迴掃描目錄，自動生成專案的視覺化樹狀圖（Tree Directory）。
  * **XML CDATA 封裝**：使用標準 `<project_context>` 標籤包裹原始碼。透過 `<![CDATA[ ... ]]>` 保護程式碼，防止程式碼中的特殊符號（如 `<`、`>`）干擾 AI 解析。

### 3. 地端免 Token 防禦適配器 (`src/local-adapter.ts`)
* **核心職責**：為個人開發者、企業隱私環境或無 Token 狀態提供完美的降級方案。
* **核心機制**：
  * **地端開源 AI 模式 (Ollama)**：在沒有雲端 API Key 的情況下，套件會自動降級路由至本地 `http://localhost:11434`（支援 `qwen2.5-coder` 或 `llama3`），體驗完全不斷線。
  * **沙盒測試模式 (Mock)**：支援手動輸入 `mock` 作為憑證，進入虛擬模擬狀態，供本地 Debug 或 CI/CD 自動化管線測試使用。

### 4. CLI 主進入點封裝 (`src/cli.ts`)
* **核心職責**：使用 `commander` 封裝全局指令，整合 Chalk 提供彩色的終端機互動 UI。

---

## 💻 終端機指令（CLI）使用規範

### 系統智慧初始化
```bash
omni init
```
*啟動一刀流藍牙智慧偵測，自動掃描全平台既有憑證並加密儲存。*

### 自動打包與智慧調度
```bash
omni "幫我檢查這個專案有沒有潛在的記憶體洩漏風險"
```
*套件將自動掃描並打包當前 codebase，轉譯為 XML 上下文，派發給最適合的 AI 進行分析。*

### 強制進入 Mock 測試模式
```bash
omni "重構此非同步邏輯" --mock
```
*跳過雲端與地端模型，強制使用本地虛擬沙盒模擬 CLI 完整打包與對話流程。*

---

## 🚀 快速上手

### 1. 安裝與編譯
```bash
npm install
npm run build
```

### 2. 初始化憑證 (一刀流偵測)
```bash
node dist/cli.js init
```

### 3. 執行任務
```bash
# 自動挑選最適合的 AI
node dist/cli.js "幫我重構 src/core.ts"

# 強制使用 Mock 模式進行測試
node dist/cli.js "檢查記憶體洩漏" --mock
```

---

## 📚 技術文件

詳細的架構說明與開發規範請參閱 `docs/` 目錄：
- [架構總覽 (Architecture)](docs/architecture.md)
- [安全與加密規範 (Security)](docs/security.md)
- [地端適配與降級機制 (Local & Fallback)](docs/fallback.md)
- [Git 分支與 Commit 規範 (Git Standards)](docs/git-standards.md)
- [Coding Style 與開發規範 (Coding Style)](docs/coding-style.md)

---

## 📅 開發進度追蹤 (100% 完工)

- [x] **一刀流智慧初始化模組** (全平台官方憑證自動提取、智慧預勾選、AES-256 加密)
- [x] **通用上下文沙盒** (標準化 XML CDATA 代碼庫打包技術)
- [x] **地端防禦適配器** (Ollama / Mock 零 Token 開源降級機制)
- [x] **CLI 主進入點封裝** (使用 Commander 實現全域指令掛載與 Chalk 彩色輸出)