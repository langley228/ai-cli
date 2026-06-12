#!/usr/bin/env bash
# PreToolUse 保護 hook：阻擋對「系統檔案目錄」的存取（讀取 / 編輯 / Bash）。
#
# 設計原則：
#   - 純 bash + grep/sed，零外部套件依賴（不需 jq / python / node）。
#   - 只比對「目標欄位」：Bash 看 command、Read/Edit 看 file_path/path。
#     不掃整段 payload，因此編輯「內容剛好含系統路徑字樣」的檔案不會被誤擋。
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

# 系統檔案目錄。前綴 (^|[^[:alnum:]_.]) 確保是「路徑邊界」才算，
# 避免誤中專案內像 .../ai-cli/etc/ 這類含 etc 字樣的路徑。
PATTERNS=(
  '(^|[^[:alnum:]_.])/etc/'    # 系統設定（/etc/passwd, /etc/shadow…）
  '(^|[^[:alnum:]_.])/proc/'   # 行程/核心資訊（/proc/*/environ）
  '(^|[^[:alnum:]_.])/sys/'    # 核心介面
  '(^|[^[:alnum:]_.])/boot/'   # 開機檔
  '(^|[^[:alnum:]_.])/dev/'    # 裝置檔
  '(^|[^[:alnum:]_.])/root/'   # root 家目錄
)
PATTERN=$(IFS='|'; echo "${PATTERNS[*]}")

if printf '%s' "$TARGET" | grep -qE "$PATTERN"; then
  cat <<'JSON'
{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"deny","permissionDecisionReason":"protect-system-paths hook：偵測到對系統檔案目錄（/etc /proc /sys /boot /dev /root）的存取，已阻擋。"}}
JSON
fi

exit 0
