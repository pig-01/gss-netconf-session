# 測試範例與驗證

本文件提供一些實際的測試案例，用於驗證議程自動化登記功能。

## 測試案例 1：基本報名

**Issue 標題：**
```
[新增議程] Jason Tsai 報名 ASP.NET Core 10.0 議程
```

**Issue 內容：**
````markdown
我想報名以下議程：

```json
{
  "name": "Jason Tsai",
  "sessions": ["S013"]
}
```
````

**預期結果：**
- ✅ 系統驗證通過
- ✅ 建立 PR 更新 `members.json`
- ✅ Jason Tsai 的 sessions 更新為 `["S013"]`
- ✅ 在 Issue 中留言確認成功

---

## 測試案例 2：多個議程報名

**Issue 標題：**
```
[新增議程] Kuro Chen 報名多個議程
```

**Issue 內容：**
````markdown
報名以下議程：

```json
{
  "name": "Kuro Chen",
  "sessions": ["S001", "S007", "S013", "S020"]
}
```
````

**預期結果：**
- ✅ 系統驗證通過
- ✅ 建立 PR 更新 `members.json`
- ✅ Kuro Chen 的 sessions 更新為 `["S001", "S007", "S013", "S020"]`
- ✅ 在 Issue 中留言確認成功

---

## 測試案例 3：包含一般性議程（應被過濾）

**Issue 標題：**
```
[新增議程] Shuni Chen 報名議程（含一般性議程）
```

**Issue 內容：**
````markdown
```json
{
  "name": "Shuni Chen",
  "sessions": ["check-in", "S005", "opening", "S010", "lunch", "S015"]
}
```
````

**預期結果：**
- ✅ 系統驗證通過
- ⚠️ `check-in`、`opening`、`lunch` 被自動過濾
- ✅ 建立 PR 更新 `members.json`
- ✅ Shuni Chen 的 sessions 更新為 `["S005", "S010", "S015"]`（不含一般性議程）
- ✅ 在 Issue 中留言確認成功

---

## 測試案例 4：包含無效議程代碼（應被過濾）

**Issue 標題：**
```
[新增議程] Oscar Chang 報名議程（含無效代碼）
```

**Issue 內容：**
````markdown
```json
{
  "name": "Oscar Chang",
  "sessions": ["S001", "INVALID", "S999", "S013", "ABC"]
}
```
````

**預期結果：**
- ✅ 系統驗證通過
- ⚠️ `INVALID`、`S999`、`ABC` 被自動過濾（不存在的代碼）
- ✅ 建立 PR 更新 `members.json`
- ✅ Oscar Chang 的 sessions 更新為 `["S001", "S013"]`（只保留有效代碼）
- ✅ 在 Issue 中留言確認成功

---

## 測試案例 5：更新現有報名（新增和移除）

假設 Aurora Liu 原本已經報名 `["S001", "S002"]`

**Issue 標題：**
```
[新增議程] Aurora Liu 更新報名
```

**Issue 內容：**
````markdown
```json
{
  "name": "Aurora Liu",
  "sessions": ["S002", "S015", "S020"]
}
```
````

**預期結果：**
- ✅ 系統驗證通過
- ✅ 建立 PR 更新 `members.json`
- ✅ Aurora Liu 的 sessions 更新為 `["S002", "S015", "S020"]`
  - ➖ 移除 `S001`（原有但新清單中沒有）
  - ✓ 保留 `S002`（原有且新清單中也有）
  - ➕ 新增 `S015` 和 `S020`（原本沒有但新清單中有）
- ✅ 在 Issue 中留言確認成功

---

## 測試案例 6：錯誤 - 成員不存在

**Issue 標題：**
```
[新增議程] Test User 報名
```

**Issue 內容：**
````markdown
```json
{
  "name": "Test User",
  "sessions": ["S001"]
}
```
````

**預期結果：**
- ❌ 系統驗證失敗
- ❌ 不會建立 PR
- ❌ 在 Issue 中留言說明錯誤：「Member "Test User" not found in members.json」

---

## 測試案例 7：錯誤 - 缺少必要欄位

**Issue 標題：**
```
[新增議程] 報名測試
```

