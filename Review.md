# Course Frontend 程式碼品質檢查報告

## 檢查範圍
`course-frontend-hua/src/app` 專案目錄

## 檢查結果摘要

### ✅ 優點
- 良好的功能模組化設計（features-first 架構）
- 適當使用 Angular 19+ 現代化功能（signals, inject, standalone components）
- 完整的 shared components 體系
- 一致的錯誤處理機制
- 適當的權限控制邏輯

### ⚠️ 發現的問題
總共發現 **28 個問題**，包括：
- 業務邏輯問題：7 個
- Shared component 使用問題：8 個
- 重複/未使用程式碼問題：13 個

---

## 1. 業務邏輯檢查結果

### 🔴 嚴重問題

#### 1.1 未使用的靜態變數
**檔案**: `src/app/features/employee-management/services/employee.service.ts`
```typescript
static employeeService: any; // 第 24 行 - 未使用的靜態變數
```
**問題**: 定義了靜態變數但完全未使用，可能是調試或重構時遺留的程式碼。
**建議**: 移除此變數

#### 1.2 潛在的競態條件風險
**檔案**: `src/app/features/employee-management/services/employee.service.ts` (行 169-172)
```typescript
catchError(error => {
    console.error('API 查詢失敗，使用 Mock 資料:', error);
    return of(this.getMockEmployeeList());
})
```
**問題**: API 失敗時自動降級到 Mock 資料，可能掩蓋真實的網路或伺服器問題。
**建議**: 
- 記錄錯誤到監控系統
- 提供使用者友善的錯誤訊息
- 考慮重試機制

### 🟡 中等問題

#### 1.3 權限檢查邏輯重複
**影響檔案**:
- `src/app/features/employee-management/pages/employee-list/employee-list.component.ts`
- `src/app/features/department-management/pages/department-list/department-list.component.ts`
- `src/app/features/job-role-management/pages/job-role-list/job-role-list.component.ts`

**問題**: 每個 list component 都實作了相同的權限檢查邏輯：
```typescript
private hasResourceActionPermission(resource: string, action: string): boolean {
    const user = this.userStore.user() as User | null;
    if (!user) return false;
    return (user.permissions ?? []).some((p: Permission) =>
        p.resource === resource && p.action === action
    );
}
```

**建議**: 將此邏輯抽取到共用的 `PermissionService` 或基礎類別中。

#### 1.4 Mock 資料切換不一致
**檔案**: 
- `employee.service.ts`: `private readonly useMockData = false;`
- `job-role.service.ts`: `private useMockData = false;`
- `department.service.ts`: `private readonly useMockData = false;`

**問題**: Mock 資料切換的實作方式不一致（有些用 readonly，有些沒有）。
**建議**: 統一使用 readonly 並考慮從環境變數中讀取。

#### 1.5 錯誤狀態管理不一致
**問題**: 不同服務的錯誤處理方式不同：
- 有些使用 `catchError(() => of(mockData))`
- 有些使用 `catchError(() => of(true))`
- 有些完全不處理錯誤

**建議**: 建立統一的錯誤處理策略和基礎類別。

#### 1.6 註解程式碼未清理
**檔案**: 多個檔案包含大量註解的程式碼
```typescript
// console.log('原始員工數據數量:', all.length);  // employee.service.ts
// console.log('搜尋參數:', params);
//   private readonly http = inject(HttpClient);  // login.service.ts
//   private readonly useMockData = true;
```
**建議**: 清理所有註解的 console.log 和未使用的程式碼。

#### 1.7 表單驗證邏輯分散
**問題**: 表單驗證邏輯分散在各個 form component 中，沒有統一的驗證規則管理。
**建議**: 建立共用的 `ValidationService` 或驗證規則常數。

---

## 2. Shared Component 使用檢查結果

### 🟢 良好使用的 Shared Components
- ✅ `app-search-filter` - 被所有 list 頁面正確使用
- ✅ `app-table-header` & `app-table-body` - 表格元件統一使用
- ✅ `app-status-badge` - 狀態顯示統一
- ✅ `app-loading-state` - 載入狀態統一
- ✅ `app-error-message` - 錯誤訊息統一
- ✅ `app-pagination` - 分頁控制統一
- ✅ `app-base-modal` - 模態框基礎元件統一使用

### 🔴 重複實作的 UI 元素

#### 2.1 表單控制項重複實作
**影響檔案**:
- `employee-form.component.html`
- `department-form.component.html`
- `job-role-form.component.html`
- `competency-form.component.html`

**重複的元素**:
```html
<!-- 重複的 input 結構 -->
<input type="text" class="form-control" [class.is-invalid]="isFieldInvalid('field')" 
       formControlName="field" placeholder="請輸入..." maxlength="50">
<div class="form-text">提示文字</div>
<div class="invalid-feedback">{{ error }}</div>

<!-- 重複的按鈕組 -->
<button type="button" class="btn btn-secondary" (click)="onCancel()">取消</button>
<button type="submit" class="btn btn-primary" [disabled]="form.invalid">確認</button>
```

