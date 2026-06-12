# 🛡️ AI CLI 工具安全護欄對照

本專案同時支援多個 AI 編碼工具（Claude Code、Gemini CLI、GitHub Copilot CLI）。
三者設定格式各異，但要落實的是**同一套安全政策**。本文件採「單一政策、多工具實作」：
政策見第 1 節，各工具如何實作見第 2–6 節。新增工具時對照第 1 節逐項補齊即可。

---

## 1. 共用政策（Single Source of Truth）

不論哪個工具，都要擋住以下三類存取。**政策不變，只有實作語法不同。**

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

---

## 2. 三工具設定對照

| 項目 | Claude Code | Gemini CLI | GitHub Copilot CLI |
|------|-------------|------------|--------------------|
| 設定檔 | `.claude/settings.json` | `.gemini/settings.json` | `.github/copilot/settings.json`（專案層；另有 `~/.copilot/settings.json`） |
| 上下文檔 | `CLAUDE.md` | `GEMINI.md` | `.github/copilot-instructions.md` |
| Hook 事件名 | `PreToolUse` | `BeforeTool` | `preToolUse`（另有 `permissionRequest`） |
| Hook 腳本位置 | `.claude/hooks/*.sh` | `.gemini/hooks/*.sh` | `.github/copilot/hooks/*.sh` |
| matcher（比對工具名） | `Read\|Edit\|Write\|Bash` | `read_file\|write_file\|replace\|run_shell_command` | `shell\|read\|view\|edit\|write` |
| 設定檔結構 | `hooks.PreToolUse[].{matcher,hooks[]}` | `hooks.BeforeTool[].{matcher,hooks[]}` | `version:1` + `hooks.preToolUse[].{matcher,bash}` |
| 專案目錄 env var | `${CLAUDE_PROJECT_DIR}` | `${GEMINI_PROJECT_DIR}` | 無；hook 由 repo 根目錄相對路徑執行 |
| 檔案宣告式 deny | `permissions.deny: Read(.env)` ✅ **硬擋** | `.geminiignore` + `fileFiltering` ⚠️ **軟性** | ⚠️ **無**持久化設定 → 靠 hook |
| 指令宣告式 deny | `permissions.deny: Bash(curl:*)` ✅ 硬擋 | `tools.exclude: run_shell_command(curl)` ✅ 硬擋 | ⚠️ 無持久化 → 啟動旗標 `--deny-tool` |
| 「詢問」層級 | `permissions.ask: Bash(git push:*)` | 無清單；shell 預設請求核可 | hook 可回 `permissionDecision:"ask"` |
| 硬封鎖主力 | PreToolUse hook | BeforeTool hook | preToolUse hook |

### 關鍵語意差異（不可 1:1 對應）
- **Gemini `.geminiignore` 是軟性**：只擋自動發現 / `@` 補全 / `read_many_files`，明確 `read_file` 仍可讀 → 真正封鎖靠 hook，`.geminiignore` 僅 defense-in-depth。
- **Copilot 無持久化 deny 設定**：`.github/copilot/settings.json` 不支援宣告式 allow/deny（僅 `--allow-tool`/`--deny-tool` 旗標與 `~/.copilot/config.json` 的 `trustedFolders`）。檔案/系統目錄全靠 hook 硬擋；egress 靠啟動旗標。
- **Copilot 可讀 `.claude/settings.json`**：官方支援把它當跨工具替代設定來源；本專案仍維持各自獨立設定以求明確。
- **詳細的「ignore 檔為何擋不住」見第 4 節。**

---

## 3. Hook 實作

三工具的 hook **核心比對邏輯完全相同**（patterns、`/dev` 白名單、`.example.env` 放行、`_authToken` 偵測），差別只在 I/O 介面。

### 設計原則
- 純 bash + grep/sed，零外部套件依賴（不需 jq）。
- **比對範圍只針對抽取出的「操作目標」**（shell 的 command、檔案工具的路徑），不拿整段 payload 去比對樣式 → 編輯「內容剛好含敏感字樣」的檔案不會被誤擋。
  （欄位抽取本身用 `field()` 掃 payload 找鍵值，與「比對範圍」是兩回事。）
- 屬「防呆層」，非 OS 硬邊界——真正硬邊界請用 sandbox。

### STDIN 取值欄位對照
| 項目 | Claude | Gemini | Copilot |
|------|--------|--------|---------|
| 工具名鍵 | `tool_name` | `tool_name` | `toolName`（camelCase） |
| 參數物件鍵 | `tool_input` | `tool_input` | `toolArgs`（camelCase） |
| shell 指令 | `command` | `command` | `command` |
| 讀檔 | `file_path` | `absolute_path` | `path` |
| 寫檔 / 編輯 | `file_path` | `file_path` | `path` |

