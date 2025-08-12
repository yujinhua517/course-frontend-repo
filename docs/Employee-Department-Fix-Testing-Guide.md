# 🧪 Employee 部門顯示修復 - 測試驗證指南

## 📋 測試前準備
1. 確保前端和後端服務都已啟動
2. 確保有測試資料：員工關聯到不同部門
3. 開啟瀏覽器開發者工具 (F12) 以觀察網路請求

## 🎯 核心測試場景

### 測試 1: 員工狀態切換後部門顯示
**測試步驟**：
1. 進入員工管理頁面
2. 找到一個有部門的員工 (確認部門欄位顯示正常)
3. 點擊該員工的「啟用/停用」切換按鈕
4. **期望結果**：
   - ✅ 狀態成功切換
   - ✅ 部門欄位仍然顯示部門名稱 (不是空白)
   - ✅ 無需重新整理頁面

**如果失敗**：部門欄位顯示空白 → 修復未生效

### 測試 2: 檢視功能中部門顯示
**測試步驟**：
1. 在上個測試後，點擊該員工的「檢視」按鈕
2. 查看詳細資訊中的部門欄位
3. **期望結果**：
   - ✅ 部門欄位顯示正確的部門名稱
   - ✅ 不是顯示「未指定」

### 測試 3: 智能補全機制測試
**測試步驟**：
1. 開啟開發者工具的 Network 分頁
2. 執行測試 1 的步驟
3. 觀察網路請求：
4. **期望結果**：
   - ✅ 看到 `POST /api/employees/toggle-status` 請求
   - ✅ 如果返回資料缺少 deptName，會自動發起 `POST /api/employees/query` 請求
   - ✅ 最終顯示正確的部門名稱

### 測試 4: 邊界情況測試
**測試步驟**：
1. 測試沒有部門的員工 (deptId 為 null)
2. 切換其狀態
3. **期望結果**：
   - ✅ 部門欄位顯示「未指定」
   - ✅ 不是顯示空白

## 🔍 詳細測試檢查點

### 後端 API 測試
使用 Postman 或類似工具測試：

```bash
# 測試 findById API 是否包含 deptName
GET /api/employees/find/{id}

# 期望回應包含：
{
  "code": 1000,
  "data": {
    "empId": 1,
    "empName": "張三",
    "deptId": 1,
    "deptName": "資訊部",  // ← 這個欄位必須存在
    "isActive": true
  }
}
```

### 前端 Console 測試
在瀏覽器 Console 中：

```javascript
// 檢查員工資料結構
console.log('Current employees:', window.employeeStore?.employees());

// 檢查特定員工的 deptName
const employees = window.employeeStore?.employees() || [];
employees.forEach(emp => {
    if (!emp.deptName && emp.deptId) {
        console.warn('Missing deptName for employee:', emp);
    }
});
```

## 🚨 常見問題排除

### 問題 1: 後端修復未生效
**症狀**：findById API 仍然不包含 deptName
**檢查**：
- 確認 EmployeeServiceImpl.java 已正確修改
- 重新編譯和啟動後端服務
- 檢查 application logs 是否有錯誤

### 問題 2: 前端補全機制未觸發
**症狀**：Network 中沒有看到額外的 query 請求
**檢查**：
- 確認 employee.service.ts 的 getEmployeeById 方法已修改
- 檢查 Console 是否有 debug 訊息：`deptName missing in findById, using query approach`

### 問題 3: 顯示層仍然空白
**症狀**：即使有 deptName 資料，顯示仍然空白
**檢查**：
- 確認 employee-list.component.html 包含 `|| '未指定'` 邏輯
- 檢查 highlight pipe 是否正常運作

## ✅ 測試通過標準

### 必須通過的測試
- [ ] 狀態切換後部門正常顯示 (不空白)
- [ ] 檢視功能中部門正確顯示
- [ ] 沒有部門的員工顯示「未指定」
- [ ] 無需重新整理頁面即可看到正確顯示

### 效能要求
- [ ] 狀態切換回應時間 < 2秒
- [ ] 不會產生過多的網路請求
- [ ] UI 不會閃爍或卡頓

### 相容性要求
- [ ] 現有功能正常運作
- [ ] 其他模組不受影響
- [ ] 新舊資料都能正確處理

## 📊 測試報告模板

```
# Employee 部門顯示修復測試報告

## 測試環境
- 測試時間：[日期時間]
- 前端版本：[Version]
- 後端版本：[Version]
- 瀏覽器：[Browser Version]

## 測試結果
### ✅ 通過的測試
1. [ ] 狀態切換後部門顯示
2. [ ] 檢視功能部門顯示
3. [ ] 智能補全機制
4. [ ] 邊界情況處理

### ❌ 失敗的測試
1. [ ] [描述失敗的測試項目]
   - 預期：[描述期望結果]
   - 實際：[描述實際結果]
   - 錯誤訊息：[如果有的話]

## 效能評估
- 狀態切換回應時間：[時間]
- 額外網路請求：[數量]
- 使用者體驗評分：[1-10]

## 建議
[任何改進建議或注意事項]
```

## 🎉 測試完成後確認

如果所有測試都通過，代表修復成功！這個三層防護機制確保了：

1. **後端資料完整性**：findById 現在返回包含 deptName 的完整資料
2. **前端智能補全**：即使後端資料不完整，前端會自動補全
3. **顯示層防護**：即使前兩層都失敗，也會顯示「未指定」而不是空白

這樣的設計確保了系統的健壯性和良好的使用者體驗。
