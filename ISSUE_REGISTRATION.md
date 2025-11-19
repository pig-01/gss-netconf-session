# 議程登記自動化流程說明

## 功能概述

透過建立 GitHub Issue 的方式，自動化處理團隊成員的議程報名。系統會自動驗證資料、更新 `members.json`，並建立 Pull Request 供審核。

## 使用方式

### 1. 建立 Issue

在 GitHub 專案中建立一個新的 Issue，標題必須以 `[新增議程]` 開頭。

**範例標題：**
```
[新增議程] Jason Tsai 報名議程
```

### 2. 填寫 Issue 內容

在 Issue 內文中貼上 JSON 格式的報名資料。JSON 必須包含 `name` 和 `sessions` 兩個欄位。

**方式一：使用 Markdown 程式碼區塊**
````markdown
```json
{
  "name": "Jason Tsai",
  "sessions": ["S013"]
}
```
````

**方式二：直接貼上 JSON**
```
{"name": "Jason Tsai", "sessions": ["S013", "S014", "S015"]}
```

### 3. 提交 Issue

提交 Issue 後，GitHub Action 會自動執行以下流程：

1. ✅ 驗證 Issue 標題是否以 `[新增議程]` 開頭
2. ✅ 從 Issue 內文中提取 JSON 資料
3. ✅ 驗證 JSON 格式是否正確
4. ✅ 檢查成員名稱是否存在於 `members.json`
5. ✅ 驗證議程代碼是否有效（存在於 `sessions.json`）
6. ✅ 過濾掉一般性議程（check-in、opening、lunch）
7. ✅ 過濾掉無效的議程代碼
8. ✅ 更新成員的議程清單（新增或移除）
9. ✅ 建立 Pull Request
10. ✅ 在 Issue 中留言告知處理結果

### 4. 審核與合併

系統會自動建立一個 Pull Request，您可以：
- 檢視變更內容
- 審核是否正確
- 合併 PR 以完成更新
- PR 合併後會自動關閉對應的 Issue

## JSON 資料格式

### 必要欄位

| 欄位 | 類型 | 說明 | 範例 |
|------|------|------|------|
| `name` | string | 成員姓名（必須存在於 members.json） | `"Jason Tsai"` |
| `sessions` | array | 議程代碼陣列 | `["S013", "S014"]` |

### 完整範例

```json
{
  "name": "Jason Tsai",
  "sessions": ["S013", "S014", "S015"]
}
```

## 驗證規則

### ✅ 成功條件

1. Issue 標題以 `[新增議程]` 開頭
2. Issue 內文包含有效的 JSON 字串
3. JSON 包含 `name` 和 `sessions` 欄位
4. `name` 存在於 `members.json` 的成員清單中
5. `sessions` 中至少有一個有效的議程代碼

### ❌ 會被過濾或拒絕的情況

1. **一般性議程會被自動過濾**（不會加入成員的議程清單）：
   - `check-in`
   - `opening`
   - `lunch`

2. **無效的議程代碼會被過濾**：
   - 不存在於 `sessions.json` 的代碼
   - 範例：`INVALID`、`S999`

3. **整個處理會失敗的情況**：
   - Issue 標題沒有以 `[新增議程]` 開頭
   - Issue 內文沒有 JSON 資料
   - JSON 格式錯誤
   - 成員名稱不存在於 `members.json`

## 更新邏輯

系統會**完全替換**成員原有的議程清單：

- **新增**：`sessions` 中有但成員原本沒有的議程
- **移除**：成員原本有但 `sessions` 中沒有的議程
- **保留**：`sessions` 中有且成員原本就有的議程

### 範例

**原始狀態：**
```json
{
  "name": "Jason Tsai",
  "sessions": ["S001", "S002"]
}
```

**提交的資料：**
```json
{
  "name": "Jason Tsai",
  "sessions": ["S002", "S013"]
}
```

