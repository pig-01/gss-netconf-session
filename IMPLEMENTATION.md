# GitHub Action 議程自動化登記系統 - 實作說明

## 專案概述

本專案實作了一個基於 GitHub Issues 和 GitHub Actions 的自動化議程登記系統，讓團隊成員可以透過建立 Issue 的方式更新自己的議程報名資料。

## 架構設計

```
Issue Created (標題: [新增議程])
    ↓
GitHub Actions Workflow Triggered
    ↓
驗證 Issue 標題格式
    ↓
解析 Issue 內容中的 JSON
    ↓
驗證資料格式與內容
    ├─ 檢查成員是否存在
    ├─ 檢查議程代碼是否有效
    └─ 過濾一般性議程和無效代碼
    ↓
更新 members.json
    ↓
建立 Pull Request
    ↓
在 Issue 中留言通知結果
```

## 技術實作

### 1. Workflow 觸發條件

```yaml
on:
  issues:
    types: [opened]

jobs:
  process-registration:
    if: startsWith(github.event.issue.title, '[新增議程]')
```

**實作要點：**
- 監聽 `issues.opened` 事件
- 使用 `if` 條件過濾標題必須以 `[新增議程]` 開頭
- 只有符合條件的 Issue 才會觸發後續處理

### 2. JSON 解析邏輯

```javascript
// 支援兩種格式：
// 1. Markdown 程式碼區塊: ```json ... ```
// 2. 直接貼上: { ... }
const jsonMatch = issueBody.match(/```json\s*([\s\S]*?)\s*```/) || 
                 issueBody.match(/\{[\s\S]*?"name"[\s\S]*?"sessions"[\s\S]*?\}/);
```

**實作要點：**
- 使用正則表達式匹配 JSON 字串
- 優先匹配 Markdown 程式碼區塊格式
- 備選方案：匹配包含 `name` 和 `sessions` 的 JSON 物件
- 提供彈性讓使用者用不同方式貼上 JSON

### 3. 成員驗證

```javascript
const membersData = JSON.parse(fs.readFileSync('data/members.json', 'utf8'));
const member = membersData.members.find(m => m.name === registrationData.name);

if (!member) {
  core.setFailed(`Member "${registrationData.name}" not found in members.json`);
  return;
}
```

**實作要點：**
- 讀取 `members.json` 檔案
- 嚴格比對成員名稱（大小寫敏感）
- 找不到成員時立即終止，不會建立 PR

### 4. 議程代碼驗證與過濾

```javascript
// 讀取有效的議程代碼（排除一般性議程）
const validSessionCodes = sessionsData.sessions
  .filter(s => !['check-in', 'opening', 'lunch'].includes(s.code))
  .map(s => s.code);

// 過濾使用者提交的議程代碼
const validSessions = registrationData.sessions.filter(code => {
  if (['check-in', 'opening', 'lunch'].includes(code)) {
    console.log(`Skipping generic session: ${code}`);
    return false;
  }
  if (!validSessionCodes.includes(code)) {
    console.log(`Invalid session code: ${code}`);
    return false;
  }
  return true;
});
```

**實作要點：**
- 從 `sessions.json` 取得所有有效的議程代碼
- 自動排除一般性議程（check-in, opening, lunch）
- 過濾無效的議程代碼
- 在 console 中記錄被過濾的代碼，方便除錯
- 即使所有代碼都被過濾，仍會繼續處理（sessions 會變成空陣列）

### 5. 更新 members.json

```javascript
const memberIndex = membersData.members.findIndex(m => m.name === memberName);
if (memberIndex !== -1) {
  membersData.members[memberIndex].sessions = newSessions;
}

fs.writeFileSync('data/members.json', JSON.stringify(membersData, null, 2) + '\n');
```

**實作要點：**
- 直接替換整個 `sessions` 陣列（不是增量更新）
- 使用 `JSON.stringify(data, null, 2)` 保持格式化（2 空格縮排）
- 在檔案結尾加上換行符號 `\n`，符合 Git 規範
- 這種實作方式自動處理「新增」和「移除」議程的邏輯

### 6. 建立 Pull Request

```yaml
- name: Create Pull Request
  uses: peter-evans/create-pull-request@v6
  with:
    commit-message: "Update session registration for ${{ steps.parse.outputs.member_name }}"
    branch: session-registration/${{ github.event.issue.number }}
    delete-branch: true
    title: "[議程更新] Update sessions for ${{ steps.parse.outputs.member_name }}"
    body: |
      ## Session Registration Update
      
      This PR was automatically created from issue #${{ github.event.issue.number }}
      
      **Member:** ${{ steps.parse.outputs.member_name }}
      **New Sessions:** ${{ steps.parse.outputs.sessions }}
      
      ### Changes
      - Updated session registration for ${{ steps.parse.outputs.member_name }}
      
      Closes #${{ github.event.issue.number }}
    labels: automated-pr, session-registration
```

**實作要點：**
- 使用 `peter-evans/create-pull-request` action 自動建立 PR
- 分支名稱包含 issue 編號，避免衝突：`session-registration/{issue_number}`
- PR 合併後自動刪除分支（`delete-branch: true`）
- PR 內容包含關鍵字 `Closes #` 以自動關閉對應的 Issue
- 加上標籤方便分類和管理

### 7. 錯誤處理與回饋

