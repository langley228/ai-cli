# 🗝️ 憑證偵測與發現規範 (Credential Discovery)

為了確保 `ai-cli` 能準確且安全地提取各平台的 AI 憑證，本專案採用 **「平台專屬處理器 (Platform-specific handlers)」** 機制。

---

## 1. 核心原則

- **平台獨立性**: 每個 AI 平台的憑證偵測邏輯完全隔離，互不干擾。
- **一致性優先級 (Detection Order)**: 以下為各平台偵測的目標優先順序：
  1. **官方 CLI 工具** (最高優先級): 利用平台官方工具獲取當前有效的 Token (如 `gh auth token`)。
  2. **環境變數 (Environment Variables)**: 支援 CI/CD 與開發環境的快速覆蓋。
  3. **設定檔解析 (Config File)**: 若上述皆無，才解析本地設定檔。

> **目前實作狀態**：僅 **GitHub Copilot** 具備官方 CLI 偵測（`gh auth token`）；**Claude Code / OpenAI / Gemini** 目前為「環境變數 → 設定檔」，尚未接入各自的官方 CLI（屬 v0.2.0 規劃中的降級策略強化項目）。

### 各平台偵測來源（依序）

| 平台 | 來源 1 | 來源 2 | 來源 3 |
|------|--------|--------|--------|
| GitHub Copilot | `gh auth token` | `GH_TOKEN` / `GITHUB_TOKEN` | `~/.config/gh/hosts.yml` |
| Claude Code | `ANTHROPIC_API_KEY` | `~/.claude/settings.json` | `~/.claude/.credentials.json` |
| OpenAI | `OPENAI_API_KEY` | `~/.openai/config.json` | `~/.codex/auth.json` |
| Gemini | `GEMINI_API_KEY` / `GOOGLE_API_KEY` | `~/.gemini/oauth_creds.json` | Google Cloud ADC |

---

## 2. 實作架構 (Implementation)

在 `src/init.ts` 中，每種平台對應一個獨立的偵測函式：

```typescript
// 範例邏輯
async function detectPlatformX(): Promise<string | undefined> {
  // 1. 嘗試 CLI
  // 2. 嘗試 ENV
  // 3. 嘗試 File
}
```

這樣的結構確保了：
- **可讀性**: 偵測邏輯透明，易於除錯。
- **可擴充性**: 新增平台僅需實作對應函式，無需調整現有架構。

---

## 3. 擴充規範

開發者在新增支援平台時，請務必遵循以下規範：
1. 在 `src/init.ts` 中新增該平台的 `detectX` 函式。
2. 確保該函式回傳 `Promise<string | undefined>`。
3. 若需要解析 YAML/JSON，請確保解析後的字串不包含額外的換行符 (使用 `.trim()`)。
