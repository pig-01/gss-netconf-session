# Google Apps Script 設定說明

本文件說明如何設定 Google Apps Script Web App，以便直接從網頁寫入 Google Sheets。

## 步驟一：建立 Apps Script

1. 開啟您的 Google Spreadsheet：
   https://docs.google.com/spreadsheets/d/1PpyJ_JGtgqrIkffvEjPwBscoMokK5_lKvMh6xFK4JV8/edit

2. 點擊上方選單：**擴充功能** > **Apps Script**

3. 刪除預設的程式碼，複製以下完整程式碼：

```javascript
// Google Apps Script Web App for updating member sessions
// This allows the web application to write data to Google Sheets

function doPost(e) {
  try {
    // Parse the request
    const data = JSON.parse(e.postData.contents);
    
    // Validate request
    if (!data.action || data.action !== 'updateMember') {
      return ContentService.createTextOutput(JSON.stringify({
        status: 'error',
        message: 'Invalid action'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    if (!data.memberName || !data.sessions) {
      return ContentService.createTextOutput(JSON.stringify({
        status: 'error',
        message: 'Missing memberName or sessions'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // Get the spreadsheet
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = spreadsheet.getActiveSheet();
    
    // Get all data
    const range = sheet.getRange('A2:B8');
    const values = range.getValues();
    
    // Find the member's row
    let rowIndex = -1;
    for (let i = 0; i < values.length; i++) {
      if (values[i][0] === data.memberName) {
        rowIndex = i;
        break;
      }
    }
    
    if (rowIndex === -1) {
      return ContentService.createTextOutput(JSON.stringify({
        status: 'error',
        message: 'Member not found: ' + data.memberName
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // Update the sessions (column B)
    const actualRow = rowIndex + 2; // +2 because data starts at row 2
    const sessionsJson = JSON.stringify(data.sessions);
    sheet.getRange(actualRow, 2).setValue(sessionsJson);
    
    return ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      message: 'Updated sessions for ' + data.memberName,
      updatedSessions: data.sessions
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// Test function (optional, for debugging)
function testUpdate() {
  const testData = {
    postData: {
      contents: JSON.stringify({
        action: 'updateMember',
        memberName: 'Jason Tsai',
        sessions: ['S001', 'S002', 'S003']
      })
    }
  };
  
  const result = doPost(testData);
  Logger.log(result.getContent());
}
```

## 步驟二：部署 Web App

1. 點擊右上角的「部署」按鈕 > 選擇「新增部署」

2. 在「選取類型」中，點擊齒輪圖示，選擇「網頁應用程式」

3. 填寫以下設定：
   - **說明**：Member Session Update API（或任何描述）
   - **執行身分**：選擇「我」
   - **具有應用程式存取權的使用者**：選擇「任何人」

4. 點擊「部署」

5. 系統會要求授權：
   - 點擊「授權存取權」
   - 選擇您的 Google 帳號
   - 點擊「進階」> 「前往專案名稱（不安全）」
   - 點擊「允許」

6. 複製顯示的「網頁應用程式 URL」
   - URL 格式類似：`https://script.google.com/macros/s/AKfyc...../exec`
   - **重要**：這個 URL 必須完整複製，包含最後的 `/exec`

## 步驟三：在網站中設定

1. 開啟議程表網站

2. 點擊右上角的齒輪圖示（設定）

3. 將複製的 Web App URL 貼到「Web App URL（用於寫入）」欄位

4. 點擊「儲存設定」

5. 重新載入頁面

## 測試

1. 選擇您的名字
2. 點擊任一課程
3. 點擊「加入表格」
4. 檢查 Google Spreadsheet，確認資料已更新

## 疑難排解

### 錯誤：Member not found

- 確認您選擇的名字與試算表中的名字完全一致（包含大小寫）
- 檢查試算表的資料範圍是否為 A2:B8

### 錯誤：CORS 問題

- 確認 Web App 部署時選擇了「任何人」都可存取
- 重新部署 Web App

### 資料沒有更新

- 檢查 Apps Script 的執行記錄（在 Apps Script 編輯器中點擊「執行」）
- 確認試算表沒有被保護或限制編輯

### 需要重新部署

如果修改了 Apps Script 程式碼：
1. 點擊「部署」>「管理部署」
2. 點擊現有部署旁的鉛筆圖示
3. 點擊右上角的「版本」>「新版本」
4. 點擊「部署」
5. URL 保持不變，不需要重新設定

## 安全性注意事項

- Web App URL 是公開的，但只有知道 URL 的人才能使用
- 建議只在信任的團隊內分享
- Apps Script 會以您的身分執行，因此只有您的帳號可以修改試算表
- 可以在 Apps Script 中新增額外的驗證邏輯（例如：檢查 IP 位址、加入密碼等）

## 進階設定（選用）

### 新增 IP 白名單

在 `doPost` 函數開頭加入：

```javascript
const allowedIPs = ['1.2.3.4', '5.6.7.8']; // 替換為您的 IP
const clientIP = e.parameter.userip || 'unknown';
if (!allowedIPs.includes(clientIP)) {
  return ContentService.createTextOutput(JSON.stringify({
    status: 'error',
    message: 'Access denied'
  })).setMimeType(ContentService.MimeType.JSON);
}
```

### 新增簡單的密碼驗證

在 `doPost` 函數中驗證：

```javascript
const SECRET_KEY = 'your-secret-password';
if (data.apiKey !== SECRET_KEY) {
  return ContentService.createTextOutput(JSON.stringify({
    status: 'error',
    message: 'Invalid API key'
  })).setMimeType(ContentService.MimeType.JSON);
}
```

然後在網頁端傳送時加入：

```javascript
body: JSON.stringify({
    action: 'updateMember',
    memberName: memberName,
    sessions: sessions,
    apiKey: 'your-secret-password'
})
```
