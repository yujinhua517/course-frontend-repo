---
mode: 'agent'
tools: ['codebase', 'editFiles']
description: ''
---

# Step 1: 指定要產生的功能與參考模板

請依下列格式輸入：

1. 你要產生的新功能/實體名稱（英文，kebab-case，例如：course、employee、department）
2. 請指定要 mirror 的現有功能或模板名稱（例如 employee-management、department-management），所有檔案結構、UI/SCSS/HTML 皆將 mirror 此模板。
3. 請提供後端 Controller、OpenAPI/Swagger、Java model 或其他資料模型檔案（如有），作為 model/interface 欄位定義依據。  
   如果沒有，請直接回覆「無」，系統會進入下個步驟要求手動定義欄位。

---

**填寫範例：**

```markdown
1. 新功能名稱：course
2. 參考模板：department-management
3. 後端資料模型：附檔（swagger.yaml 或 controller 連結或 Java class 片段）