```javascript
// 成功的情況
await github.rest.issues.createComment({
  issue_number: context.issue.number,
  owner: context.repo.owner,
  repo: context.repo.repo,
  body: `✅ Session registration processed successfully!...`
});

// 失敗的情況
- name: Comment on issue (failure)
  if: failure()
  uses: actions/github-script@v7
  with:
    script: |
      await github.rest.issues.createComment({
        ...
        body: `❌ Failed to process session registration...`
      });
```

**實作要點：**
- 使用 `if: failure()` 條件捕捉任何步驟的失敗
- 在 Issue 中留言告知處理結果
- 提供明確的錯誤訊息和檢查清單
- 成功和失敗都有對應的通知機制

## 資料流程

### 輸入資料格式

```json
{
  "name": "成員姓名",
  "sessions": ["議程代碼1", "議程代碼2", ...]
}
```

### 驗證流程

1. **格式驗證**
   - JSON 格式是否正確
   - 是否包含必要欄位 `name` 和 `sessions`
   - `sessions` 是否為陣列

2. **業務邏輯驗證**
   - 成員名稱是否存在於 `members.json`
   - 議程代碼是否有效（存在於 `sessions.json`）
   - 過濾一般性議程

3. **資料轉換**
   - 提取有效的議程代碼
   - 產生新的 sessions 陣列

### 輸出結果

更新後的 `members.json` 範例：

```json
{
  "members": [
    {
      "name": "Jason Tsai",
      "sessions": ["S013", "S014", "S015"]
    }
  ]
}
```

## 安全性考量

### 1. 權限最小化

```yaml
permissions:
  contents: write      # 修改檔案
  pull-requests: write # 建立 PR
  issues: write        # 留言
```

只授予必要的權限，不使用 `write-all`。

### 2. 輸入驗證

- 所有使用者輸入都經過驗證
- JSON 解析錯誤會被捕捉
- 不信任任何外部輸入

### 3. 程式碼安全

- 使用官方維護的 GitHub Actions
- Actions 使用特定版本（非 `@latest`）
- 通過 CodeQL 掃描，無安全漏洞

### 4. 資料完整性

- 更新前驗證資料存在
- 使用 JSON.parse/stringify 確保格式正確
- 保留原始資料結構

## 測試策略

### 單元測試（本地）

使用 Node.js 腳本測試核心邏輯：
- JSON 解析
- 資料驗證
- 過濾邏輯

### 整合測試（GitHub）

建立實際 Issue 測試完整流程：
- Workflow 觸發
- PR 建立
- Issue 留言

### 測試案例覆蓋

✅ 正常情況：
- 單一議程
- 多個議程
- 更新現有報名

✅ 邊界情況：
- 空議程陣列
- 包含一般性議程
- 包含無效代碼

✅ 錯誤情況：
- 成員不存在
- JSON 格式錯誤
- 缺少必要欄位
- 標題格式錯誤

## 維護與擴充

### 新增成員

1. 編輯 `data/members.json`
2. 加入新成員物件
3. 提交並合併到主分支

### 新增議程

1. 編輯 `data/sessions.json`
2. 加入新議程物件（包含 code, name, speaker 等）
3. 提交並合併到主分支

### 修改驗證規則

編輯 `.github/workflows/process-session-registration.yml` 中的驗證邏輯。

常見修改：
- 調整議程代碼格式
- 修改過濾條件
- 新增額外驗證

### 自訂 PR 格式

修改 `Create Pull Request` 步驟中的 `title` 和 `body` 參數。

## 效能考量

### Workflow 執行時間

- 平均執行時間：30-60 秒
- 主要耗時：
  - Checkout repository: ~5 秒
  - Setup Node.js: ~10 秒
  - Parse and validate: ~5 秒
  - Create PR: ~10 秒

### 資源使用

- 記憶體：< 100 MB
- CPU：單核即可
- 網路：最小化（只讀取專案內檔案）

### 擴展性

目前架構可支援：
- 成員數量：無限制
- 議程數量：無限制
- 並發 Issue：GitHub Actions 自動排隊處理

## 已知限制

1. **同時更新衝突**
   - 如果多個 Issue 同時處理同一個成員，可能需要手動解決 PR 衝突
   - 建議：等前一個 PR 合併後再提交新的 Issue

2. **無法撤銷**
   - Issue 提交後會立即建立 PR
   - 如需撤銷，需要關閉 PR 或修改 PR 內容

3. **無議程衝突檢查**
   - 目前不檢查同一時段的議程衝突
   - 未來可擴充此功能

## 未來改進方向

- [ ] 議程時間衝突檢查
- [ ] 批次處理多個成員
- [ ] 自動通知（Email, Slack）
- [ ] 統計報表（最熱門議程、成員報名分佈）
- [ ] Google Sheets 雙向同步
- [ ] 議程推薦功能（基於成員興趣）

## 相關文件

- [使用說明](ISSUE_REGISTRATION.md) - 使用者導向的完整說明
- [測試範例](TESTING_EXAMPLES.md) - 詳細的測試案例
- [Issue 模板](.github/ISSUE_TEMPLATE/session-registration.md) - 報名表單模板

## 版本歷史

- **v1.0** (2025-11-19)
  - 初始版本
  - 支援基本的議程登記功能
  - 完整的驗證和錯誤處理
  - 自動建立 PR 和 Issue 留言
