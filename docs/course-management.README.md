# Course Management Module

> 基於 Angular 19+ 技術架構的企業級課程管理系統，提供完整的課程資料管理功能，支援動態選項載入、權限控制、無障礙設計等現代化特性。

## 🎯 模組概述

課程管理模組 (`course-management`) 是一個完整的 Angular 19+ 企業級功能模組，提供課程的增刪改查、檢視詳情、批量操作等功能。模組採用最新的 Angular 技術標準實現，包括 signals、standalone components、新版控制流語法等。

## 📁 模組結構

```
src/app/features/course-management/
├── components/                    # 功能組件
│   ├── course-form/              # 課程表單組件 (新增/編輯)
│   │   ├── course-form.component.ts
│   │   ├── course-form.component.html
│   │   └── course-form.component.scss
│   └── course-view/              # 課程檢視組件
│       ├── course-view.component.ts
│       ├── course-view.component.html
│       └── course-view.component.scss
├── models/                       # 資料模型
│   └── course.model.ts          # 課程相關型別定義
├── pages/                       # 頁面組件
│   ├── course-list.component.ts # 課程列表頁面
│   ├── course-list.component.html
│   └── course-list.component.scss
├── services/                    # 業務服務
│   ├── course.service.ts        # 課程 API 服務
│   └── mock-course.data.ts     # 測試資料
└── course-management.routes.ts  # 路由配置
```

## 🚀 技術特色

### Angular 19+ 現代化架構
- ✅ **Standalone Components**: 完全獨立的組件架構
- ✅ **Signals 響應式系統**: `computed()`, `resource()`, `input()`, `output()`
- ✅ **新版控制流**: `@if`, `@for`, `@switch`, `@defer` 語法
- ✅ **OnPush 變更檢測**: 所有組件使用 `ChangeDetectionStrategy.OnPush`
- ✅ **Inject 依賴注入**: 使用 `inject()` 函數式注入

### 共用元件整合
- ✅ **表單組件**: FormModalBaseComponent, FormFieldComponent, FormButtonsComponent
- ✅ **資料展示**: TableHeaderComponent, TableBodyComponent, PaginationComponent
- ✅ **狀態管理**: LoadingStateComponent, ErrorMessageComponent, EmptyStateComponent
- ✅ **互動組件**: ConfirmationModalComponent, StatusBadgeComponent, ActionButtonGroupComponent

### 資料管理架構
- ✅ **靜態選項管理**: learningType, skillType, level 使用預定義靜態選項，符合 spec 規格
- ✅ **動態課程活動載入**: courseEvent 選項從後端動態載入，確保資料即時性
- ✅ **三態顯示邏輯**: loading → error → success 完整狀態處理
- ✅ **課程活動整合**: 與 course-event-management 模組無縫整合
- ✅ **錯誤處理**: 統一的錯誤處理機制和使用者回饋

## 📋 功能清單

### 🔍 課程列表查詢
- **篩選條件**: 課程活動、課程名稱、學習類型、技能類型、等級、狀態
- **混合選項策略**: 課程活動選項動態載入，分類選項使用靜態定義
- **搜尋功能**: 支援關鍵字搜尋和高亮顯示
- **排序功能**: 多欄位排序，記住使用者偏好
- **分頁控制**: 自訂頁數、跳頁、總數顯示

### ➕ 課程新增
- **模態視窗**: 使用模態視窗提供流暢的新增體驗
- **表單驗證**: 完整的前端驗證和後端驗證整合
- **選項管理**: 課程活動動態載入，學習類型等使用靜態選項
- **錯誤處理**: 詳細的驗證錯誤提示和修正引導

### ✏️ 課程編輯
- **資料預載**: 自動載入現有課程資料到表單
- **差異檢測**: 只更新有變更的欄位
- **關聯驗證**: 課程活動關聯性檢查
- **審計追蹤**: 自動記錄修改時間和修改者

### 👁️ 課程詳情檢視
- **多區塊顯示**: 基本資訊、課程描述、系統資訊三大區塊
- **動態活動名稱**: 即時顯示關聯的課程活動名稱
- **載入狀態**: 完整的載入、錯誤、成功狀態顯示
- **無障礙設計**: 完整的 ARIA 標籤和語義化標記

### 🗑️ 課程刪除
- **單筆刪除**: 個別課程刪除，含確認對話框
- **批量刪除**: 多選課程批量刪除功能
- **狀態管理**: 刪除過程的載入狀態和錯誤處理
- **資料同步**: 刪除後自動重新載入列表

