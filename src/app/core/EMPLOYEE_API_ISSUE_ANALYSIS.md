# Employee API 問題分析報告 - 已解決根本原因！

## 🎯 問題根本原因：SQL 欄位名稱不匹配

### 錯誤訊息
```
com.microsoft.sqlserver.jdbc.SQLServerException: ?⊥??????迂 'empCode'??
SQL: ORDER BY empCode ASC OFFSET 0 ROWS FETCH NEXT 10 ROWS ONLY
```

**明確問題**：
- ❌ SQL 使用 `ORDER BY empCode`（camelCase）
- ✅ 資料庫欄位是 `emp_code`（snake_case）
- 🔧 欄位名稱不匹配導致 SQL 錯誤

### 完整 SQL 分析
```sql
SELECT t.* FROM (
  SELECT e.*, d.dept_name as dept_name 
  FROM tb_bas_employee e 
  LEFT JOIN tb_bas_department d ON e.dept_id = d.dept_id 
  WHERE 1=1 
) t 
ORDER BY empCode ASC    -- ❌ 這裡應該是 emp_code
OFFSET 0 ROWS FETCH NEXT 10 ROWS ONLY
```

## 🔍 之前的錯誤分析

### 現象描述 (已釐清)
- 後端 API 回應成功 (`code: 1000`, `message: "操作成功"`) ✅
- `totalRecords: 8` 顯示資料庫確實有 8 筆員工資料 ✅  
- `dataList: []` 是空陣列 ❌ **原因：SQL 執行失敗**
- `pageSize: 0` ❌ **原因：查詢失敗導致沒有正確資料**

### 實際問題
不是分頁邏輯問題，而是 **後端 SQL 動態產生時沒有正確轉換排序欄位名稱**

## 🔧 解決方案

### 後端修正建議（優先）
1. **檢查 EmployeeRepositoryImpl.java**
   ```java
   // 確認排序欄位轉換
   String orderByClause = convertSortColumn(sortColumn); // empCode -> emp_code
   sql += " ORDER BY " + orderByClause + " " + sortDirection;
   ```

2. **修正排序欄位映射**
   ```java
   private String convertSortColumn(String camelCaseColumn) {
       Map<String, String> columnMapping = Map.of(
           "empCode", "emp_code",
           "empName", "emp_name", 
           "deptId", "dept_id"
           // 其他欄位映射...
       );
       return columnMapping.getOrDefault(camelCaseColumn, camelCaseColumn);
   }
   ```

### 前端暫時解決方案（已完成）
```typescript
// employee.service.ts 
private readonly useMockData = true; // ✅ 已修正
```

## 📋 後端檢查清單

### 立即修正
- [ ] **檢查 SQL ORDER BY 欄位名稱轉換**
- [ ] **確認所有動態 SQL 都正確處理 camelCase → snake_case**
- [ ] **測試排序功能**

### 測試驗證
- [ ] 測試 `sortColumn: "empCode"` → SQL: `ORDER BY emp_code`
- [ ] 測試 `sortColumn: "empName"` → SQL: `ORDER BY emp_name`
- [ ] 測試 `sortColumn: "deptId"` → SQL: `ORDER BY dept_id`

## 🎯 結論

**根本問題**：後端 SQL 查詢時沒有正確將前端的 camelCase 排序欄位轉換為資料庫的 snake_case 欄位名稱。

**解決步驟**：
1. ✅ 前端已切換回 mock data 確保正常運作
2. 🔧 **後端需要修正排序欄位的名稱轉換邏輯**
3. 🧪 後端修正完成後測試真實 API
4. 📊 確認修正後再將前端切回真實 API

**影響範圍**：所有需要排序功能的 API 都可能有相同問題。
