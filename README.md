# .NET Conf 2025 議程表 - BDPDD 團隊

協助叡揚BDPDD團隊成員標記要去的 dotnet conf 2025 議程，以方便互相占位子或是聯絡

## 功能特點

- 📅 互動式議程表格顯示
- 🏷️ 點擊課程即可標記參加
- 👥 成員篩選功能
- 💾 本地儲存標記資料
- 📱 響應式設計，支援手機瀏覽

## 如何使用

1. 訪問 GitHub Pages 網站
2. 瀏覽 .NET Conf 2025 的所有課程議程
3. 點擊任何課程格子來標記您的參加意願
4. 輸入您的名字並確認
5. 您的標記將顯示在課程下方
6. 使用上方的成員篩選按鈕來查看特定成員選擇的課程

## 技術棧

- HTML5
- CSS3 (Bootstrap 5)
- JavaScript (Vanilla JS)
- JSON 資料儲存
- LocalStorage 本地資料持久化

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
定義 BDPDD 成員資訊：
- `name`: 成員名稱
- `sessions`: 該成員選擇的課程代號列表

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
