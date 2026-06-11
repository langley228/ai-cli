# 🎨 Coding Style 與開發規範

為了維持 `ai-cli` 程式碼的可讀性、型別安全性與長期維護性，本專案遵循以下開發規範。

---

## 1. 核心原則 (Core Principles)

- **型別優先 (Type First)**: 所有的函數輸入、輸出與複雜物件都必須定義 Interface 或 Type。嚴禁使用 `any`。
- **簡潔直觀 (KISS)**: 優先使用簡單、易讀的邏輯。避免過度封裝或複雜的繼承關係。
- **組合優於繼承 (Composition over Inheritance)**: 優先使用 Wrapper 或組合模式來擴充功能。
- **錯誤處理 (Robustness)**: 非同步操作必須使用 `try-catch` 或回傳明確的 Result 物件，並給予使用者有意義的錯誤提示。

---

## 2. 命名規範 (Naming Conventions)

- **檔案命名**: 使用 `kebab-case.ts` (例如: `local-adapter.ts`)。
- **變數與函數**: 使用 `camelCase` (例如: `buildContext`, `isMockMode`)。
- **類別、介面與型別**: 使用 `PascalCase` (例如: `ProjectContext`, `DispatchResult`)。
- **常量 (Constants)**: 使用 `UPPER_SNAKE_CASE` (例如: `IGNORE_LIST`, `ENCRYPTION_KEY`)。

---

## 3. TypeScript 慣用法 (Idiomatic TS)

- **解構賦值**: 優先使用解構賦值來取得物件屬性。
  ```typescript
  const { tree, xml } = await buildContext(dir);
  ```
- **Async/Await**: 統一使用 `async/await` 處理非同步操作，避免回調地獄 (Callback Hell)。
- **字串模板**: 組合字串時優先使用 Template Literals (反引號)。
- **防禦性編程**: 使用 Optional Chaining (`?.`) 與 Nullish Coalescing (`??`)。

---

## 4. 註解規範 (Commenting)

- **JSDoc**: 導出的所有模組與函數必須使用 JSDoc 格式說明職責、參數與回傳值。
- **邏輯註解**: 對於複雜的演算法（如加密流程或遞迴掃描）應加入關鍵步驟說明。
- **語言**: 註解與文件統一使用 **繁體中文** 或 **英文**。

---

## 6. 介面與實作分離 (Interface-Implementation Separation)

為了明確定義系統的「合約」與「實作」，本專案採用以下結構：

- **`src/types/`**: 存放所有導出的公用 Interface 與 Type。這代表了專案的技術合約 (Contract)。
- **`src/*.ts`**: 存放具體的實作邏輯 (Implementation)。
- **規範**: 實作檔案應從 `src/types/` 引入型別。這有助於避免循環依賴，並讓開發者能快速掌握系統的資料結構。
