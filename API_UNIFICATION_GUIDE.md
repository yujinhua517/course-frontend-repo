# 前端三個功能模組API統一化重構指南

## 🎯 重構目標
統一 `department`、`employee`、`job-role` 三個功能模組的查詢(查詢、排序、分頁)API設計和Service介面，並且依賴攔截器轉換。

## 📋 已完成的統一化工作

### 1. 建立統一核心模型 ✅
- **檔案**: `src/app/core/models/common.model.ts`
- **內容**: 
  - `BaseQueryDto` - 基礎查詢DTO
  - `PagerDto<T>` - 統一分頁結果格式
  - `ApiResponse<T>` - 統一API回應格式
  - `BaseSearchParams` - 統一查詢參數基礎介面
  - `QueryOptions<T,F>` - 統一查詢選項介面
  - `PAGINATION_DEFAULTS` - 分頁預設值

### 2. 建立統一工具函數 ✅
- **檔案**: `src/app/core/utils/query.util.ts`
- **內容**:
  - `PaginationUtil` - 分頁計算工具
  - `QueryParamsBuilder` - 查詢參數建構工具
  - `SortUtil` - 排序工具
  - `FilterUtil` - 篩選工具
  - `QueryTransformer` - 查詢參數轉換器

### 3. 建立統一基礎Service ✅
- **檔案**: `src/app/core/services/base-query.service.ts`
- **功能**: 抽象基礎Service類別，提供統一的查詢、分頁、排序邏輯

### 4. 更新各模組模型定義 ✅
- **Department**: 更新 `DepartmentSearchParams` 繼承 `BaseSearchParams`
- **Employee**: 更新 `EmployeeSearchParams` 繼承 `BaseSearchParams`
- **Job-Role**: 更新 `JobRoleSearchParams` 繼承 `BaseSearchParams`

### 5. 建立重構範例 ✅
- **檔案**: `src/app/features/job-role-management/services/job-role.service.refactored.ts`
- **檔案**: `src/app/features/job-role-management/store/job-role.store.refactored.ts`
- **功能**: 完整的重構範例，展示如何使用統一的Service和Store設計

## 🏗️ 統一架構設計

### Service 層架構
```
BaseQueryService<T, TSearchParams>
├── 統一的分頁查詢邏輯
├── Mock 資料處理
├── API 參數轉換
├── 回應適配
└── 錯誤處理

DepartmentService extends BaseQueryService
EmployeeService extends BaseQueryService  
JobRoleService extends BaseQueryService
```

### 核心特性
1. **完全依賴攔截器**: 所有前後端格式轉換都由 `case-conversion.interceptor.ts` 處理
2. **統一API格式**: 所有模組使用相同的查詢、分頁、排序參數格式
3. **類型安全**: 使用 TypeScript 泛型確保類型正確性
4. **Signal-based**: 使用 Angular 19+ 的 Signal 狀態管理
5. **可重用性**: 共用邏輯抽取到基礎類別和工具函數

## � 實際重構步驟

### 步驟 1: 重構 Service 類別
以 Job-Role Service 為例，參考 `job-role.service.refactored.ts`:

```typescript
@Injectable({
  providedIn: 'root'
})
export class JobRoleService extends BaseQueryService<JobRole, JobRoleSearchParams> {
  // 基礎配置
  protected readonly apiUrl = `${environment.apiBaseUrl}/job-roles`;
  protected readonly useMockData = false;
  protected readonly defaultSortColumn = 'jobRoleCode';
  protected readonly mockData = MOCK_JOB_ROLES;

  // 覆寫方法
  protected override mapSortColumn(frontendColumn?: string): string {
    const mapping: Record<string, string> = {
      'jobRoleCode': 'job_role_code',
      'jobRoleName': 'job_role_name',
      'isActive': 'is_active'
    };
    return mapping[frontendColumn || ''] || 'job_role_code';
  }

  protected override applyMockFilters(data: JobRole[], params?: JobRoleSearchParams): JobRole[] {
    // 自訂篩選邏輯
  }

  protected override buildCustomApiParams(params?: JobRoleSearchParams): Record<string, any> {
    // 自訂 API 參數
  }
}
```

### 步驟 2: 重構 Store 類別
參考 `job-role.store.refactored.ts`:

```typescript
@Injectable({ providedIn: 'root' })
export class JobRoleStore {
  private readonly jobRoleService = inject(JobRoleService);
  
  // Signal-based 狀態管理
  private readonly _jobRoles = signal<JobRole[]>([]);
  private readonly _searchParams = signal<JobRoleSearchParams>({...});
  
  // 統一的查詢方法
  loadJobRoles(params?: JobRoleSearchParams): void {
    this.jobRoleService.getPagedData(params).subscribe({
      next: (response) => {
        this._jobRoles.set(response.data.dataList);
        // ... 更新其他狀態
      }
    });
  }
}
```

### 步驟 3: 更新 Component
Component 層無需大幅修改，主要是使用新的 Store 介面:

```typescript
export class JobRoleListComponent {
  private readonly jobRoleStore = inject(JobRoleStore);
  
  // 使用 Store 的 signals
  jobRoles = this.jobRoleStore.jobRoles;
  isLoading = this.jobRoleStore.isLoading;
  
  onSearch(keyword: string): void {
    this.jobRoleStore.searchJobRoles(keyword);
  }
}
```

## 🔧 具體修改清單

### 需要修改的檔案

#### Department 模組
- [ ] `department.service.ts` - 繼承 BaseQueryService
- [ ] `department.store.ts` - 使用統一的 Service 介面
- [ ] `department-list.component.ts` - 更新 Store 調用

#### Employee 模組  
- [ ] `employee.service.ts` - 繼承 BaseQueryService
- [ ] `employee.store.ts` - 使用統一的 Service 介面
- [ ] `employee-list.component.ts` - 更新 Store 調用

#### Job-Role 模組
- [ ] `job-role.service.ts` - 繼承 BaseQueryService
- [ ] `job-role.store.ts` - 使用統一的 Service 介面  
- [ ] `job-role-list.component.ts` - 更新 Store 調用

### 可以移除的重複代碼
- [ ] 各模組中重複的分頁計算邏輯
- [ ] 各模組中重複的 API 參數轉換邏輯
- [ ] 各模組中重複的排序處理邏輯
- [ ] 各模組中重複的錯誤處理邏輯

## ✅ 統一後的優勢

### 1. API 設計一致性
- 所有模組使用相同的查詢參數格式
- 統一的分頁回應結構
- 一致的排序和篩選邏輯

### 2. 代碼重用性
- 共用的基礎 Service 類別
- 統一的工具函數
- 減少重複代碼量

### 3. 維護性提升
- 修改一處影響全部模組
- 統一的錯誤處理策略
- 一致的開發模式

### 4. 類型安全
- TypeScript 泛型確保類型正確
- 編譯時期型別檢查
- IntelliSense 支援

### 5. 依賴攔截器
- 完全依賴 HTTP 攔截器進行格式轉換
- Service 層保持純淨
- 自動處理 camelCase ↔ snake_case 轉換

## � 後續優化建議

1. **新增單元測試**: 為統一的 Service 和 Store 建立完整的測試
2. **效能優化**: 使用 OnPush 變更偵測策略
3. **快取機制**: 在 Service 層加入適當的快取策略
4. **錯誤處理**: 統一的錯誤處理和用戶提示機制
5. **文件完善**: 補充 API 文件和使用範例

這樣的統一化設計確保了三個功能模組在查詢、分頁、排序方面的完全一致性，同時充分利用了攔截器來處理前後端資料格式轉換，大幅提升了代碼的可維護性和開發效率。