> `field()` 會把 `command` / `file_path` / `absolute_path` / `path` 全部取出串成 `TARGET` 再比對，因此對三種工具的欄位差異天生相容。

### 阻擋輸出格式
| 工具 | deny 輸出 |
|------|-----------|
| Claude | `{"hookSpecificOutput":{"permissionDecision":"deny","permissionDecisionReason":"…"}}` |
| Gemini | `{"decision":"deny","reason":"…","systemMessage":"…"}` |
| Copilot | `{"permissionDecision":"deny","permissionDecisionReason":"…"}`（無 hookSpecificOutput 外層） |

### Copilot egress 封鎖（啟動旗標）
Copilot 無持久化指令 deny，建議啟動時帶上（或設成 alias / wrapper 固定帶入）：
```bash
copilot --deny-tool='shell(curl)' --deny-tool='shell(wget)' \
        --deny-tool='shell(dig)'  --deny-tool='shell(nslookup)'
```

---

## 4. ⚠️ ignore 檔不是安全邊界

最常見的誤解是以為放個 `.claudeignore` / `.gitignore` 就擋住了。**「從搜尋隱藏」≠「禁止讀取」**：

| ignore 檔 | 支援狀況 | 效果 |
|-----------|----------|------|
| `.claudeignore` | ❌ Claude Code 無此功能（官方文件零提及） | 死檔 |
| `.anthropicignore` | ❌ 不存在 | 死檔 |
| `.copilotignore` | ❌ 無此格式；官方 content exclusion 走網頁設定，且**不套用到 Copilot CLI** | 死檔，0 作用 |
| `.gitignore`（於 Claude Code） | Grep 跳過、Glob 預設仍找得到 | **只隱藏，直接 Read 仍讀得到** |
| `.geminiignore`（Gemini CLI） | ✅ 支援 | ⚠️ 軟性，只擋自動發現；明確 `read_file` 仍可讀 |

**真正的硬封鎖只有兩條路：**
1. 宣告式 deny（Claude `permissions.deny`；Gemini `tools.exclude`）；
2. hook（三工具皆用，本專案主力）。

`.geminiignore` 只能當軟性補強，**不可單獨依賴**；Claude / Copilot 端沒有可用的 ignore 檔。

---

## 5. 各工具檔案清單

### Claude Code
```
.claude/settings.json                      # permissions.deny/ask + PreToolUse hooks
.claude/hooks/protect-system-paths.sh      # /etc /proc /sys /boot /root + /dev 白名單
.claude/hooks/protect-sensitive-files.sh   # .env / 私鑰 / 憑證 / 金鑰庫 / _authToken
```

### Gemini CLI
```
.gemini/settings.json                      # context.fileFiltering + tools.exclude + BeforeTool hooks
.gemini/hooks/protect-system-paths.sh      # 同上邏輯，Gemini I/O
.gemini/hooks/protect-sensitive-files.sh   # 同上邏輯，Gemini I/O
.geminiignore                              # 宣告式檔案過濾（軟性補強）
```

### GitHub Copilot CLI
```
.github/copilot/settings.json              # version:1 + preToolUse hooks
.github/copilot/hooks/protect-system-paths.sh      # 同上邏輯，Copilot I/O
.github/copilot/hooks/protect-sensitive-files.sh   # 同上邏輯，Copilot I/O
.github/copilot-instructions.md            # 上下文指示檔（安全限制摘要）
```
> egress 封鎖無持久化設定，須靠啟動旗標（見第 3 節）。

---

## 6. 測試方式

每支 hook 都可用對應工具的 payload 直接灌 STDIN 驗證（輸出含 `"deny"` 即為攔截）：

```bash
# Claude 格式
printf '%s' '{"tool_name":"Read","tool_input":{"file_path":"/proj/.env"}}' \
  | bash .claude/hooks/protect-sensitive-files.sh

# Gemini 格式
printf '%s' '{"tool_name":"read_file","tool_input":{"absolute_path":"/proj/.env"}}' \
  | bash .gemini/hooks/protect-sensitive-files.sh

# Copilot 格式（camelCase toolName / toolArgs）
printf '%s' '{"toolName":"read","toolArgs":{"path":"/proj/.env"}}' \
  | bash .github/copilot/hooks/protect-sensitive-files.sh
```

必測案例：`.env`（擋）、`.example.env`（放行）、`cat .env`（擋）、`> /dev/null`（放行）、
`/etc/passwd`（擋）、`dd if=/dev/sda`（擋）、`_authToken` 寫入（擋）。
