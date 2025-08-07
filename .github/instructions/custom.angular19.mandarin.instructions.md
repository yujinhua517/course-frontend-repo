--- 
applyTo: "**"
description: Complete Angular 19+ Coding, Structure, and Naming Guidelines (LLM/AI, Team Onboarding, Maintenance, Testing)
---

# Angular 19+ 團隊專案 Copilot 指令（含實作範例）

## 專案簡介
本專案為 Angular 19+ 企業級應用，採用 feature-based 架構、standalone component、signals、現代 Angular API。

## 資料夾結構
- `/src/app/core/`：全域服務（HttpErrorHandlerService、DialogService、AuthService）、守衛、攔截器、工具。
- `/src/app/features/`：功能專屬 components、services、store、models、pipes、pages、routes。
- `/src/app/shared/`：Stateless UI components、共用 pipes、utils（不得含業務邏輯）。
- `/src/assets/`：靜態資源（images、icons、fonts、i18n）。
- `/environments/`：環境變數。

## 程式規範
- 資料夾/檔案一律 kebab-case，型別/類別 PascalCase，變數/函式 camelCase，常數 UPPER_SNAKE_CASE。
- 每個組件皆分 ts/html/scss 檔，不得 inline template/style。
- 共用 UI/pipes/services/SCSS 必須優先覆用，不可重複建立。
- 所有業務邏輯只可在 core/services 或 features/services，不得進 shared/。
- 所有 HTTP 請求統一用 `HttpErrorHandlerService`，嚴禁各自 handleError。
- API 回應格式為 `{ code: number, message: string, data?: T }`，`code === 1000` 為成功。
- 前端資料 camelCase，後端 snake_case，轉換請用 `core/utils/object-case.util.ts`。

```typescript
// API 回應格式 interface 範例
export interface ApiResponse<T> {
  code: number;
  message: string;
  data?: T;
}
// 分頁資料格式
export interface PagerDto<T> {
  dataList: T[];
  totalRecords: number;
  [key: string]: any;
}
```

- Service 一律回傳 Observable，不可用 Promise/callback。
- 禁止在 component 直接 subscribe()，應用 signals/reactive flow。

```typescript
// 服務回傳 Observable 範例
getUserList(params: QueryParams): Observable<PagerDto<UserDto>> {
  return this.http.get<ApiResponse<PagerDto<UserDto>>>(`${environment.apiUrl}/users`, { params })
    .pipe(
      map(res => {
        if (res.code === 1000) return res.data!;
        throw this.errorHandler.handleError(res.message);
      }),
      catchError(err => this.errorHandler.handleError(err))
    );
}
```

- 依賴注入只用 inject()，不可 constructor。

```typescript
// inject() 實例
import { inject } from '@angular/core';
const http = inject(HttpClient);
const dialog = inject(DialogService);
```

- 狀態管理一律 signals。

```typescript
// signals 狀態管理
import { signal } from '@angular/core';
currentSort = signal<SortConfig | null>(null);
```

- 所有測試 mirror 原始碼結構，命名為 .spec.ts。

## 樣式規範
- 樣式優先順序：Bootstrap 5 → src/styles/ 共用 → shared 組件 → component 自有。
- SCSS 必用 @use，不可 @import。
- 禁止 inline style、HTML 直接 class/id 覆蓋樣式。
- 新增共用 SCSS 須團隊公告。

## UI 與無障礙
- 表單欄位必有 `<label>` 與 `placeholder`，避免重複說明。

```html
<!-- 標準欄位寫法 -->
<label for="email" class="form-label">Email <span class="text-danger">*</span></label>
<input id="email" formControlName="email" placeholder="example@company.com" class="form-control">
<div *ngIf="isFieldInvalid('email')" class="invalid-feedback">
  {{ getFieldError('email') }}
</div>
```

- 必填欄位加 `<span class="text-danger">*</span>`。
- 錯誤訊息顯示於欄位下方。
- 遵循 WCAG 2.1 AA。
- 圖片必用 NgOptimizedImage，不可用原生 <img>。

```html
<!-- 圖片元件示範 -->
<ng-optimized-image src="assets/images/example.png" width="120" height="80" alt="說明文字"/>
```

- 組件應小型、聚焦、單一職責。

