#!/usr/bin/env bash
# PreToolUse 保護 hook：阻擋對「敏感資料檔案」的存取（讀取 / 編輯 / Bash）。
#
# 設計原則：
#   - 純 bash + grep/sed，零外部套件依賴（不需 jq / python / node）。
#   - 只比對「目標欄位」：Bash 看 command、Read/Edit 看 file_path/path。
#     不掃整段 payload，因此編輯「內容剛好含敏感字樣」的檔案不會被誤擋。
#   - 補 settings.json permissions.deny 的破口：deny 只擋 Read(.env)，
#     但 `cat .env`（Bash）會繞過；hook 看 command 才能一併擋住。
#   - 範本檔（.example.env）刻意放行：靠「路徑邊界」前綴，.env 前面是
#     英數（example 的 e）就不算命中。
#   - 這是「防呆層」，非 OS 層級邊界。真正硬邊界請用 sandbox。
#
# PreToolUse 正確格式為 hookSpecificOutput.permissionDecision，
# 不可用頂層 decision: block（會靜默失效）。

PAYLOAD=$(cat)

# 從 payload 取出某個 JSON 字串欄位的值（best-effort，不依賴 jq）
field() {
  printf '%s' "$PAYLOAD" \
    | sed -n 's/.*"'"$1"'"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p'
}

# 只看真正的操作目標：Bash 的 command、檔案工具的 file_path/path
TARGET="$(field command) $(field file_path) $(field path)"

# 敏感資料檔案。前綴 (^|[^[:alnum:]_.]) 確保是「路徑邊界」才算，
# 避免誤中 .example.env（範本）或含相同字樣的其他檔名。
PATTERNS=(
  '(^|[^[:alnum:]_.])\.env($|[^[:alnum:]])'        # .env / .env.local / .env.*（放行 .example.env）
  '(^|[^[:alnum:]_.])secrets/'                      # secrets 目錄
  '(^|[^[:alnum:]_.])\.ssh/'                        # SSH 目錄
  '(^|[^[:alnum:]_.])\.aws/'                        # AWS 憑證目錄
  '(^|[^[:alnum:]_.])id_(rsa|dsa|ecdsa|ed25519)'   # SSH 私鑰
  '(^|[^[:alnum:]_.])\.(netrc|pgpass)'             # 機器登入 / DB 密碼檔
  '(^|[^[:alnum:]_.])credentials\.json($|[^[:alnum:]])'  # 通用 credentials.json
  '_authToken'                                      # npm registry 認證 token（.npmrc 內，順序無關）
  '\.pem($|[^[:alnum:]])'                           # 憑證 / 私鑰
  '\.key($|[^[:alnum:]])'                           # 私鑰
  '\.(p12|pfx|keystore|jks)($|[^[:alnum:]])'       # 金鑰庫
)
PATTERN=$(IFS='|'; echo "${PATTERNS[*]}")

if printf '%s' "$TARGET" | grep -qE "$PATTERN"; then
  cat <<'JSON'
{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"deny","permissionDecisionReason":"protect-sensitive-files hook：偵測到對敏感資料檔案（.env / 私鑰 / 憑證 / 金鑰庫 / 憑證檔）的存取，已阻擋。"}}
JSON
fi

exit 0