**Issue 內容：**
````markdown
```json
{
  "name": "Jason Tsai"
}
```
````

**預期結果：**
- ❌ 系統驗證失敗
- ❌ 不會建立 PR
- ❌ 在 Issue 中留言說明錯誤：「JSON must contain "name" and "sessions" fields」

---

## 測試案例 8：錯誤 - JSON 格式錯誤

**Issue 標題：**
```
[新增議程] 格式錯誤測試
```

**Issue 內容：**
````markdown
```json
{
  "name": "Jason Tsai",
  "sessions": ["S013"
}
```
````

**預期結果：**
- ❌ 系統驗證失敗（JSON 格式錯誤）
- ❌ 不會建立 PR
- ❌ 在 Issue 中留言說明錯誤：「Invalid JSON format」

---

## 測試案例 9：錯誤 - Issue 標題格式錯誤

**Issue 標題：**
```
議程報名 Jason Tsai
```
（沒有以 `[新增議程]` 開頭）

**Issue 內容：**
````markdown
```json
{
  "name": "Jason Tsai",
  "sessions": ["S013"]
}
```
````

**預期結果：**
- ❌ Workflow 不會被觸發（因為 `if` 條件不符合）
- ❌ 不會有任何處理

---

## 測試案例 10：支援多種 JSON 格式

### 格式 1：Markdown 程式碼區塊（推薦）

````markdown
```json
{
  "name": "Jason Tsai",
  "sessions": ["S013", "S014"]
}
```
````

### 格式 2：直接貼上 JSON

```
{"name": "Jason Tsai", "sessions": ["S013", "S014"]}
```

### 格式 3：內文中包含其他文字

```
我想報名以下議程：

{"name": "Jason Tsai", "sessions": ["S013", "S014"]}

謝謝！
```

**所有格式都應該能夠正確解析！**

---

## 如何執行測試

### 方法 1：在 GitHub 上手動測試

1. 前往專案的 Issues 頁面
2. 點擊「New issue」
3. 選擇「新增議程」模板
4. 填寫測試資料
5. 提交 Issue
6. 觀察 Actions 執行結果

### 方法 2：使用本地測試腳本

```bash
cd /tmp
node test_workflow.js
```

這會執行本地的邏輯測試，驗證資料處理流程是否正確。

---

## 驗證檢查清單

在每次更新 workflow 後，應該驗證以下項目：

- [ ] YAML 語法正確
- [ ] 能正確解析 JSON（包含 markdown 程式碼區塊和直接貼上）
- [ ] 能正確驗證成員名稱
- [ ] 能正確驗證議程代碼
- [ ] 能正確過濾一般性議程（check-in、opening、lunch）
- [ ] 能正確過濾無效議程代碼
- [ ] 能正確更新 members.json
- [ ] 能正確建立 PR
- [ ] 能在 Issue 中正確留言（成功和失敗情況）
- [ ] PR 標題和內容正確
- [ ] PR 關閉後能自動關閉對應的 Issue

---

## 常見問題

### Q: 如果貼上的 JSON 中所有議程代碼都無效會怎樣？

A: 如果過濾後沒有任何有效的議程代碼，系統仍會建立 PR，但成員的 sessions 會被設為空陣列 `[]`。

### Q: 可以一次報名所有議程嗎？

A: 可以，只要列出所有想報名的議程代碼即可。例如：
```json
{
  "name": "Jason Tsai",
  "sessions": ["S001", "S002", "S003", ..., "S028"]
}
```

### Q: 如果我想取消所有報名怎麼辦？

A: 提交一個空的 sessions 陣列：
```json
{
  "name": "Jason Tsai",
  "sessions": []
}
```

### Q: PR 建立後我可以手動修改嗎？

A: 可以！PR 建立後，您可以直接在 GitHub 上編輯檔案或在本地 checkout 該分支進行修改。

### Q: 如果同一個成員連續提交多個 Issue 會怎樣？

A: 每個 Issue 都會建立一個獨立的 PR。最後合併的 PR 會決定最終的報名狀態。建議等前一個 PR 合併後再提交新的 Issue。
