# 🧪 單元測試規範

為了確保 `ai-cli` 的穩定性與可靠性，所有核心邏輯必須具備完整的單元測試與整合測試。

---

## 1. 測試框架 (Testing Framework)

本專案採用 **Vitest** 作為測試框架，原因如下：
- 原生支援 TypeScript 與 ESM。
- 速度極快且支援熱重載 (Watch mode)。
- 與 Jest API 高度相容。

---

## 2. 測試檔案規範

- **位置**: 測試檔案應放置於專案根目錄下的 `tests/` 目錄中，且目錄結構必須與 `src/` 完全對應（鏡像）。
- **命名範例**:
  - `src/context.ts` ➔ `tests/context.test.ts`
  - `src/init.ts` ➔ `tests/init.test.ts`
  - `src/adapters/claude/cliAdapter.ts` ➔ `tests/adapters/claude/cliAdapter.test.ts`

---

## 3. 測試撰寫原則

- **獨立性**: 每個測試案例應獨立執行，不應依賴其他測試的執行結果。
- **Mocking (模擬)**:
  - **檔案系統**: 使用 `vi.mock('fs/promises')` 模擬檔案讀寫。
  - **網路請求**: 使用 `vi.stubGlobal('fetch', ...)` 或 `msw` 模擬 Ollama API 請求。
  - **加密工具**: 測試 `init.ts` 時，應驗證加密與解密後的結果是否一致。
- **邊界測試**: 必須包含異常路徑測試（如：檔案不存在、憑證損毀、Ollama 連線失敗）。

---

## 4. 測試覆蓋率 (Coverage)

- **核心模組**: `init.ts`, `context.ts`, `core.ts` 的測試覆蓋率應達到 **90% 以上**。
- **UI/CLI 模組**: `cli.ts` 以驗證命令解析為主。

---

## 5. 執行測試

```bash
# 執行所有測試
npm test

# 執行測試並生成覆蓋率報告
npm run test:coverage

# 開啟監聽模式 (開發建議)
npx vitest
```

---

## 6. CI/CD 整合

所有合併至 `develop` 或 `main` 的 PR 必須通過自動化測試流水線，嚴禁合併測試失敗的程式碼。
