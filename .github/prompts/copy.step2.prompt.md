---
mode: 'agent'
tools: ['codebase', 'editFiles']
description: '自動生成 models'
---
# Step 2: 輸入本功能所有欄位/enum/驗證/角色權限

請完整列出新功能「欄位資訊」與「各角色權限」，以利自動產生 models、表單、欄位顯示及權限守衛。

## 欄位定義格式

- 欄位名稱（英文，kebab-case）
- 型別（number, string, boolean, date, enum, reference, optional/required 等）
- enum 選項（如適用，請列出所有可能值）
- 欄位描述（可選）
- 驗證需求（required, min/max, pattern, unique 等，可多條件）
- 只根據這份清單自動產生所有 table/form/view 欄位與驗證。

---

## 欄位範例

```markdown
courseId: number, required, primary key
courseName: string, required
isActive: boolean, required, default true
level: 'beginner' | 'advanced' | 'expert', enum
remark: string, optional
createTime: date, system, auto-filled
createUser: string, system, auto-filled
```

## 角色權限設定格式

請明確列出**每個角色對此功能的 CRUD 權限**，例如：
```markdown
admin: C R U D
supervisor: R
user: R
```
* C: Create（新增）
* R: Read（查詢/檢視）
* U: Update（編輯）
* D: Delete（刪除）
---

## 提交格式建議

```markdown
# 欄位定義

courseId: number, required, primary key
courseName: string, required
isActive: boolean, required, default true
level: 'beginner' | 'advanced' | 'expert', enum
remark: string, optional
createTime: date, system, auto-filled
createUser: string, system, auto-filled

```
```markdown
# 角色權限

admin: C R U D
supervisor: R
user: R
```

---
