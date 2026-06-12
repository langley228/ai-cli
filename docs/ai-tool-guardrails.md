# 🛡️ AI CLI 工具安全護欄對照

本專案同時支援多個 AI 編碼工具（Claude Code、Gemini CLI，**之後會再加入 GitHub Copilot**）。
三者各有不同的設定格式，但要落實的是**同一套安全政策**。本文件是「單一政策、多工具實作」的對照表，
新增工具時請對照「共用政策」逐列補上對應實作。

---

## 1. 共用政策（Single Source of Truth）

不論哪個工具，都要擋住以下三類存取。**政策內容不變，只有實作語法不同。**

### A. 敏感資料檔案（讀 / 寫 / 編輯 / shell 一律擋）
| 類別 | 樣式 | 備註 |
|------|------|------|
| 環境變數金鑰 | `.env`、`.env.*` | **放行範本 `.example.env`**（檔名不符，邊界寫法不命中） |
| 機密目錄 | `secrets/` | |
| SSH | `.ssh/`、`id_rsa`/`id_dsa`/`id_ecdsa`/`id_ed25519` | |
| 雲端 / 登入憑證 | `.aws/`、`.netrc`、`.pgpass`、`credentials.json` | |
| 憑證 / 私鑰 / 金鑰庫 | `*.pem`、`*.key`、`*.p12`、`*.pfx`、`*.keystore`、`*.jks` | |
| npm token | 字串 `_authToken` | 順序無關，避免 `.npmrc` token 外洩 |

### B. 系統檔案目錄（一律擋）
`/etc`、`/proc`、`/sys`、`/boot`、`/root`
- `/dev/`：**白名單放行**常見偽裝置 `null`、`zero`、`full`、`random`、`urandom`、`tty*`、`pts/N`、`stdin`/`stdout`/`stderr`、`fd/N`（如 `cmd > /dev/null`）；其餘（原始磁碟 `/dev/sda`、`/dev/mem`）才擋。

### C. 外洩管道指令（egress，擋 agent 端執行）
`curl`、`wget`、`dig`、`nslookup`

> 共用設計原則：純 bash + grep/sed，零外部套件依賴（不需 jq）。只比對「操作目標欄位」
> （shell 看 command、檔案工具看路徑欄位），不掃整段 payload。屬「防呆層」，非 OS 硬邊界——
> 真正硬邊界請用 sandbox。

---

## 2. 三工具對照

| 項目 | Claude Code | Gemini CLI | GitHub Copilot ⏳ 待補 |
|------|-------------|------------|------------------------|
| 設定檔 | `.claude/settings.json` | `.gemini/settings.json` | _待研究_ |
| 上下文檔 | `CLAUDE.md` | `GEMINI.md` | _待研究_（`.github/copilot-instructions.md`?）|
| Hook 事件名 | `PreToolUse` | `BeforeTool` | _待研究（是否有 hook 機制）_ |
| Hook matcher 比對 | 工具名 `Read\|Edit\|Write\|Bash` | 工具名 `read_file\|write_file\|replace\|run_shell_command` | _待研究_ |
| Hook 腳本位置 | `.claude/hooks/*.sh` | `.gemini/hooks/*.sh` | _待研究_ |
| 阻擋輸出格式 | `{"hookSpecificOutput":{"permissionDecision":"deny","permissionDecisionReason":"…"}}` | `{"decision":"deny","reason":"…","systemMessage":"…"}` | _待研究_ |
| 專案目錄 env var | `${CLAUDE_PROJECT_DIR}` | `${GEMINI_PROJECT_DIR}` | _待研究_ |
| 檔案宣告式 deny | `permissions.deny: Read(.env)`（**硬擋**） | `.geminiignore` + `context.fileFiltering.respectGeminiIgnore`（⚠️ **軟性**，只擋自動發現） | _待研究_ |
| 指令宣告式 deny | `permissions.deny: Bash(curl:*)`（硬擋） | `tools.exclude: run_shell_command(curl)`（硬擋） | _待研究_ |
| 「詢問」層級 | `permissions.ask: Bash(git push:*)` | 無對應；shell 預設即請求核可 | _待研究_ |
| 硬封鎖主力 | PreToolUse hook | BeforeTool hook | _待研究_ |

