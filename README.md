# .NET Conf 2025 議程表 - BDPDD 團隊

協助叡揚BDPDD團隊成員標記要去的 dotnet conf 2025 議程，以方便互相占位子或是聯絡

## 功能特點

- 📅 互動式議程表格顯示
- 🏷️ 點擊課程即可標記參加
- 👥 成員篩選功能
- 💾 本地儲存標記資料
- 📱 響應式設計，支援手機瀏覽
- ☁️ Google Sheets API 整合，支援動態成員管理
- 🤖 **新功能：透過 GitHub Issue 自動化議程登記** - [使用說明](ISSUE_REGISTRATION.md)

## 如何使用

1. 訪問 GitHub Pages 網站
2. 瀏覽 .NET Conf 2025 的所有課程議程
3. 點擊任何課程格子來標記您的參加意願
4. 輸入您的名字並確認
5. 您的標記將顯示在課程下方
6. 使用上方的成員篩選按鈕來查看特定成員選擇的課程

## 🤖 議程自動化登記（GitHub Issue）

**新功能！** 現在可以透過建立 GitHub Issue 的方式自動化處理議程報名。

### 快速開始

1. 建立一個新的 Issue，標題以 `[新增議程]` 開頭
2. 在 Issue 內文中貼上 JSON 格式的報名資料：
   ```json
   {
     "name": "Jason Tsai",
     "sessions": ["S013", "S014", "S015"]
   }
   ```
3. 提交 Issue 後，系統會自動：
   - ✅ 驗證資料格式與有效性
   - ✅ 建立 Pull Request 更新 `members.json`
   - ✅ 在 Issue 中留言告知處理結果

### 詳細說明

完整的使用說明、驗證規則、範例場景，請參考 **[議程自動化登記說明文件](ISSUE_REGISTRATION.md)**。

## Google Sheets API 整合

### 設定說明

本專案支援從 Google Sheets 載入成員資料，讓團隊成員可以直接在試算表中管理自己的議程選擇。

#### 取得 Google Sheets API Key

1. 前往 [Google Cloud Console](https://console.cloud.google.com/)
2. 建立或選擇專案
3. 啟用 Google Sheets API
   - 在左側選單中選擇「API 和服務」>「程式庫」
   - 搜尋「Google Sheets API」
   - 點擊「啟用」
4. 建立憑證（API Key）
   - 在左側選單中選擇「API 和服務」>「憑證」
   - 點擊「建立憑證」>「API 金鑰」
   - 複製產生的 API Key
5. 設定試算表權限
   - 開啟 [團隊議程試算表](https://docs.google.com/spreadsheets/d/1PpyJ_JGtgqrIkffvEjPwBscoMokK5_lKvMh6xFK4JV8/edit)
   - 點擊右上角「共用」
   - 將「一般存取權」設為「知道連結的使用者」可檢視

#### 在網站中設定 API Key

1. 點擊網站右上角的齒輪圖示（⚙️）
2. 在設定視窗中輸入您的 Google Sheets API Key
3. 點擊「測試連線」確認設定正確
4. 點擊「儲存 API Key」
5. 重新載入頁面，系統將自動從 Google Sheets 載入成員資料

### Google Sheets 資料格式

試算表的資料格式（範圍 A2:B8）：

| 欄位 A（成員名稱） | 欄位 B（議程代碼，JSON 格式） |
|------------------|----------------------------|
| Kuro Chen        | ["S001", "S002", "S003"]   |
| Shuni Chen       | ["S004", "S005"]           |

- **欄位 A**：成員名稱
- **欄位 B**：該成員選擇的議程代碼，使用 JSON 陣列格式或逗號分隔的字串

### 注意事項

- 目前僅支援從 Google Sheets **讀取**成員資料
- 若要更新成員的議程選擇，請直接在 Google Sheets 中編輯
- 如果未設定 API Key，系統將自動使用本地的 `data/members.json` 檔案
- API Key 儲存在瀏覽器的 localStorage 中，僅在您的裝置上使用

## 技術棧

- HTML5
- CSS3 (Bootstrap 5)
- JavaScript (Vanilla JS)
- JSON 資料儲存
- LocalStorage 本地資料持久化
- Google Sheets API v4

## 資料檔案說明

### data/table-structure.json
定義議程表格的結構：
- `rooms`: 會議室資訊（代號、樓層、名稱）
- `timeSlots`: 時間區間

### data/sessions.json
定義課程資訊：
- `code`: 課程代號
- `name`: 課程名稱
- `speaker`: 講師
- `noReplay`: 是否無回放
- `room`: 所屬會議室
- `timeSlot`: 時間區間
- `colspan`: 跨欄數（可選）

### data/members.json
定義 BDPDD 成員資訊（Fallback 用）：
- `name`: 成員名稱
- `sessions`: 該成員選擇的課程代號列表

**注意**：如果設定了 Google Sheets API，系統會優先從試算表載入成員資料。

## 本地開發

1. Clone 此專案
2. 使用任何 HTTP 伺服器開啟 index.html（例如：Python 的 http.server、Live Server 等）
3. 在瀏覽器中開啟即可使用

```bash
# 使用 Python 開啟本地伺服器
python -m http.server 8000

# 或使用 Node.js 的 http-server
npx http-server
```

## GitHub Pages 部署

本專案已配置為自動部署到 GitHub Pages。任何推送到主分支的更改都會自動更新網站。

## 授權

MIT License
