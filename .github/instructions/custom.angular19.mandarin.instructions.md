---
applyTo: "**"
description: Complete Angular 19+ Coding, Structure, and Naming Guidelines (LLM/AI, Team Onboarding, Maintenance, Testing)
---

# 🟢 Angular 19+ 團隊專案結構與開發規範

**參考自 angular.dev/llms 與業界最佳實踐，適用於 LLM 產物生成、團隊協作、可維護專案。**

---

## 1. **共用組件與樣式優先原則**

* **共用資源/元件必須優先**：`src/app/shared` 或全域 library 已有資源（Table/Modal/Badge/Button 等），**不可重複造輪子**。
* 建新元件、pipe、工具前，先檢查 `shared/components`、`shared/pipes`、`shared/utils` 是否已存在可用資源。
* **如現有共用資源不符需求，請先提出擴充建議，不可私自 copy-paste。**
* **共用 SCSS 樣式也要公告全組，嚴禁重複建造**。
* DRY 原則（Don’t Repeat Yourself）為最高優先。

---

## 2. 頂層專案結構與命名原則

* **資料夾/檔案結構如下：**

  * `src/app/core/`：全域基礎設施 (e.g., layouts, authentication, global interceptors, guards, shared services, utilities)。
  * `src/app/features/`：
    * 每個功能資料夾應包含：
      * `components/`：業務組件。
      * `services/`：業務服務。
      * `store/`：狀態管理（signals/store）。
      * `models/`：資料模型。
      * `pipes/`：業務管道。
      * `pages/`：頁面組件。
      * `routes.ts`：路由設定檔。
  * `src/app/shared/`：僅 stateless UI 組件、共用 pipe、工具，**嚴禁業務邏輯**。
  * `src/environments/`：環境變數檔。
  * `src/assets/`：靜態資源（圖片、icons、fonts、i18n、多媒體）。
* **檔名/資料夾名稱一律 kebab-case。**
* 型別、類別、組件名稱用 PascalCase（如 `UserProfileComponent`）。
* 變數與函式名稱用 camelCase，常數用 UPPER\_SNAKE\_CASE。
* Angular artifact 統一後綴（`.component.ts`、`.service.ts`、`.pipe.ts`、`.directive.ts`、`.guard.ts`、`.interceptor.ts`），測試檔名 `.spec.ts`。
* **每個組件三分檔（ts/html/scss），不得使用 inline template/style（除微型 demo 外）。**
* **禁止在 HTML 直接 class/id 覆蓋樣式，全部交由 scss 管理。**

**範例：**

```plaintext
src/
 ├── app/
 │    ├── core/
 │    │    ├── layout/
 │    │    ├── guards/
 │    │    ├── auth/
 │    │    ├── interceptors/
 │    │    ├── services/
 │    │    ├── utils/
 │    │    └── system-parameter.ts
 │    ├── features/
 │    │    ├── products/
 │    │    │    ├── components/
 │    │    │    ├── services/
 │    │    │    ├── store/
 │    │    │    ├── pages/
 │    │    │    ├── models/
 │    │    │    ├── pipes/
 │    │    │    └── products.routes.ts
 │    │    ├── orders/
 │    │    └── cart/
 │    └── shared/
 │         ├── components/
 │         ├── pipes/
 │         └── utils/
 ├── assets/
 │    ├── images/
 │    ├── icons/
 │    ├── fonts/
 │    └── i18n/
 └── environments/
      ├── environment.ts
      └── environment.prod.ts
```

---

## 3. API Response、資料型別與命名規範

* 所有 API 回傳標準格式：

  ```typescript
  export interface ApiResponse<T> { code: number; message: string; data?: T; }
  ```
* 分頁接口建議格式：

  ```typescript
  export interface PagerDto<T> { dataList: T[]; totalRecords: number; [key: string]: any; }
  ```
* 前端 interface、組件/服務/狀態皆用 `camelCase`，API/DB 用 `snake_case`，**轉換由 `core/utils/object-case.util.ts` 統一管理** 進行自動轉換，不得於 `service/component` 內手動轉換。
* service 回傳一律型別化，方便 signals/resource/AI 流。

---

## 4. 全域 HTTP 錯誤處理

* 所有 httpResource/request 都必須經過 `src/app/core/services/http-error-handler.service.ts`。
* **不得每個 feature/service 自行寫 handleError，必須統一。**
* 範例用法：

  ```typescript
  import { inject } from '@angular/core';
  import { HttpErrorHandlerService } from 'src/app/core/services/http-error-handler.service';
  const errorHandler = inject(HttpErrorHandlerService);
  // 在 resource() 統一 catch error
  ```

---

## 5. 狀態管理與 DI

* **本地 state 全部用 signals，不可 class property 儲存狀態。**
* 優先用 `signal()`、`computed()`、`effect()` 管理本地狀態。
* `input()`、`input.required()` 取代 `@Input()`，`output()` 取代 `@Output()`。
* 需雙向綁定時用 `linkedSignal()`。
* \*\*服務注入一律用 `inject()`，**不得用 constructor 注入**。
* 取用 Angular 原生 service（如 ActivatedRoute, ChangeDetectorRef）時，統一用 inject()。

---

## 6. 路由、資料流、CRUD、mock 切換

