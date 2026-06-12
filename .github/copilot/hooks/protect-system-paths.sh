#!/usr/bin/env bash
# GitHub Copilot CLI preToolUse 保護 hook：阻擋對「系統檔案目錄」的存取。
# （Claude/Gemini 版的 Copilot 對應版本，比對邏輯完全相同，只差 I/O 介面）
#
# 與其他工具差異：
#   - STDIN 為 camelCase：toolName / toolArgs（shell→toolArgs.command、
#     檔案工具→toolArgs.path）。
#   - 阻擋輸出為 {"permissionDecision":"deny","permissionDecisionReason":…}
#     （像 Claude 但「無」hookSpecificOutput 外層）。
#
# 設計原則：純 bash + grep/sed，零外部套件依賴。屬「防呆層」，非 OS 硬邊界。

PAYLOAD=$(cat)

# 從 payload 取出某個 JSON 字串欄位的值（best-effort，不依賴 jq）
field() {
  printf '%s' "$PAYLOAD" \
    | sed -n 's/.*"'"$1"'"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p'
}

# 只看真正的操作目標：shell -> command；read/view/edit/write -> path。
TARGET="$(field command) $(field path) $(field file_path) $(field absolute_path)"

# 系統檔案目錄（一律阻擋）。前綴 (^|[^[:alnum:]_.]) 確保是「路徑邊界」才算。
PATTERNS=(
  '(^|[^[:alnum:]_.])/etc/'    # 系統設定（/etc/passwd, /etc/shadow…）
  '(^|[^[:alnum:]_.])/proc/'   # 行程/核心資訊（/proc/*/environ）
  '(^|[^[:alnum:]_.])/sys/'    # 核心介面
  '(^|[^[:alnum:]_.])/boot/'   # 開機檔
  '(^|[^[:alnum:]_.])/root/'   # root 家目錄
)
PATTERN=$(IFS='|'; echo "${PATTERNS[*]}")

# /dev 特例：放行常見偽裝置（/dev/null 等），其餘（/dev/sda、/dev/mem）才擋。
DEV_SAFE='/dev/(null|zero|full|random|urandom|tty[0-9]*|pts/[0-9]+|std(in|out|err)|fd/[0-9]+)'

BLOCKED=0
printf '%s' "$TARGET" | grep -qE "$PATTERN" && BLOCKED=1
printf '%s' "$TARGET" | sed -E "s#${DEV_SAFE}##g" \
  | grep -qE '(^|[^[:alnum:]_.])/dev/' && BLOCKED=1

if [ "$BLOCKED" -eq 1 ]; then
  cat <<'JSON'
{"permissionDecision":"deny","permissionDecisionReason":"protect-system-paths hook：偵測到對系統檔案目錄（/etc /proc /sys /boot /root）或危險裝置檔（/dev/ 下非偽裝置）的存取，已阻擋。"}
JSON
fi

exit 0