### 關鍵語意差異（不可 1:1 對應）
1. **Gemini 的 `.geminiignore` 不是硬擋**：只過濾自動發現 / 搜尋 / `@` 補全 / `read_many_files`；明確 `@.env` 或 `read_file` 仍可讀。因此 Gemini 端**必須靠 hook** 才能真正封鎖，`.geminiignore` 僅為 defense-in-depth。Claude 的 `permissions.deny` 則是硬擋。
2. **Gemini 無「ask 詢問清單」**：Claude 的 `git push` / `rm -rf` 走 `ask`；Gemini 對 shell 指令預設就會請求核可，若要硬擋 `rm -rf` 需放進 `tools.exclude`（語意從「詢問」變「禁止」）。
3. **Hook I/O 不同**：邏輯（patterns / `/dev` 白名單 / `.example.env` 放行 / `_authToken`）兩邊**完全一致**，差別只在 STDIN 取值欄位與 deny 輸出格式。

### Hook STDIN 取值欄位對照
| 工具操作 | Claude 欄位 | Gemini 欄位 |
|----------|-------------|-------------|
| shell 指令 | `tool_input.command` | `tool_input.command` |
| 讀檔 | `tool_input.file_path` | `tool_input.absolute_path` |
| 寫檔 / 編輯 | `tool_input.file_path` | `tool_input.file_path` |
| （相容）| `tool_input.path` | `tool_input.path` |

> 兩支 hook 都用同一個 `field()` 函式，把 `command` / `file_path` / `absolute_path` / `path` 全部取出串成 `TARGET` 再比對，因此對兩種工具的欄位差異天生相容。

---

## 3. 各工具檔案清單

### Claude Code
```
.claude/settings.json                      # permissions.deny/ask + PreToolUse hooks
.claude/hooks/protect-system-paths.sh      # /etc /proc /sys /boot /root + /dev 白名單
.claude/hooks/protect-sensitive-files.sh   # .env / 私鑰 / 憑證 / 金鑰庫 / _authToken
```

### Gemini CLI
```
.gemini/settings.json                      # context.fileFiltering + tools.exclude + BeforeTool hooks
.gemini/hooks/protect-system-paths.sh      # 同上邏輯，Gemini I/O 格式
.gemini/hooks/protect-sensitive-files.sh   # 同上邏輯，Gemini I/O 格式
.geminiignore                              # 宣告式檔案過濾（軟性補強層）
```

### GitHub Copilot ⏳ 待補
新增時請先釐清以下問題，再對照「共用政策」逐項落地（對應第 2 節每一列）：
- [ ] 設定檔位置與格式（JSON？`.github/` 下？`~/.config/`？）
- [ ] 是否有 hook / pre-tool 攔截機制；若有，事件名、matcher、輸入/輸出格式為何
- [ ] 是否有宣告式工具/指令 allow/deny（類似 `tools.exclude`）
- [ ] 是否有檔案排除機制（類似 `.geminiignore` / `.aiexclude`），是硬擋還是軟性
- [ ] coding agent 的網路 allowlist / firewall（egress 控制）設定方式
- [ ] 上下文指示檔名（`.github/copilot-instructions.md`？）
- [ ] 專案目錄 / 環境變數慣例

---

## 4. 測試方式

每支 hook 都可用對應工具的 payload 直接灌 STDIN 驗證（輸出含 `"deny"` 即為攔截）：

```bash
# Claude 格式
printf '%s' '{"tool_name":"Read","tool_input":{"file_path":"/proj/.env"}}' \
  | bash .claude/hooks/protect-sensitive-files.sh

# Gemini 格式
printf '%s' '{"tool_name":"read_file","tool_input":{"absolute_path":"/proj/.env"}}' \
  | bash .gemini/hooks/protect-sensitive-files.sh
```

必測案例：`.env`（擋）、`.example.env`（放行）、`cat .env`（擋）、`> /dev/null`（放行）、
`/etc/passwd`（擋）、`dd if=/dev/sda`（擋）、`_authToken` 寫入（擋）。
