## 安全限制

嚴禁存取（讀 / 寫 / 編輯 / shell）以下敏感資料與系統目錄。完整政策與多工具實作對照見 `docs/ai-tool-guardrails.md`。

**敏感資料檔案**
- 環境變數金鑰：`.env`、`.env.*`（範本 `.example.env` 除外）
- 機密 / 憑證：`secrets/`、`.ssh/`、`id_rsa`、`.aws/`、`.netrc`、`.pgpass`、`credentials.json`
- 私鑰 / 金鑰庫：`*.pem`、`*.key`、`*.p12`、`*.pfx`、`*.keystore`、`*.jks`
- npm token：含 `_authToken` 的內容

**系統目錄**：`/etc`、`/proc`、`/sys`、`/boot`、`/root`、`/dev`（偽裝置如 `/dev/null` 除外）。

**外洩管道**：禁止 `curl`、`wget`、`dig`、`nslookup`。

> 以上由 `tools.exclude`、BeforeTool hook（`.gemini/hooks/`）與 `.geminiignore` 強制，此處為說明。