### 🔄 狀態管理
- **狀態切換**: 課程啟用/停用狀態即時切換
- **確認機制**: 狀態變更前的確認對話框
- **批量操作**: 支援批量狀態變更
- **視覺回饋**: 狀態切換的即時視覺回饋

## 🛠️ 技術實現

### 選項管理策略
```typescript
// 靜態選項定義（符合 spec 規格）
export const LEARNING_TYPE_OPTIONS = [
  { value: '實體', label: '實體' },
  { value: '線上', label: '線上' },
  { value: '混合', label: '混合' }
] as const;

export const SKILL_TYPE_OPTIONS = [
  { value: '軟體力', label: '軟體力' },
  { value: '數據力', label: '數據力' },
  { value: '雲', label: '雲' }
] as const;

export const LEVEL_OPTIONS = [
  { value: '入門', label: '入門' },
  { value: '初級', label: '初級' },
  { value: '中級', label: '中級' },
  { value: '高級', label: '高級' },
  { value: '專家', label: '專家' }
] as const;

// 動態課程活動載入
private readonly courseEventsResource = resource({
  loader: () => firstValueFrom(this.courseEventService.getPagedData({
    pageable: false,
    isActive: true
  }))
});

readonly courseEventOptions = computed(() => {
  const response = this.courseEventsResource.value();
  if (!response?.data?.dataList) return [];
  return response.data.dataList.map((event: CourseEvent) => ({
    value: event.courseEventId || 0,
    label: `${event.year} ${event.semester} - ${event.activityTitle}`
  }));
});
```

### 表單管理
```typescript
// 繼承 FormModalBaseComponent 統一表單邏輯
export class CourseFormComponent extends FormModalBaseComponent<Course, CourseCreateDto, CourseUpdateDto> {
  // 靜態選項引用
  readonly learningTypeOptions = LEARNING_TYPE_OPTIONS;
  readonly skillTypeOptions = SKILL_TYPE_OPTIONS;
  readonly levelOptions = LEVEL_OPTIONS;
  
  // 動態課程活動選項
  readonly courseEventOptions = computed(() => {
    const response = this.courseEventsResource.value();
    if (!response?.data?.dataList) return [];
    return response.data.dataList.map((event: CourseEvent) => ({
      value: event.courseEventId || 0,
      label: `${event.year} ${event.semester} - ${event.activityTitle}`
    }));
  });

  // 表單驗證和提交邏輯
  protected override buildFormControls() {
    return {
      courseEventId: ['', [Validators.required]],
      courseName: ['', [Validators.required, Validators.maxLength(255)]],
      learningType: ['', [Validators.required]],
      skillType: ['', [Validators.required]],
      level: ['', [Validators.required]],
      hours: [0, [Validators.required, Validators.min(0.1), Validators.max(99.9)]],
      // ...其他欄位
    };
  }
}
```

### 權限控制
```typescript
// 整合 UserStore 進行權限控制
private userStore = inject(UserStore);

readonly permissions = computed(() => ({
  create: this.userStore.hasPermission('course', 'create'),
  read: this.userStore.hasPermission('course', 'read'),
  update: this.userStore.hasPermission('course', 'update'),
  delete: this.userStore.hasPermission('course', 'delete')
}));
```

## 🎨 UI/UX 設計

### 響應式設計
- **Bootstrap 5**: 完整的響應式網格系統
- **行動優先**: 優先考慮行動裝置使用體驗
- **彈性佈局**: 自適應不同螢幕尺寸和解析度

### 無障礙設計
- **ARIA 標籤**: 完整的可訪問性標記
- **鍵盤導航**: 支援完整的鍵盤操作
- **螢幕閱讀器**: 優化螢幕閱讀器支援
- **色彩對比**: 符合 WCAG 2.1 AA 標準

### 使用者體驗
- **載入狀態**: 清晰的載入指示和進度回饋
- **錯誤處理**: 友善的錯誤訊息和修正建議
- **確認機制**: 重要操作的確認對話框
- **即時回饋**: 操作結果的即時視覺回饋

## 🔧 開發指南

### 安裝依賴
```bash
# 安裝項目依賴
pnpm install

# 啟動開發伺服器
pnpm start
```

### 路由設定
```typescript
// app.routes.ts
{
  path: 'courses',
  loadChildren: () => import('./features/course-management/course-management.routes')
    .then(m => m.COURSE_MANAGEMENT_ROUTES)
}
```

### 環境設定
```typescript
// environment.ts
export const environment = {
  apiUrl: 'http://localhost:8080/api',
  mockMode: false, // 設定為 true 使用模擬資料
};
```

## 🎯 架構決策

### 靜態 vs 動態選項策略

