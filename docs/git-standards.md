# 🌿 Git 分支與 Commit 規範

為了維持專案歷史的清晰與協作效率，本專案遵循以下規範。

---

## 1. 分支策略 (Branching Strategy)

我們採用類 Git Flow 的簡化模型：

- **`main`**: 穩定版本分支。僅接受來自 `develop` 的合併，且必須通過 CI 測試。
- **`develop`**: 主要開發分支。所有功能分支最終匯集於此。
- **`feature/*`**: 新功能開發。從 `develop` 分出，完成後合併回 `develop`。
  - 命名範例: `feature/init-module`, `feature/ollama-adapter`
- **`fix/*`**: Bug 修復。從 `develop` 或 `main` 分出。
  - 命名範例: `fix/encryption-padding`, `fix/cli-typo`
- **`refactor/*`**: 程式碼重構。不涉及功能變動。

---

## 2. Commit 訊息規範 (Commit Message Standards)

遵循 [Conventional Commits](https://www.conventionalcommits.org/) 規範。

### 格式 (Format)
```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

### 類型 (Type)
- **`feat`**: 新增功能 (Feature)
- **`fix`**: 修復 Bug (Bug Fix)
- **`docs`**: 僅文件變動 (Documentation)
- **`style`**: 不影響程式邏輯的格式變動 (空白、分號等)
- **`refactor`**: 程式碼重構 (既非修復 Bug 也非新增功能)
- **`test`**: 新增或修改現有測試
- **`chore`**: 建置程序或輔助工具的變動 (如：更新依賴)

### 範例 (Examples)
- `feat(init): 實作 AES-256-GCM 加密儲存邏輯`
- `fix(core): 修正無憑證時無法正確降級至 Ollama 的問題`
- `docs(readme): 補充 Git 分支與 Commit 規範文件連結`

---

## 3. 合併規範 (Merging)

- 優先使用 **Pull Request (PR)** 進行合併。
- 合併前必須確保 `npm run build` 通過且無 Lint 錯誤。
- 推薦使用 `Squash and Merge` 以保持 `main` 分支歷史整潔。