## 路由與資料流
- 各 feature 資料夾內有 routes，使用 loadComponent()，不可 NgModule routing。
- API 資料一律用 resource/httpResource，需有 request()/loader()。
- mock 與 API 一鍵切換，flag 寫在 service。

```typescript
// 一鍵 mock / API 切換範例
private useMockData = true;
getList(params: QueryParams): Observable<Entity[]> {
  if (this.useMockData) {
    return of(this.mockList).pipe(delay(300));
  }
  return this.http.get<Entity[]>('/api/entity', { params });
}
```

- 禁止 component subscribe()，一律 signals/reactive flow。

## 表單與元件邏輯
- 表單用 reactive form + FormBuilder，不可用 template-driven form（除非 legacy）。

```typescript
// Reactive Form 建立範例
form = this.fb.group({
  email: ['', [Validators.required, Validators.email]],
  password: ['', [Validators.required]]
});
```

- initializeData() 僅初始化狀態，不可自動查詢，查詢需由使用者觸發。
- 排序必須三段（asc/desc/null）。

---

## ✅ Do & ❌ Don’t 對照表

| ✅ 建議做法                    | ❌ 禁止做法                                |
| ------------------------- | ------------------------------------- |
| signals, input()/output() | class properties, @Input(), @Output() |
| inject()                  | constructor injection                 |
| loadComponent()           | loadChildren()                        |
| resource()/httpResource() | subscribe() in components             |
| @if/@for                  | *ngIf/*ngFor                          |
| NgOptimizedImage          | plain <img> (無優化)                  |
| FormBuilder/Reactive Form | template-driven form                  |
| 小型、專注組件               | 巨大、單一組件                          |
| 清晰命名規則                | 不一致命名                             |
| 三分檔(ts/html/scss)       | inline template/style（除 demo 外）   |
| 用 assets/ 管理靜態資源      | 靜態檔案分散在 app/                    |
| Feature-first 組織         | 技術層 root 資料夾                     |
| 用 CLI/Vite generator      | 手動、不統一風格                       |
| @use SCSS                 | @import SCSS                          |
| 一鍵 mock/API 切換         | mock 與 API 分散且硬編碼                |
| 共用服務/資源/樣式優先      | 重複造輪子、未先公告就自建              |
| 共用錯誤處理服務           | 各自實作 handleError                   |
| Observable/型別安全        | Promise/callback/any                   |

---

## 📝 樣本 event handler（查詢/排序）

```typescript
// ✅ 正確的排序事件處理
onSortChange(event: SortChangeEvent): void {
  this.currentSort = event.direction ? {
    column: event.column,
    direction: event.direction
  } : null; // 關鍵：event.direction 為 null 時要清除排序

  this.paginationConfig.page = 1;
  this.performSearch();
}

// ❌ 錯誤：忽略 null 狀態
onSortChange(event: SortChangeEvent): void {
  if (event.direction) {
    this.currentSort = { column: event.column, direction: event.direction };
  }
  // 缺少 this.currentSort = null 處理
}

// ✅ 查詢元件初始化
initializeData(): void {
  this.paginationConfig = { page: 1, pageSize: 10 };
  this.currentSort = null;
  this.results = { dataList: [], totalRecords: 0 };
  // 不執行 performSearch()，等待使用者觸發
}
```

---

## ✔️ Review Checklist

- [ ] 是否優先覆用共用服務/元件/樣式
- [ ] API 響應格式正確、錯誤處理是否統一
- [ ] 命名規範是否一致（camelCase/kebab-case/PascalCase）
- [ ] 樣式優先順序（Bootstrap→styles→shared→component）是否正確
- [ ] Accessibility 是否完整（label、placeholder、error、標記）
- [ ] 是否正確管理環境變數與 API 路徑
- [ ] 型別安全、Observable 實踐
- [ ] 是否用 signals/resource/reactive flow 管理狀態
- [ ] 查詢/排序邏輯是否三階段、初始化是否正確
- [ ] 所有新功能是否有對應 .spec.ts 測試檔
- [ ] 禁止事項有無違反（如 inline style、重複元件、直接 subscribe）
- [ ] README/註解是否清楚

---

## 📚 官方參考

- [Angular LLM Guidelines](https://angular.dev/llms)
- [Angular Signals](https://angular.dev/guide/signals)
- [Angular Routing](https://angular.dev/guide/router)
- [HttpClient Resource API](https://angular.dev/api/common/http/httpResource)

---