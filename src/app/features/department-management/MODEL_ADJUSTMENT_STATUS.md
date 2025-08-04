# Department Model 調整狀態報告

## 🚨 **當前問題狀況**

Department 模組的 model 調整過程中發現以下問題：

### 1. **檔案結構損壞**
- `department.service.ts` 在調整 mock data 時發生結構混亂
- 存在重複的程式碼和語法錯誤
- 需要重新整理檔案結構

### 2. **Model 不一致問題**
- Department interface 已更新為 camelCase
- 但 service 中的 filters 處理還在使用 snake_case
- Mock data 和實際 API 格式不一致

## ✅ **已完成的調整**

### 1. **Department Model (✅ 完成)**
```typescript
export interface Department {
    deptId: number;
    parentDeptId: number | null;
    deptCode: string;
    deptName: string;
    deptLevel: string;
    managerEmpId: number | null;
    isActive: boolean;
    deptDesc?: string;
    createTime: Date;
    createUser: string;
    updateTime?: Date;
    updateUser?: string;
    parentDeptName?: string;
    managerName?: string;
}
```

### 2. **相關介面 (✅ 完成)**
```typescript
export interface CreateDepartmentRequest {
    deptCode: string;
    deptName: string;
    deptLevel: string;
    parentDeptId?: number | null;
    managerEmpId?: number | null;
    isActive: boolean;
    deptDesc?: string;
}

export interface DepartmentSearchFilters {
    keyword?: string;
    deptLevel?: string;
    isActive?: boolean;
    parentDeptId?: number;
}
```

### 3. **API 介面 (✅ 完成)**
```typescript
export interface ApiResponse<T> {
    code: number;
    message: string;
    data: T;
}

export interface PagerDto<T> {
    dataList: T[];
    totalRecords: number;
    firstIndexInPage: number;
    lastIndexInPage: number;
    pageable: boolean;
    sortColumn?: string;
    sortDirection?: string;
}
```

## ❌ **尚需修正的問題**

### 1. **Department Service**
- 檔案結構混亂，需要重新整理
- Mock data 格式需要統一為 camelCase
- Filter 處理邏輯需要更新

### 2. **Store 和 Component**
- 可能需要更新以配合新的 model 格式
- 檢查所有對 Department 屬性的引用

## 🛠️ **建議修正步驟**

### 步驟 1：修正 Service 檔案
```typescript
// 需要修正的地方
if (filters.dept_level) {  // ❌ 應該是 filters.deptLevel
    params.deptLevel = filters.dept_level;
}

// 正確的寫法
if (filters.deptLevel) {  // ✅
    params.deptLevel = filters.deptLevel;
}
```

### 步驟 2：更新 Mock Data
```typescript
// 所有 mock data 都需要使用 camelCase 屬性名
{
    deptId: 1,           // ✅ 不是 dept_id
    parentDeptId: null,  // ✅ 不是 parent_dept_id
    deptCode: 'CORP',    // ✅ 不是 dept_code
    // ...
}
```

### 步驟 3：檢查所有引用
- 檢查 component 中對 department 屬性的引用
- 檢查 HTML template 中的屬性綁定
- 更新 store 中的資料處理邏輯

## 🎯 **預期效果**

修正後將實現：
1. ✅ 統一的 camelCase 命名
2. ✅ 與 HTTP 攔截器完美配合
3. ✅ 簡化的資料處理邏輯
4. ✅ 與 job-role 模組一致的架構

## 📝 **下一步行動**

1. **立即行動**：重新整理 `department.service.ts` 檔案
2. **測試確認**：確保 department 功能正常運作
3. **統一檢查**：確認所有相關檔案使用正確的屬性名

現在需要您的確認：是否要我重新整理 `department.service.ts` 檔案？
