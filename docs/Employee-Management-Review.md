# Employee Management 模組程式碼審查報告

## 🎯 概述

本次審查針對 `employee-management` 模組進行全面的程式碼檢查，以確保符合 Angular 19+ 開發規範與最佳實踐。

---

## ✅ 符合規範項目

### 1. 現代 Angular 架構
- **✅ 使用 Signals**: 所有狀態管理都使用 `signal()`, `computed()`, `effect()`
- **✅ 現代 DI**: 統一使用 `inject()` 而非 constructor injection
- **✅ 現代控制流程**: HTML 模板使用 `@if`, `@for` 而非 `*ngIf`, `*ngFor`
- **✅ 新版 Input/Output**: 使用 `input()`, `output()` 而非 `@Input()`, `@Output()`
- **✅ Resource API**: 使用 `resource()` 處理資料載入

### 2. 專案結構
- **✅ Feature-first 架構**: 正確的目錄結構
- **✅ 三分檔**: 所有組件都有獨立的 `.ts`, `.html`, `.scss` 檔案
- **✅ 路由配置**: 使用 `loadComponent()` 進行 lazy loading

### 3. 共用組件使用
- **✅ 大量使用共用組件**: TableHeaderComponent, TableBodyComponent, PaginationComponent 等
- **✅ 避免重複造輪子**: 正確使用 shared 組件

### 4. 錯誤處理
- **✅ 統一錯誤處理**: 使用 `HttpErrorHandlerService`
- **✅ 標準化處理**: 所有 HTTP 請求都經過統一錯誤處理

### 5. Mock 資料切換
- **✅ 一鍵切換**: `useMockData` flag 可快速切換 mock/真實 API

---

## ⚠️ 違反規範項目

### 1. 禁止手動 subscribe() (高優先級)

**問題描述**: 在組件中直接使用 `subscribe()` 違反了 signals 導向的 reactive data flow 原則。

**影響檔案**:
- `employee-list.component.ts` (第 485, 515, 548 行)
- `employee.store.ts` (第 55 行)

**違規程式碼**:
```typescript
// ❌ 違規: 直接在組件中 subscribe
this.employeeService.deleteEmployee(employee.empId).subscribe({...});
this.employeeService.bulkDeleteEmployees?.(ids).subscribe({...});
this.employeeService.toggleActiveStatus(employee.empId).subscribe({...});

// ❌ 違規: Store 中手動 subscribe
this.employeeService.getEmployees(searchParams).subscribe({...});
```

**修正建議**:
```typescript
// ✅ 修正: 使用 resource() 和 signals
private readonly deleteResource = resource({
    request: this.deleteRequest,
    loader: ({ request }) => firstValueFrom(this.employeeService.deleteEmployee(request.id))
});

// 或使用 store 方法統一處理
onDelete(employee: Employee) {
    this.employeeStore.deleteEmployee(employee.empId);
}
```

### 2. 資料型別命名不一致 (中優先級)

**問題描述**: 模型定義與後端欄位命名不一致，應使用 camelCase。

**影響檔案**:
- `employee.model.ts`
- `employee-list.component.ts` 表頭配置

**違規程式碼**:
```typescript
// ❌ 部分使用 snake_case
columns: [
    { key: 'emp_code', label: '員工工號' },
    { key: 'emp_name', label: '員工姓名' },
    { key: 'dept_name', label: '所屬部門' }
]
```

**修正建議**:
```typescript
// ✅ 統一使用 camelCase
columns: [
    { key: 'empCode', label: '員工工號' },
    { key: 'empName', label: '員工姓名' },
    { key: 'deptName', label: '所屬部門' }
]
```

### 3. 重複的業務邏輯 (中優先級)

**問題描述**: 在 Service 和 Store 中有重複的分頁、篩選邏輯。

**影響檔案**:
- `employee.service.ts`
- `employee.store.ts`

**重複邏輯**:
- 分頁計算邏輯在兩處重複
- 篩選參數處理重複
- 排序邏輯分散

---

## 🔄 重構建議

### 1. 重構為 Resource-based 架構

**目標**: 完全移除手動 subscribe，改用 resource() 和 signals。

**實作步驟**:

1. **Store 重構** - 移除手動 subscribe
```typescript
// 建議新增至 employee.store.ts
private readonly employeesResource = resource({
    request: this.searchParams,
    loader: ({ request }) => firstValueFrom(this.employeeService.getEmployees(request))
});

readonly employees = computed(() => this.employeesResource.value()?.dataList ?? []);
readonly loading = computed(() => this.employeesResource.isLoading());
readonly error = computed(() => this.employeesResource.error());
```

2. **組件重構** - 移除所有 subscribe
```typescript
// 建議修改 employee-list.component.ts
private readonly deleteRequest = signal<{ id: number } | null>(null);
private readonly deleteResource = resource({
    request: this.deleteRequest,
    loader: ({ request }) => firstValueFrom(this.employeeService.deleteEmployee(request.id))
});

onDelete(employee: Employee) {
    this.deleteRequest.set({ id: employee.empId });
}
```