基於 spec 規格要求和效能考量，採用混合選項管理策略：

**靜態選項 (Static Options)**
- **learningType**: 實體、線上、混合
- **skillType**: 軟體力、數據力、雲  
- **level**: 入門、初級、中級、高級、專家
- **優勢**: 
  - 符合 spec 預定義規格
  - 減少網路請求，提升載入效能
  - 避免選項載入錯誤影響表單使用
  - 型別安全，編譯時檢查

**動態選項 (Dynamic Options)**
- **courseEvent**: 課程活動選項從後端即時載入
- **優勢**:
  - 確保活動資料即時性和正確性
  - 支援管理員動態新增/修改活動
  - 避免硬編碼活動資料

## 📊 效能優化

### 渲染優化
- **@defer**: 使用延遲載入優化首屏渲染
- **trackBy**: 列表渲染使用 trackBy 函數減少重複渲染
- **OnPush**: 所有組件使用 OnPush 策略減少變更檢測

### 資料載入優化
- **resource()**: 使用 Angular 19+ resource API 管理非同步資料
- **靜態選項優化**: learningType, skillType, level 使用靜態選項，減少不必要的 API 請求
- **快取機制**: 適當的資料快取減少 API 呼叫
- **分頁載入**: 大量資料的分頁載入機制

### 記憶體管理
- **signals**: 使用 signals 自動管理訂閱和取消訂閱
- **computed()**: 使用 computed 進行高效的衍生資料計算
- **static constants**: 靜態選項常數減少物件建立和記憶體使用
- **resource 清理**: 自動的資源清理和記憶體回收

## 🧪 測試策略

### 單元測試
```bash
# 執行單元測試
pnpm test

# 測試覆蓋率報告
pnpm test:coverage
```

### E2E 測試
```bash
# 執行端到端測試
pnpm e2e
```

### 測試檔案結構
```
src/app/features/course-management/
├── __tests__/                   # 測試檔案
│   ├── course-form.component.spec.ts
│   ├── course-list.component.spec.ts
│   ├── course-view.component.spec.ts
│   └── course.service.spec.ts
```

## 📈 效能指標

### Core Web Vitals
- **LCP (Largest Contentful Paint)**: < 2.5s
- **FID (First Input Delay)**: < 100ms  
- **CLS (Cumulative Layout Shift)**: < 0.1

### Angular 特定指標
- **Bundle Size**: 最佳化的程式碼分割和懶載入
- **Change Detection**: OnPush 策略提升效能
- **Memory Usage**: signals 自動管理記憶體使用

## 🔐 安全性

### 資料驗證
- **前端驗證**: 使用 Angular Reactive Forms 進行表單驗證
- **後端驗證**: API 層級的資料驗證和清理
- **XSS 防護**: 適當的資料清理和轉義

### 權限控制
- **路由守衛**: 使用 Angular Guards 進行路由級別權限控制
- **功能權限**: 細粒度的功能權限控制
- **資料權限**: 後端 API 的資料存取權限控制

## 🚀 部署指南

### 建構生產版本
```bash
# 建構生產版本
pnpm build

# 建構並分析 bundle 大小
pnpm build:analyze
```

### Docker 部署
```dockerfile
# Dockerfile 範例
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN pnpm install --production
COPY dist/ .
EXPOSE 80
CMD ["pnpm", "start:prod"]
```

## 🤝 貢獻指南

### 開發流程
1. **Fork 專案**: 建立個人分支
2. **功能開發**: 基於 feature branch 進行開發
3. **測試驗證**: 確保所有測試通過
4. **程式碼審查**: 提交 Pull Request 進行審查
5. **合併部署**: 審查通過後合併到主分支

### 程式碼規範
- **ESLint**: 遵循專案的 ESLint 規則
- **Prettier**: 使用 Prettier 進行程式碼格式化
- **Commit Convention**: 遵循 Conventional Commits 規範

## 📚 相關資源

### 官方文件
- [Angular 官方文件](https://angular.dev)
- [Angular Signals](https://angular.dev/guide/signals)
- [Angular Material](https://material.angular.io)

### 專案文件
- [API 標準化指南](../API_UNIFICATION_GUIDE.md)
- [共用元件文件](../src/app/shared/components/README.md)
- [核心服務文件](../src/app/core/README.md)

## 📞 支援與反饋

如有問題或建議，請通過以下方式聯繫：
- **Issue Tracker**: 在 GitHub 上建立 Issue
- **討論區**: 參與 GitHub Discussions
- **文件改進**: 提交文件改進的 Pull Request

---

*本文件隨專案持續更新，最後更新日期：2025-01-25*