**更新後：**
```json
{
  "name": "Jason Tsai",
  "sessions": ["S002", "S013"]
}
```

變更：
- ➕ 新增 `S013`
- ➖ 移除 `S001`
- ✓ 保留 `S002`

## 可用的成員名稱

目前系統中的成員（來自 `members.json`）：

- Kuro Chen
- Shuni Chen
- Oscar Chang
- Jason Tsai
- TC Tseng
- Lizard Liang
- Aurora Liu

## 可用的議程代碼

請參考 `data/sessions.json` 中的議程清單。有效的議程代碼範例：
- `S001` 到 `S028`（實際議程）
- ❌ `check-in`、`opening`、`lunch`（會被自動過濾）

## 範例場景

### 場景 1：首次報名

**Issue 內容：**
```json
{
  "name": "Jason Tsai",
  "sessions": ["S013", "S014", "S015"]
}
```

**結果：**
- ✅ 成功建立 PR
- ✅ Jason Tsai 的議程清單更新為 `["S013", "S014", "S015"]`

### 場景 2：包含無效代碼

**Issue 內容：**
```json
{
  "name": "Kuro Chen",
  "sessions": ["S001", "INVALID", "S999", "S013"]
}
```

**結果：**
- ✅ 成功建立 PR
- ⚠️ `INVALID` 和 `S999` 被過濾
- ✅ Kuro Chen 的議程清單更新為 `["S001", "S013"]`

### 場景 3：包含一般性議程

**Issue 內容：**
```json
{
  "name": "Shuni Chen",
  "sessions": ["check-in", "S005", "opening", "S010", "lunch"]
}
```

**結果：**
- ✅ 成功建立 PR
- ⚠️ `check-in`、`opening`、`lunch` 被過濾
- ✅ Shuni Chen 的議程清單更新為 `["S005", "S010"]`

### 場景 4：成員不存在

**Issue 內容：**
```json
{
  "name": "Invalid Name",
  "sessions": ["S001"]
}
```

**結果：**
- ❌ 處理失敗
- ❌ 在 Issue 中留言說明錯誤原因
- ❌ 不會建立 PR

## 疑難排解

### Issue 處理失敗？

檢查以下項目：

1. **Issue 標題**
   - ✅ 必須以 `[新增議程]` 開頭
   - ❌ 不能是 `議程新增` 或其他格式

2. **JSON 格式**
   - ✅ 使用雙引號 `"` 而非單引號 `'`
   - ✅ 正確的逗號分隔
   - ✅ 正確的大括號和中括號

3. **成員名稱**
   - ✅ 必須完全符合 `members.json` 中的名稱
   - ❌ 大小寫要一致

4. **議程代碼**
   - ✅ 至少要有一個有效的議程代碼
   - ✅ 可以包含無效代碼（會被自動過濾）

### 查看執行日誌

如果需要更詳細的錯誤資訊：

1. 前往專案的 **Actions** 頁面
2. 找到對應的 workflow run
3. 查看執行日誌

## 技術細節

- **觸發條件**：Issue 建立時（`issues.opened` 事件）
- **執行環境**：Ubuntu Latest with Node.js 20
- **所需權限**：
  - `contents: write` - 修改檔案
  - `pull-requests: write` - 建立 PR
  - `issues: write` - 在 Issue 中留言
- **使用的 GitHub Actions**：
  - `actions/checkout@v4`
  - `actions/setup-node@v4`
  - `actions/github-script@v7`
  - `peter-evans/create-pull-request@v6`

## 未來可能的改進

- [ ] 支援批次處理多個成員的報名
- [ ] 支援議程衝突檢查（同一時段的議程）
- [ ] 新增議程推薦功能
- [ ] 支援從 Google Sheets 同步資料
- [ ] 自動通知成員報名成功

## 相關檔案

- `.github/workflows/process-session-registration.yml` - 工作流程定義
- `data/members.json` - 成員資料
- `data/sessions.json` - 議程資料
