---
name: 新增議程
about: 透過 Issue 自動化處理議程報名
title: '[新增議程] '
labels: session-registration
assignees: ''
---

## 成員資訊

請在下方貼上您的報名資料，格式必須為 JSON：

```json
{
  "name": "您的姓名（必須存在於 members.json）",
  "sessions": ["S013", "S014", "S015"]
}
```

## 範例

**單一議程報名：**
```json
{
  "name": "Jason Tsai",
  "sessions": ["S013"]
}
```

**多個議程報名：**
```json
{
  "name": "Jason Tsai",
  "sessions": ["S013", "S014", "S015", "S020"]
}
```

## 注意事項

- ✅ 成員姓名必須存在於 `members.json` 中
- ✅ 議程代碼必須有效（存在於 `sessions.json`）
- ⚠️ 一般性議程（check-in、opening、lunch）會被自動過濾
- ⚠️ 無效的議程代碼會被自動過濾
- ℹ️ 系統會完全替換您原有的議程清單（新增或移除）

## 可用成員名稱

- Kuro Chen
- Shuni Chen
- Oscar Chang
- Jason Tsai
- TC Tseng
- Lizard Liang
- Aurora Liu

## 可用議程代碼

請參考 [sessions.json](https://github.com/pig-01/gss-netconf-session/blob/main/data/sessions.json) 查看所有有效的議程代碼（S001 到 S028）。

---

提交此 Issue 後，系統會自動處理您的報名請求並建立 Pull Request。
詳細說明請參考：[議程自動化登記說明文件](https://github.com/pig-01/gss-netconf-session/blob/main/ISSUE_REGISTRATION.md)