### 2. 統一資料型別命名

**建議新增工具函數**:
```typescript
// core/utils/employee-mapper.util.ts
export class EmployeeMapper {
    static toDisplayFormat(employee: Employee): EmployeeDisplay {
        return {
            empCode: employee.empCode,
            empName: employee.empName,
            deptName: employee.deptName,
            // ... 其他欄位
        };
    }
}
```

### 3. 抽取共用邏輯

**建議新增**:
```typescript
// shared/utils/pagination.util.ts
export class PaginationUtil {
    static calculatePage(firstIndex: number, pageSize: number): number {
        return Math.floor((firstIndex - 1) / pageSize) + 1;
    }
    
    static calculateFirstIndex(page: number, pageSize: number): number {
        return (page - 1) * pageSize + 1;
    }
}

// shared/utils/filter.util.ts
export class FilterUtil {
    static mergeSearchParams<T>(existing: T, updates: Partial<T>): T {
        return { ...existing, ...updates };
    }
}
```

---

## 🗑️ 冗餘程式碼

### 1. 重複的部門名稱對應

**檔案**: `employee.service.ts` (第 291-301 行)

```typescript
// ❌ 硬編碼的部門對應，應該從 DepartmentService 取得
private getDeptNameById(deptId: number): string {
    const deptMap: { [key: number]: string } = {
        1: '人力資源部',
        2: '財務部',
        // ...
    };
    return deptMap[deptId] || '未知部門';
}
```

**建議**: 移除此方法，改用 DepartmentService。

### 2. 未使用的方法

**檔案**: `employee-list.component.ts`

```typescript
// ❌ 註解掉的程式碼應該移除
// onToggleStatus(employee: Employee): void {
//     const updatedEmployee = { ...employee, is_active: !employee.is_active };
//     this.employeeService.updateEmployee(updatedEmployee.emp_id!, updatedEmployee).subscribe({
//         ...
//     });
// }
```

### 3. 重複的型別定義

**問題**: `ApiResponse<T>` 和 `PagerDto<T>` 在 employee.model.ts 中重複定義，應該從 core 匯入。

---

## 📊 效能優化建議

### 1. 表格效能優化

```typescript
// ✅ 建議在 TableBodyComponent 使用 OnPush 策略
@Component({
    changeDetection: ChangeDetectionStrategy.OnPush
})

// ✅ 使用 trackBy 函數優化大列表渲染
readonly trackByFn = (index: number, item: Employee) => item.empId;
```

### 2. 資料載入優化

```typescript
// ✅ 使用 defer 處理延遲載入
@defer (when loaded()) {
    <app-employee-table [employees]="employees()" />
} @placeholder {
    <app-loading-skeleton />
}
```

---

## 🧪 測試改善建議

### 1. 測試覆蓋率

**目前狀態**: 僅有 `employee.service.spec.ts`

**建議新增**:
- `employee.store.spec.ts`
- `employee-list.component.spec.ts`
- `employee-form.component.spec.ts`

### 2. 測試重構

**違規程式碼**:
```typescript
// ❌ 測試中使用 subscribe
service.getEmployees().subscribe(response => {
    expect(response).toBeDefined();
});
```

**建議修正**:
```typescript
// ✅ 使用 firstValueFrom 或 TestScheduler
const response = await firstValueFrom(service.getEmployees());
expect(response).toBeDefined();
```

---

## 🎯 優先修正順序

### 高優先級 (立即修正)
1. 移除所有手動 `subscribe()`，改用 resource() 和 signals
2. 統一資料型別命名為 camelCase
3. 移除註解程式碼和冗餘方法

### 中優先級 (本週完成)
1. 重構 Store 為完全基於 resource() 的架構
2. 抽取共用邏輯至 utils
3. 新增缺失的測試檔案

### 低優先級 (下個 Sprint)
1. 效能優化 (OnPush, trackBy, defer)
2. 完善測試覆蓋率
3. 文件更新

---

## 📝 結論

`employee-management` 模組整體架構良好，大部分都符合 Angular 19+ 規範。主要問題集中在：

1. **信號導向**: 需要完全移除手動 subscribe，改用 resource-based 架構
2. **命名一致性**: 需要統一使用 camelCase 命名
3. **程式碼整潔**: 需要移除冗餘和註解程式碼

修正這些問題後，此模組將成為符合最新 Angular 最佳實踐的典範。

**總體評分**: 7.5/10 ⭐⭐⭐⭐⭐⭐⭐

**主要優點**: 現代 Angular 語法、共用組件使用、清晰架構
**主要缺點**: 混用 subscribe 和 signals、命名不一致

---

*本報告生成時間: 2025年8月5日*  
*審查範圍: src/app/features/employee-management 完整模組*
