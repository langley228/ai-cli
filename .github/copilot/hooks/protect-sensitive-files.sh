#!/usr/bin/env bash
# GitHub Copilot CLI preToolUse 保護 hook：阻擋對「敏感資料檔案」的存取。
# （Claude/Gemini 版的 Copilot 對應版本，比對邏輯完全相同，只差 I/O 介面）
#
# 與其他工具差異：
#   - STDIN 為 camelCase：toolName / toolArgs（shell→toolArgs.command、
#     檔案工具→toolArgs.path）。
#   - 阻擋輸出為 {"permissionDecision":"deny","permissionDecisionReason":…}
#     （無 hookSpecificOutput 外層）。
#   - 範本檔（.example.env）刻意放行：靠「路徑邊界」前綴不命中。
#
# 設計原則：純 bash + grep/sed，零外部套件依賴。

PAYLOAD=$(cat)

field() {
  printf '%s' "$PAYLOAD" \
    | sed -n 's/.*"'"$1"'"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p'
}

# shell -> command；read/view/edit/write -> path。
TARGET="$(field command) $(field path) $(field file_path) $(field absolute_path)"

# 敏感資料檔案。前綴 (^|[^[:alnum:]_.]) 確保是「路徑邊界」才算。
PATTERNS=(
  '(^|[^[:alnum:]_.])\.env($|[^[:alnum:]])'        # .env / .env.local / .env.*（放行 .example.env）
  '(^|[^[:alnum:]_.])secrets/'                      # secrets 目錄
  '(^|[^[:alnum:]_.])\.ssh/'                        # SSH 目錄
  '(^|[^[:alnum:]_.])\.aws/'                        # AWS 憑證目錄
  '(^|[^[:alnum:]_.])id_(rsa|dsa|ecdsa|ed25519)'   # SSH 私鑰
  '(^|[^[:alnum:]_.])\.(netrc|pgpass)'             # 機器登入 / DB 密碼檔
  '(^|[^[:alnum:]_.])credentials\.json($|[^[:alnum:]])'  # 通用 credentials.json
  '_authToken'                                      # npm registry 認證 token（順序無關）
  '\.pem($|[^[:alnum:]])'                           # 憑證 / 私鑰
  '\.key($|[^[:alnum:]])'                           # 私鑰
  '\.(p12|pfx|keystore|jks)($|[^[:alnum:]])'       # 金鑰庫
)
PATTERN=$(IFS='|'; echo "${PATTERNS[*]}")

if printf '%s' "$TARGET" | grep -qE "$PATTERN"; then
  cat <<'JSON'
{"permissionDecision":"deny","permissionDecisionReason":"protect-sensitive-files hook：偵測到對敏感資料檔案（.env / 私鑰 / 憑證 / 金鑰庫 / credentials）的存取，已阻擋。"}
JSON
fi

exit 0
