# Quick Reference - 議程自動化登記

## 三步驟完成報名 🚀

### 1️⃣ 建立 Issue
- 點擊 **New Issue** → 選擇 **新增議程** 模板
- 標題會自動帶入 `[新增議程]` 前綴

### 2️⃣ 填寫 JSON
```json
{
  "name": "您的姓名",
  "sessions": ["S013", "S014", "S015"]
}
```

### 3️⃣ 提交並等待
- 系統自動處理（約 30-60 秒）
- 建立 PR 供審核
- 在 Issue 中留言告知結果

---

## 可用成員名稱 👥

```
- Kuro Chen
- Shuni Chen
- Oscar Chang
- Jason Tsai
- TC Tseng
- Lizard Liang
- Aurora Liu
```

---

## 議程代碼範例 📅

```
S001 - 關於語境工程（context engineering)的奇淫巧技
S002 - AI Agent啟動指南：全面解析Responses API與Realtime API
S013 - ASP.NET Core 10.0 全新功能探索
S014 - Azure AI Foundry 上的企業級 Agent 開發實踐
...

完整清單請查看 data/sessions.json
```

---

## 常見範例 💡

### 範例 1：首次報名
```json
{
  "name": "Jason Tsai",
  "sessions": ["S013"]
}
```

### 範例 2：報名多個議程
```json
{
  "name": "Kuro Chen",
  "sessions": ["S001", "S007", "S013", "S020"]
}
```

### 範例 3：取消所有報名
```json
{
  "name": "Oscar Chang",
  "sessions": []
}
```

---

## 自動處理規則 🤖

✅ **會自動過濾的項目：**
- `check-in` - 報到
- `opening` - Opening
- `lunch` - 午餐
- 無效的議程代碼（如 `S999`, `INVALID`）

⚠️ **會導致失敗的情況：**
- 成員名稱不存在
- JSON 格式錯誤
- 缺少必要欄位（name 或 sessions）

---

## 疑難排解 🔧

### ❌ 處理失敗？

檢查以下項目：
1. Issue 標題是否以 `[新增議程]` 開頭？
2. JSON 格式是否正確（使用雙引號 `"`）？
3. 成員名稱是否完全符合（含大小寫）？
4. 是否至少有一個有效的議程代碼？

### 🔍 查看詳細錯誤

1. 前往 **Actions** 頁面
2. 找到對應的 workflow run
3. 查看執行日誌

---

## JSON 格式檢查 ✏️

### ✅ 正確格式
```json
{
  "name": "Jason Tsai",
  "sessions": ["S013", "S014"]
}
```

### ❌ 錯誤格式
```json
{
  'name': 'Jason Tsai',        // ❌ 使用單引號
  'sessions': ['S013', 'S014'] // ❌ 使用單引號
}
```

```json
{
  "name": "Jason Tsai",
  "sessions": ["S013", "S014"  // ❌ 缺少結尾括號
}
```

---

## 進階技巧 🎓

### 技巧 1：使用 Markdown 程式碼區塊（推薦）

````markdown
我想報名以下議程：

```json
{
  "name": "Jason Tsai",
  "sessions": ["S013", "S014"]
}
```

謝謝！
````

### 技巧 2：直接貼上 JSON

```
{"name": "Jason Tsai", "sessions": ["S013", "S014"]}
```

兩種方式都可以！系統會自動識別。

---

## 更新邏輯說明 📝

**系統會完全替換您的議程清單**

假設原本報名：`["S001", "S002"]`

提交新的報名：`["S002", "S013"]`

結果會是：`["S002", "S013"]`

- ➖ 移除 `S001`（原有但新清單沒有）
- ✓ 保留 `S002`（兩邊都有）
- ➕ 新增 `S013`（新清單有但原本沒有）

---

## 相關連結 🔗

- 📖 [完整使用說明](ISSUE_REGISTRATION.md)
- 🧪 [測試範例](TESTING_EXAMPLES.md)
- ⚙️ [技術文件](IMPLEMENTATION.md)
- 📊 [議程資料](data/sessions.json)
- 👥 [成員資料](data/members.json)

---

## 需要協助？ 💬

如有問題，請：
1. 查看 [完整使用說明](ISSUE_REGISTRATION.md)
2. 參考 [測試範例](TESTING_EXAMPLES.md)
3. 在 Issue 中留言詢問

---

**版本：v1.0** | **更新日期：2025-11-19**
