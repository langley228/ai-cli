#!/usr/bin/env bash
# Gemini CLI BeforeTool 保護 hook：阻擋對「系統檔案目錄」的存取。
# （Claude 版 .claude/hooks/protect-system-paths.sh 的 Gemini 對應版本）
#
# 與 Claude 版差異只在 I/O 介面，比對邏輯完全相同：
#   - 事件為 BeforeTool；STDIN 同樣有 tool_name / tool_input。
#   - 阻擋輸出格式為 {"decision":"deny","reason":...}（非 Claude 的
#     hookSpecificOutput.permissionDecision）。
#   - 多抓 read_file 的 absolute_path 欄位（Gemini 的讀檔參數名）。
#
# 設計原則：純 bash + grep/sed，零外部套件依賴（不需 jq）。這是「防呆層」，
# 非 OS 層級邊界；真正硬邊界請用 sandbox。

PAYLOAD=$(cat)

# 從 payload 取出某個 JSON 字串欄位的值（best-effort，不依賴 jq）
field() {
  printf '%s' "$PAYLOAD" \
    | sed -n 's/.*"'"$1"'"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p'
}

# 只看真正的操作目標：
#   run_shell_command -> command；read_file -> absolute_path；
#   write_file / replace -> file_path；其餘相容 path。
TARGET="$(field command) $(field file_path) $(field absolute_path) $(field path)"

# 系統檔案目錄（一律阻擋）。前綴 (^|[^[:alnum:]_.]) 確保是「路徑邊界」才算。
PATTERNS=(
  '(^|[^[:alnum:]_.])/etc/'    # 系統設定（/etc/passwd, /etc/shadow…）
  '(^|[^[:alnum:]_.])/proc/'   # 行程/核心資訊（/proc/*/environ）
  '(^|[^[:alnum:]_.])/sys/'    # 核心介面
  '(^|[^[:alnum:]_.])/boot/'   # 開機檔
  '(^|[^[:alnum:]_.])/root/'   # root 家目錄
)
PATTERN=$(IFS='|'; echo "${PATTERNS[*]}")

# /dev 特例：放行常見偽裝置（/dev/null 等重導向、亂數源），其餘（原始磁碟
# /dev/sda、/dev/mem）才視為危險。做法：先抽掉安全偽裝置字樣，殘留才算命中。
DEV_SAFE='/dev/(null|zero|full|random|urandom|tty[0-9]*|pts/[0-9]+|std(in|out|err)|fd/[0-9]+)'

BLOCKED=0
printf '%s' "$TARGET" | grep -qE "$PATTERN" && BLOCKED=1
printf '%s' "$TARGET" | sed -E "s#${DEV_SAFE}##g" \
  | grep -qE '(^|[^[:alnum:]_.])/dev/' && BLOCKED=1

if [ "$BLOCKED" -eq 1 ]; then
  cat <<'JSON'
{"decision":"deny","reason":"protect-system-paths hook：偵測到對系統檔案目錄（/etc /proc /sys /boot /root）或危險裝置檔（/dev/ 下非偽裝置）的存取，已阻擋。","systemMessage":"🚫 已阻擋系統目錄存取"}
JSON
fi

exit 0
