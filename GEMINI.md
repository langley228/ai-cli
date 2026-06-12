# 🤖 ai-cli 專案指令 (GEMINI.md)

這是 `ai-cli` 專案的核心指令文件。任何在此專案中作業的 AI 代理都必須嚴格遵守以下規範。

---

## 🏗️ 核心架構規範

- **介面與實作分離**:
  - 公用型別與介面必須定義在 `src/types/` 中。
  - 具體邏輯實作於 `src/*.ts`。
  - **原則**: 實作檔案應引入 `src/types/` 中的型別，嚴禁在實作檔案中直接導出大型介面。
- **測試鏡像結構**:
  - 測試檔案必須位於根目錄的 `tests/` 中。
  - 目錄結構必須與 `src/` 完全鏡像對應。
  - 範例: `src/core.ts` ➔ `tests/core.test.ts`。

---

## 🎨 程式碼風格 (Coding Style)

- **型別安全性**: 嚴禁使用 `any`。所有變數與函數必須具備明確的型別定義。
- **命名規則**:
  - 檔案: `kebab-case.ts`
  - 函數/變數: `camelCase`
  - 介面/類別: `PascalCase`
- **文件化**: 所有匯出的函數與模組必須包含 **JSDoc** 註解（繁體中文或英文）。
- **防禦性編程**: 所有的 IO 操作（檔案讀寫、網路請求）必須包裹在 `try-catch` 中。

---

## 🔐 安全規範

- **金鑰處理**: 嚴禁將 API Key 或敏感資訊以明文形式寫入任何檔案或日誌。
- **加密標準**: 憑證存儲必須使用 `src/security.ts` 中定義的 **AES-256-GCM** 流程，並必須設定 `OMNI_MASTER_KEY` 環境變數。
- **設定檔位置**: 統一存儲於 `~/.omni/config.json`。

---

## 🧪 測試與驗證

- **框架**: 使用 **Vitest**。
- **必要流程**:
  1. 修改程式碼後，必須同步更新或新增對應的測試檔案於 `tests/`。
  2. 提交前必須執行 `npm test` 確保全數通過。
  3. 核心模組（init, context, core）應維持 **90% 以上**的測試覆蓋率。

---

## 🌿 Git 流程

- **Commit 訊息**: 必須遵循 **Conventional Commits** 格式。
  - `feat(...)`: 新功能
  - `fix(...)`: 修復
  - `docs(...)`: 文件
  - `refactor(...)`: 重構
- **分支管理**: 開發新功能請基於 `develop` 分支建立 `feature/*`。

---

## 📅 開發階段參考

1. **Research**: 閱讀 `docs/` 下的對應規範。
2. **Execution**: 實作功能時同步更新 `src/types/` 與 `tests/`。
3. **Validation**: 執行 `npm run build` 與 `npm test`。
