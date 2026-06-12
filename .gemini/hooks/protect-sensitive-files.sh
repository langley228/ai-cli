#!/usr/bin/env bash
# Gemini CLI BeforeTool 保護 hook：阻擋對「敏感資料檔案」的存取。
# （Claude 版 .claude/hooks/protect-sensitive-files.sh 的 Gemini 對應版本）
#
# 與 Claude 版差異只在 I/O 介面，比對邏輯完全相同：
#   - 阻擋輸出格式為 {"decision":"deny","reason":...}。
#   - 多抓 read_file 的 absolute_path 欄位。
#   - 範本檔（.example.env）刻意放行：靠「路徑邊界」前綴，.env 前面是
#     英數（example 的 e）就不算命中。
#
# 設計原則：純 bash + grep/sed，零外部套件依賴（不需 jq）。

PAYLOAD=$(cat)

field() {
  printf '%s' "$PAYLOAD" \
    | sed -n 's/.*"'"$1"'"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p'
}

# run_shell_command -> command；read_file -> absolute_path；
# write_file / replace -> file_path；其餘相容 path。
TARGET="$(field command) $(field file_path) $(field absolute_path) $(field path)"

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
  '_authToken'                                      # npm registry 認證 token（順序無關）
  '\.pem($|[^[:alnum:]])'                           # 憑證 / 私鑰
  '\.key($|[^[:alnum:]])'                           # 私鑰
  '\.(p12|pfx|keystore|jks)($|[^[:alnum:]])'       # 金鑰庫
)
PATTERN=$(IFS='|'; echo "${PATTERNS[*]}")

if printf '%s' "$TARGET" | grep -qE "$PATTERN"; then
  cat <<'JSON'
{"decision":"deny","reason":"protect-sensitive-files hook：偵測到對敏感資料檔案（.env / 私鑰 / 憑證 / 金鑰庫 / credentials）的存取，已阻擋。","systemMessage":"🚫 已阻擋敏感檔案存取"}
JSON
fi

exit 0
