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
* **一刀流自動偵測機制**：依「官方 CLI → 環境變數 → 設定檔」順序，自動偵測 GitHub Copilot、Claude Code、OpenAI、Gemini 四大平台憑證。各平台完整偵測來源與優先序請見 [憑證偵測規範](docs/credential-discovery.md)。
* **超優體驗 (UX)**：若電腦已登入過上述官方工具，`ai-cli init` 會**秒速自動抓取並加密綁定**，3 秒內即可完成 AES-256-GCM 加密儲存。

### 2. 通用上下文沙盒 (`src/context.ts`)
* **核心職責**：將複雜的本地專案目錄結構，轉譯為 AI 可高效讀取的結構化文本。
* **優化機制**：
  * **智慧過濾**：內建黑名單（如 `node_modules`、`.git`、編譯產物），避免無效檔案消耗 Token。
  * **動態樹狀圖**：遞迴掃描目錄，自動生成專案的視覺化樹狀圖（Tree Directory）。
  * **XML CDATA 封裝**：使用標準 `<project_context>` 標籤包裹原始碼。透過 `<![CDATA[ ... ]]>` 保護程式碼，防止程式碼中的特殊符號（如 `<`、`>`）干擾 AI 解析。

### 3. 地端免 Token 防禦適配器 (`src/local-adapter.ts`)
* **核心職責**：為個人開發者、企業隱私環境或無 Token 狀態提供完美的降級方案。
* **核心機制**：
  * **地端開源 AI 模式 (Ollama)**：在沒有雲端 API Key 的情況下，套件會自動降級路由至本地 Ollama 服務，體驗完全不斷線。
  * **沙盒測試模式 (Mock)**：以 `--mock` 進入虛擬模擬狀態，供本地 Debug 或 CI/CD 自動化管線測試使用。
* 端點、可用模型與完整三級降級鏈詳見 [地端適配與降級機制](docs/fallback.md)。

### 4. CLI 主進入點封裝 (`src/cli.ts`)
* **核心職責**：使用 `commander` 封裝全局指令，整合 Chalk 提供彩色的終端機互動 UI。

### 5. 多平台分發核心 (`src/core.ts`)
* **核心職責**：依任務關鍵字語義化挑選平台、適配器與模型，並執行「雲端 → 地端 Ollama → Mock」三級降級。
* **路由邏輯**：
  * `claude` / `重構` / `架構` ➔ Claude Code（預設 CLI 適配器，`claude-sdk` 則走 SDK）。
  * `git` / `pr` / `commit` ➔ Copilot CLI；`分析` / `analyze` ➔ Gemini CLI。
  * 任務含 `haiku` / `sonnet` / `opus` 會自動對應 `claude-haiku-4-5` / `claude-sonnet-4-6` / `claude-opus-4-8`。
  * Gemini、OpenAI 目前以各自官方 SDK（`@google/generative-ai`、`openai`）直接呼叫。

### 6. Claude 適配器 (`src/adapters/claude/`)
* **cliAdapter**：以 `-p`（print）非互動模式封裝官方 `claude` CLI，並移除 `ANTHROPIC_API_KEY` 以沿用 CLI 自身的 OAuth 登入憑證。
* **sdkAdapter**：基於 Vercel AI SDK（`@ai-sdk/anthropic`）封裝，支援 API Key（`x-api-key`）與 OAuth token（`Bearer`）兩種驗證。**目前串接施工中。**

### 7. 安全與金鑰工具 (`src/security.ts` / `src/keygen.ts` / `src/config.ts`)
* **`security.ts`**：以 `OMNI_MASTER_KEY` 透過 `scrypt` 衍生 32 bytes 主金鑰，供加解密使用。
* **`keygen.ts`**：`keygen` 指令產生高強度隨機主金鑰。
* **`config.ts`**：`config` 指令解密並列出目前已加密儲存的平台憑證。

---

## 💻 終端機指令（CLI）使用規範

### 系統初始化與安全性設定
ai-cli 使用 AES-256-GCM 對憑證進行加密儲存，確保安全性。

1. **生成安全性金鑰 (Master Key)**:
   ```bash
   node dist/cli.js keygen
   ```
   這會生成一個高強度的 `OMNI_MASTER_KEY`。

2. **設定環境變數**:
   複製範本檔為 `.env.local`（此檔案已列入 `.gitignore`，不會被提交）：
   ```bash
   cp .example.env .env.local
   ```
   接著填入 `OMNI_MASTER_KEY`（必須）與 `ANTHROPIC_API_KEY`（僅 Claude SDK 模式需要）。ai-cli 啟動時會優先讀取根目錄下的 `.env.local`。

3. **初始化憑證偵測**:
   ```bash
   node dist/cli.js init
   ```

4. **檢視儲存狀態**:
   ```bash
   node dist/cli.js config
   ```

### 自動打包與智慧調度
```bash
ai-cli "幫我檢查這個專案有沒有潛在的記憶體洩漏風險"
```
*套件將自動掃描並打包當前 codebase，轉譯為 XML 上下文，派發給最適合的 AI 進行分析。*

### 可用選項 (Options)
| 選項 | 說明 |
|------|------|
| `--mock` | 強制進入 Mock 測試模式，跳過雲端與地端模型。 |
| `--adapterType <sdk\|cli>` | 指定 Claude 使用的適配器類型（預設 `cli`）。 |
| `--model <model>` | 指定使用的模型名稱（如 `claude-opus-4-8`）。 |

### 強制進入 Mock 測試模式
```bash
ai-cli "重構此非同步邏輯" --mock
```
*跳過雲端與地端模型，強制使用本地虛擬沙盒模擬 CLI 完整打包與對話流程。*

### 指定適配器與模型
```bash
ai-cli "重構 src/core.ts" --adapterType sdk --model claude-opus-4-8
```

---

## 🚀 快速上手

```bash
npm install
npm run build
```

編譯完成後，依照上方〈終端機指令（CLI）使用規範〉生成金鑰、初始化憑證並執行任務即可。

---

## 📚 技術文件

詳細的架構說明與開發規範請參閱 `docs/` 目錄：
- [架構總覽 (Architecture)](docs/architecture.md)
- [安全與加密規範 (Security)](docs/security.md)
- [憑證偵測與發現規範 (Credential Discovery)](docs/credential-discovery.md)
- [地端適配與降級機制 (Local & Fallback)](docs/fallback.md)
- [Git 分支與 Commit 規範 (Git Standards)](docs/git-standards.md)
- [Coding Style 與開發規範 (Coding Style)](docs/coding-style.md)
- [單元測試規範 (Testing Standards)](docs/testing-standards.md)

---

## 📅 開發進度追蹤

v0.1.0 原型驗證階段的核心模組已全數完成，v0.2.0 實戰整合階段進行中。

完整的版本里程碑、後續規劃與已知技術債，請參閱 [`PROGRESS.md`](PROGRESS.md)。