* 路由檔案放於 feature 目錄內，lazy route 用 `loadComponent()`，禁止 NgModule-based routing。
* 路由設定用 `withComponentInputBinding()` 於 `provideRouter()`。
* 路由參數用 `input()` signals 接收；查詢參數用 `inject(ActivatedRoute)`。
* **資料存取一律用 resource()/httpResource()，每個 resource 都必須有 request() 和 loader()。**
* signals 提供 resource 參數，禁止於組件內 subscribe()，一律用 reactive data flow。
* **每個 service 必須支援一鍵切換 mock data/真實 API，**
  如：

  ```typescript
  private useMockData = true;
  getList(params: QueryParams): Observable<Entity[]> {
    if (this.useMockData) {
      return of(this.mockList).pipe(delay(300));
    }
    return this.http.get<Entity[]>('/api/entity', { params });
  }
  ```
* 只需切換一處 flag，所有 CRUD 流程自動切換。

---

## 7. SCSS 樣式與最佳化層級

* **所有 SCSS 檔案必須用 @use，不可用 @import**，新程式碼強制、舊程式碼逐步改寫。

  ```scss
  @use 'variables' as *;
  ```
* 共用 SCSS（如 `_variables.scss`, `_mixins.scss`）放在 `src/styles/`，並用 `@use` 引入。
* SCSS 樣式管理層級順序：1. styles/共用 → 2. shared/組件 → 3. 各自 component。
* 禁止於 component 內重複建立可重用樣式。
* **禁止 inline style、禁止於 HTML 用 class/id 覆蓋樣式，所有覆蓋於 scss 控管。**

---

## 8. UI/UX 與 Accessibility（可及性）

* 表單、互動元件皆須符合 WCAG 2.1 AA 標準。
* input 必有 label，placeholder 僅作短提示，不可與 label 重複。
* 錯誤訊息於欄位下方顯示。
* 必填欄位明確標示（如 `<span class="text-danger">*</span>`）。
* 組件必須小型且聚焦，避免巨型或單一責任元件。
* **圖片必須用 NgOptimizedImage，禁止使用原生 <img>。**

---

## 9. 查詢、排序與資料表元件行為

* 查詢組件初始化不得自動查詢，須由使用者觸發。
* 排序元件需三階段（asc/desc/null），可重設為無排序。
* 分頁、排序、查詢等接口建議用 resource/httpResource 提供。

---

## 10. 測試與測試檔案

* 測試檔必須與 source 同目錄 `.spec.ts`，涵蓋組件、服務、pipe。
* 結構 mirror 原始碼，方便導覽。
* 使用 TestBed 配置 module，ComponentFixture 操作查詢 DOM。
* 非同步邏輯用 fakeAsync()/tick()。
* HTTP 測試用 HttpClientTestingModule、HttpTestingController。
* 優先用 toHaveBeenCalledWith() 斷言。

---

## 11. 現代 Angular 控制流程

* 使用 `@if`、`@for`、`@defer` 控制流程。
* 禁止使用 `*ngIf`、`*ngFor`。
* 所有組件預設設為 `ChangeDetectionStrategy.OnPush`。
* 避免 ngClass/ngStyle，建議用 \[class]/\[style] 綁定。
* 表單一律用 FormBuilder 與 reactive form，禁用 template-driven form。
* 結構扁平、避免深層巢狀。

---

## 12. 禁止事項（重點統整）

* 禁止於專案 root 建立技術層資料夾（如 components/、services/），一律 feature-first 分組。
* 禁止將業務邏輯放入 shared/，僅允許 UI/pipes/utils。
* 禁止重複建立 table/modal/badge/button 等共用組件。
* 禁止覆蓋 Bootstrap 樣式於 component 內。
* 禁止硬編碼 env 變數與 API。
* 除非必要，不得用 inline style。
* 禁止任何手動 subscribe() 或不經 errorHandler 處理。

---

## 13. 其他補充與團隊溝通

* 一律用 Angular CLI/Vite generator 產生元件與服務。
* 定期重構、清理未用檔案或組件。
* 建議各 feature/core 資料夾補 README.md，說明職責與設計理念。
* 重要資源更新須公告全組。
* 規範每季檢視，依團隊現況微調。

---

## 14. Do & Don’t 對照表

| ✅ 建議做法                    | ❌ 禁止做法                                |
| ------------------------- | ------------------------------------- |
| signals, input()/output() | class properties, @Input(), @Output() |
| inject()                  | constructor injection                 |
| loadComponent()           | loadChildren()                        |
| resource()/httpResource() | subscribe() in components             |
| @if/@for                  | \*ngIf/\*ngFor                        |
| NgOptimizedImage          | plain <img> (無優化)                     |
| FormBuilder/Reactive Form | template-driven form                  |
| 小型、專注組件                   | 巨大、單一組件                               |
| 清晰命名規則                    | 不一致命名                                 |
| 三分檔(ts/html/scss)         | inline template/style（除 trivial 外）    |
| 用 assets/ 管理靜態資源          | 靜態檔案分散在 app/                          |
| Feature-first 組織          | 技術層 root 資料夾                          |
| 用 CLI/Vite generator      | 手動、不統一風格                              |
| @use SCSS                 | @import SCSS                          |
| 一鍵 mock/API 切換            | mock 與 API 分散且硬編碼                     |

---

## 15. 官方參考與備註

* [Angular LLM Guidelines](https://angular.dev/llms)
* [Angular Signals](https://angular.dev/guide/signals)
* [Angular Routing](https://angular.dev/guide/router)
* [HttpClient Resource API](https://angular.dev/api/common/http/httpResource)

---