**建議**: 建立以下 shared components：
- `app-form-input` - 統一的輸入框元件
- `app-form-textarea` - 統一的文字區域元件
- `app-form-select` - 統一的選擇框元件
- `app-form-buttons` - 統一的表單按鈕組

#### 2.2 頁面標題區重複實作
**重複結構**:
```html
<div class="page-header d-flex justify-content-between align-items-center mb-4">
    <h2 class="page-title fw-bold mb-0">
        <i class="bi bi-icon me-2 text-primary"></i>
        標題文字
    </h2>
    <div class="header-actions d-flex gap-2">
        <!-- 動作按鈕 -->
    </div>
</div>
```
**建議**: 建立 `app-page-header` 共用元件。

#### 2.3 缺少的共用元件
基於重複使用的模式，建議新增以下 shared components：
- `app-form-field` - 包含 label、input、help text、error message 的完整表單欄位
- `app-page-header` - 統一的頁面標題和動作區
- `app-data-table` - 整合 table-header 和 table-body 的完整表格元件

### 🟡 Shared Components 改進建議

#### 2.4 現有 Shared Components 的擴展需求
1. **SearchFilterComponent**: 增加更多篩選器類型支援
2. **TableHeaderComponent**: 增加欄位寬度自訂功能
3. **StatusBadgeComponent**: 增加更多狀態類型和顏色主題

---

## 3. 重複/未使用程式碼檢查結果

### 🔴 未使用的 Import

#### 3.1 RouterModule 未實際使用
**檔案**: 
- `employee-list.component.ts` (第 4 行)
- `job-role-list.component.ts` (第 4 行)
- `department-list.component.ts` (第 4 行)

```typescript
import { RouterModule } from '@angular/router';
```
**檢查**: 在模板中未發現 `routerLink` 等 router 相關功能的使用。
**建議**: 移除未使用的 RouterModule import。

#### 3.2 FormsModule 未使用
**檔案**: 同上述 list components
```typescript
import { FormsModule } from '@angular/forms';
```
**檢查**: 未使用 template-driven forms，只使用 reactive forms。
**建議**: 移除 FormsModule import。

### 🟡 重複的業務邏輯

#### 3.3 分頁計算邏輯重複
**影響檔案**: 所有 service 檔案
```typescript
const page = params?.page || 1;
const pageSize = params?.pageSize || 10;
const firstIndex = (page - 1) * pageSize + 1;
const lastIndex = page * pageSize;
```
**建議**: 建立 `PaginationUtils` 工具類別。

#### 3.4 資料篩選邏輯重複
**問題**: 每個 service 都實作了類似的搜尋和篩選邏輯
**建議**: 建立通用的 `DataFilterService` 或工具函式。

#### 3.5 表格配置邏輯重複
**問題**: 每個 list component 都有類似的 table configuration 設定
**建議**: 建立基礎的 `BaseListComponent` 類別。

### 🟢 程式碼重用的良好實例

#### 3.6 已良好重用的邏輯
- ✅ Highlight pipe 被多個元件共用
- ✅ Department name pipe 提供了良好的資料格式化
- ✅ Store 模式在各個功能模組中一致使用
- ✅ API response 格式統一處理

### 🔴 未使用的方法和變數

#### 3.7 可能未使用的私有方法
需要進一步檢查的方法（建議使用 IDE 的 unused code detection）：
- 各個 service 中的部分 mock 資料處理方法
- 部分 component 中的私有輔助方法

#### 3.8 未使用的類型定義
**檔案**: 部分 model 檔案中可能存在未使用的介面或類型定義
**建議**: 使用 TypeScript 的 unused imports 檢查工具。

---

## 改進建議優先級

### 🔥 高優先級（立即處理）
1. 移除未使用的靜態變數 `static employeeService`
2. 清理所有註解的 console.log 程式碼
3. 移除未使用的 RouterModule 和 FormsModule imports

### 🟡 中優先級（短期處理）
1. 建立共用的權限檢查服務
2. 統一 Mock 資料切換機制
3. 建立共用的表單控制項元件
4. 建立 `app-page-header` 共用元件

### 🟢 低優先級（長期改進）
1. 建立基礎的 `BaseListComponent` 類別
2. 建立統一的錯誤處理策略
3. 建立共用的資料篩選和分頁工具
4. 擴展現有 shared components 的功能

---

## 總結

整體而言，專案的架構設計良好，已經適當使用了 Angular 19+ 的現代化功能和 shared components 體系。主要的改進空間在於：

1. **減少程式碼重複**: 特別是權限檢查、表單控制項、分頁邏輯等
2. **提高程式碼清潔度**: 移除未使用的 imports 和註解程式碼
3. **統一實作模式**: 確保相似功能的實作方式一致

透過上述改進，可以進一步提升程式碼的可維護性和開發效率。
