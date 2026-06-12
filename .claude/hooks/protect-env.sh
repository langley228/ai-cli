#!/usr/bin/env bash
# PreToolUse 保護 hook：攔截對 .env 等敏感檔的存取（含 Bash 間接讀取）。
#
# 設計原則：
#   - 純 bash + grep，零外部套件依賴（不需 jq / python / node）。
#   - 直接比對整段 stdin payload，命中敏感樣式即回傳 permissionDecision: deny。
#     不逐欄解析 JSON，因此偏向「寧可錯擋」——指令只要字面出現 .env、id_rsa
#     等字樣就會被擋。對安全防線而言這個方向是刻意的。
#   - 這是「防呆層」，非 OS 層級邊界；間接讀檔（python/node 開檔）只有在
#     命令字串本身含敏感字樣時才擋得到。真正硬邊界請用 sandbox。
#
# PreToolUse 正確格式為 hookSpecificOutput.permissionDecision，
# 不可用頂層 decision: block（會靜默失效）。

PAYLOAD=$(cat)

# 敏感樣式（逐條列出便於維護，最後串成單一 regex）
PATTERNS=(
  '\.env'             # .env / .env.local / .env.* 等環境變數檔
  'id_rsa'            # SSH RSA 私鑰
  'id_ed25519'        # SSH Ed25519 私鑰
  '\.pem'             # PEM 憑證 / 私鑰
  '\.key'             # 私鑰檔
  'credentials\.json' # 雲端服務憑證
  'secrets/'          # secrets 目錄
  '/\.aws/'           # AWS 認證設定
  '/\.ssh/'           # SSH 設定目錄
  '\.netrc'           # netrc 登入憑證
  '\.npmrc'           # npm token
)
# 以 | 串成 grep -E 用的單一樣式
PATTERN=$(IFS='|'; echo "${PATTERNS[*]}")

if printf '%s' "$PAYLOAD" | grep -qE "$PATTERN"; then
  cat <<'JSON'
{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"deny","permissionDecisionReason":"protect-env hook：偵測到對敏感檔案（.env / 私鑰 / 憑證等）的存取，已阻擋。"}}
JSON
fi

exit 0
