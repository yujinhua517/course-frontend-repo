# Department 模組問題修正報告

## 🚨 **發現的問題**

根據用戶提供的日誌分析，department 模組有以下問題：

### 1. **雙重轉換問題**
- ❌ service 手動處理 snake_case 轉換 
- ❌ HTTP 攔截器同時也在轉換
- ❌ 導致數據處理複雜且容易出錯

### 2. **參數格式不一致**
```javascript
// 發送參數混合格式
{
    page: 1,
    pageSize: 10,
    dept_level: "BU",  // snake_case
    is_active: true    // snake_case
}
```

### 3. **回應數據處理錯誤**
```javascript
// 日誌顯示的問題
原始回應: data_list: (6) [{...}], total_records: 0  // 有6筆資料但總數是0
處理後: data: [], total: 0  // 變成空陣列
```

## ✅ **修正方案**

### 1. **統一使用 HTTP 攔截器**

**修正前（❌）**：
```typescript
// 手動處理 snake_case 轉換
const departments = pagerDto.data_list ? pagerDto.data_list.map((dept: any) => ({
    dept_id: dept.dept_id,
    dept_code: dept.dept_code,
    // ... 大量手動映射
})) : [];

return {
    data: departments,
    total: pagerDto.total_records || departments.length,
    // ...
};
```

**修正後（✅）**：
```typescript
// 使用 camelCase，讓 HTTP 攔截器自動轉換
const params: any = {
    page,
    pageSize,
    isActive: filters.is_active,     // camelCase
    deptLevel: filters.dept_level,   // camelCase
    parentDeptId: filters.parent_dept_id  // camelCase
};

return this.http.get<ApiResponse<PagerDto<Department>>>(`${this.apiUrl}/query`, { params }).pipe(
    map(response => {
        // 攔截器已自動轉換，直接使用
        const departments = response.data.dataList || [];
        return {
            data: departments,
            total: response.data.totalRecords || departments.length,
            // ...
        };
    })
);
```

### 2. **簡化 Store 邏輯**

**修正前（❌）**：
```typescript
// 複雜的格式判斷
const departments = response.data || response.departments || [];
const total = response.total || response.data?.length || response.departments?.length || 0;
```

**修正後（✅）**：
```typescript
// service 已標準化，直接使用
const departments = response.data || [];
const total = response.total || 0;
```

## 📊 **預期效果**

修正後，資料流程變為：

```typescript
// 1. 前端發送 (camelCase)
{
    page: 1,
    pageSize: 10,
    isActive: true,
    deptLevel: "BU"
}

// 2. HTTP 攔截器轉換 (camelCase → snake_case)
{
    page: 1,
    page_size: 10,
    is_active: true,
    dept_level: "BU"
}

// 3. 後端回應 (snake_case)
{
    code: 1000,
    data: {
        data_list: [...],
        total_records: 6
    }
}

// 4. HTTP 攔截器轉換 (snake_case → camelCase)
{
    code: 1000,
    data: {
        dataList: [...],  // ✅ 自動轉換
        totalRecords: 6   // ✅ 正確的總數
    }
}
```

## 🎯 **修正的檔案**

1. **department.service.ts**
   - ✅ 移除手動 snake_case 轉換
   - ✅ 使用 camelCase 參數
   - ✅ 統一使用 HTTP 攔截器

2. **department.store.ts**
   - ✅ 簡化回應格式處理
   - ✅ 統一資料流程

## 📝 **測試建議**

1. 重新測試部門列表查詢
2. 確認總筆數正確顯示
3. 測試篩選功能
4. 確認分頁功能正常

現在 department 模組應該和 job-role 模組一樣，使用統一的資料轉換機制了！🎉
