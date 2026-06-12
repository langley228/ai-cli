# 🛡️ AI CLI 工具安全護欄對照

本專案同時支援多個 AI 編碼工具（Claude Code、Gemini CLI、GitHub Copilot CLI）。
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

| 項目 | Claude Code | Gemini CLI | GitHub Copilot CLI |
|------|-------------|------------|--------------------|
| 設定檔 | `.claude/settings.json` | `.gemini/settings.json` | `.github/copilot/settings.json`（專案層；另有 `~/.copilot/settings.json`） |
| 上下文檔 | `CLAUDE.md` | `GEMINI.md` | `.github/copilot-instructions.md` |
| Hook 事件名 | `PreToolUse` | `BeforeTool` | `preToolUse`（另有 `permissionRequest`） |
| Hook matcher 比對 | 工具名 `Read\|Edit\|Write\|Bash` | 工具名 `read_file\|write_file\|replace\|run_shell_command` | 工具名 `shell\|read\|view\|edit\|write` |
| Hook 腳本位置 | `.claude/hooks/*.sh` | `.gemini/hooks/*.sh` | `.github/copilot/hooks/*.sh` |
| 阻擋輸出格式 | `{"hookSpecificOutput":{"permissionDecision":"deny","permissionDecisionReason":"…"}}` | `{"decision":"deny","reason":"…","systemMessage":"…"}` | `{"permissionDecision":"deny","permissionDecisionReason":"…"}`（無 hookSpecificOutput 外層） |
| 設定檔結構 | `hooks.PreToolUse[].{matcher,hooks[]}` | `hooks.BeforeTool[].{matcher,hooks[]}` | `version:1` + `hooks.preToolUse[].{matcher,bash}` |
| 專案目錄 env var | `${CLAUDE_PROJECT_DIR}` | `${GEMINI_PROJECT_DIR}` | 無；hook 由 repo 根目錄相對路徑執行 |
| 檔案宣告式 deny | `permissions.deny: Read(.env)`（**硬擋**） | `.geminiignore` + `context.fileFiltering.respectGeminiIgnore`（⚠️ **軟性**，只擋自動發現） | ⚠️ **無**持久化檔案 deny 設定 → 靠 preToolUse hook |
| 指令宣告式 deny | `permissions.deny: Bash(curl:*)`（硬擋） | `tools.exclude: run_shell_command(curl)`（硬擋） | ⚠️ 無持久化 settings → 啟動旗標 `--deny-tool='shell(curl)'` 或寫進 hook |
| 「詢問」層級 | `permissions.ask: Bash(git push:*)` | 無對應；shell 預設即請求核可 | `permissionDecision: "ask"`（hook 可回傳）；預設亦會請求核可 |
| 硬封鎖主力 | PreToolUse hook | BeforeTool hook | preToolUse hook |

### 關鍵語意差異（不可 1:1 對應）
1. **Gemini 的 `.geminiignore` 不是硬擋**：只過濾自動發現 / 搜尋 / `@` 補全 / `read_many_files`；明確 `@.env` 或 `read_file` 仍可讀。因此 Gemini 端**必須靠 hook** 才能真正封鎖，`.geminiignore` 僅為 defense-in-depth。Claude 的 `permissions.deny` 則是硬擋。
2. **詢問層級**：Claude 有 `permissions.ask` 清單；Gemini 對 shell 預設就請求核可（無清單）；Copilot 的 hook 可回傳 `permissionDecision: "ask"`。三者語意不完全等價。
3. **Copilot 無持久化 deny 設定**：`.github/copilot/settings.json` 不支援宣告式 allow/deny 規則（僅 `--allow-tool`/`--deny-tool` 啟動旗標與 `~/.copilot/config.json` 的 `trustedFolders`）。因此 Copilot 端**檔案與系統目錄全靠 preToolUse hook 硬擋**；egress 指令需以啟動旗標封鎖（見下）。
4. **Copilot 可讀 `.claude/settings.json`**：官方文件指出 Copilot CLI 會把 `.claude/settings.json` 當作跨工具替代設定來源；本專案仍維持各自獨立的 `.github/copilot/` 設定以求明確。
5. **Hook I/O 不同**：核心比對邏輯（patterns / `/dev` 白名單 / `.example.env` 放行 / `_authToken`）三者**完全一致**，差別只在 STDIN 取值欄位與 deny 輸出格式（見下表）。

### Copilot egress 封鎖（啟動旗標）
Copilot 無持久化指令 deny，建議啟動時帶上：
```bash
copilot --deny-tool='shell(curl)' --deny-tool='shell(wget)' \
        --deny-tool='shell(dig)'  --deny-tool='shell(nslookup)'
```
（或設成 shell alias / wrapper 固定帶入。）

### Hook STDIN 取值欄位對照
| 工具操作 | Claude (`tool_input.*`) | Gemini (`tool_input.*`) | Copilot (`toolArgs.*`) |
|----------|-------------|-------------|-------------|
| shell 指令 | `command` | `command` | `command` |
| 讀檔 | `file_path` | `absolute_path` | `path` |
| 寫檔 / 編輯 | `file_path` | `file_path` | `path` |
| （相容）| `path` | `path` | `file_path` |
| 工具名鍵 | `tool_name` | `tool_name` | `toolName`（camelCase） |
| 參數物件鍵 | `tool_input` | `tool_input` | `toolArgs`（camelCase） |

> 三支 hook 都用同一個 `field()` 函式，把 `command` / `file_path` / `absolute_path` / `path` 全部取出串成 `TARGET` 再比對，因此對三種工具的欄位差異天生相容（`field()` 掃整段 payload 找鍵值，不依賴巢狀結構）。

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

### GitHub Copilot CLI
```
.github/copilot/settings.json              # version:1 + preToolUse hooks
.github/copilot/hooks/protect-system-paths.sh      # 同上邏輯，Copilot I/O 格式
.github/copilot/hooks/protect-sensitive-files.sh   # 同上邏輯，Copilot I/O 格式
.github/copilot-instructions.md            # 上下文指示檔（安全限制摘要）
```
> egress 指令封鎖無持久化設定，須靠啟動旗標（見第 2 節「Copilot egress 封鎖」）。

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

# Copilot 格式（camelCase toolName / toolArgs）
printf '%s' '{"toolName":"read","toolArgs":{"path":"/proj/.env"}}' \
  | bash .github/copilot/hooks/protect-sensitive-files.sh
```

必測案例：`.env`（擋）、`.example.env`（放行）、`cat .env`（擋）、`> /dev/null`（放行）、
`/etc/passwd`（擋）、`dd if=/dev/sda`（擋）、`_authToken` 寫入（擋）。
