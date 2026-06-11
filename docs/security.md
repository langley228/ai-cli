# 🔐 安全與加密規範

## 加密演算法
- **演算法**: AES-256-GCM
- **金鑰衍生**: 使用 `crypto.scryptSync` 從內部 Salt 生成 32 bytes 金鑰。
- **IV (Initialization Vector)**: 每次加密隨機生成 16 bytes。
- **認證標籤 (Auth Tag)**: GCM 模式生成的標籤，用於驗證數據完整性。

## 存儲結構
設定檔位於 `~/.omni/config.json`，格式如下：
```json
{
  "data": "BASE64_ENCODED_STRING(IV + TAG + ENCRYPTED_CONTENT)"
}
```

## 開發規範
1. **嚴禁明文存儲**: 任何 API Key 或敏感資訊必須經過 `encrypt` 函數處理。
2. **記憶體安全**: 在處理完敏感資訊後，應盡快讓垃圾回收機制清理。
