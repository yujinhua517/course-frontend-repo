# 🧭 Angular 專案全解析

## 1 一句話總結

這個專案就像一個「企業內部管理系統」，專門用來管理員工、部門、職位和課程活動。想像它是一家公司的數位化辦公系統，員工可以登入後查看和管理各種資料，系統會自動處理權限控管、資料轉換，並提供友善的操作介面。

## 2 專案如何執行（啟動流程地圖）

### 啟動指令
```bash
npm start  # 實際執行：ng serve --proxy-config proxy.conf.js
```

### 執行流程圖
```
npm start → Angular CLI 啟動開發伺服器 → 載入 main.ts 
    ↓
main.ts 讀取 app.config.ts 設定 → 建立根組件 AppComponent
    ↓
讀取 app.routes.ts 路由設定 → 依照網址路徑載入對應頁面
    ↓
權限守衛檢查登入狀態 → 顯示登入頁面或主要功能頁面
    ↓
透過 proxy.conf.js 將 API 請求轉發到後端 (localhost:8080)
```

### 關鍵檔案說明
- **`main.ts`**: 專案的啟動入口，載入根組件
- **`app.config.ts`**: 全域設定，包含路由、HTTP 攔截器配置
- **`app.routes.ts`**: 定義所有頁面路徑和權限
- **`proxy.conf.js`**: 將前端的 `/api` 請求轉發到後端

## 3 資料夾用途（用白話分工表）

| 目錄/檔案 | 簡單用途 | 代表性檔案/說明 |
|----------|---------|----------------|
| **`src/app/core`** | 放全域單例服務、攔截器、守衛、錯誤處理 | `http-error-handler.service.ts`<br>`auth.interceptor.ts`<br>`permission.guard.ts` |
| **`src/app/shared`** | 可重用 UI 組件/管道/工具，**不含業務邏輯** | `components/unauthorized/`<br>`pipes/`<br>`styles/` |
| **`src/app/features`** | 各功能模組（頁面、元件、服務） | `employee-management/`<br>`department-management/`<br>`course-event-management/` |
| **`src/app/models`** | 定義資料結構（TypeScript 介面） | `user.model.ts`<br>`common.model.ts` |
| **`src/assets`** | 靜態資源（圖片、icon、字型等） | `images/` |
| **`src/environments`** | 環境變數設定 | `environment.ts` (開發)<br>`environment.prod.ts` (正式) |
| **`src/styles`** | 全域樣式設定 | `_variables.scss`<br>`_form-controls.scss`<br>`_modal-view.scss` |

## 4 資料流動圖（前端視角）

```
[使用者點擊按鈕] 
    ↓
[Component 收集表單資料/處理事件]
    ↓
[呼叫 Service 的方法]
    ↓
[Service 透過 HttpClient 發送 API 請求]
    ↓
[Interceptor 自動加上認證 token + 資料格式轉換]
    ↓
[Proxy 轉發到後端 API (localhost:8080)]
    ↓
[後端處理並回傳資料]
    ↓
[Interceptor 自動轉換資料格式 + 錯誤處理]
    ↓
[Service 整理資料並更新 signals]
    ↓
[Component 的 signals 變化觸發畫面重新渲染]
    ↓
[使用者看到更新後的內容]
```

### 核心技術說明
- **Standalone Components**: 新式組件架構，不需要 NgModule，更輕量
- **Signals**: Angular 19 的新式狀態管理，自動追蹤變化並更新畫面
- **Interceptors**: 自動處理 HTTP 請求/回應（加 token、轉換資料格式、錯誤處理）
- **Guards**: 路由守衛，檢查使用者權限是否可進入某頁面
- **Dependency Injection**: 自動注入服務，使用 `inject()` 函數

## 5 路由導覽（主要頁面樹狀圖）

```
📁 根路徑 (/)
├── 🔐 login/ (登入相關)
│   ├── login → LoginComponent
│   └── forgot-password → (登入子路由)
│
├── 🏠 主要功能區 (需登入 + 權限檢查)
│   ├── home → HomePageComponent (首頁)
│   ├── demo → DemoPageComponent (範例頁面)
│   ├── job-role → JobRoleListComponent (職位管理)
│   ├── employee → EmployeeListComponent (員工管理)
│   ├── department → DepartmentListComponent (部門管理)
│   └── course-event → CourseEventListComponent (課程活動管理)
│
├── 🚫 unauthorized → UnauthorizedComponent (權限不足頁面)
└── 🔀 ** → 重定向到首頁 (找不到頁面時)
```

### 路由特色
- **Lazy Loading**: 使用 `loadComponent()` 動態載入，減少初始包大小
- **權限控管**: 透過 `PermissionGuard` 檢查使用者權限
- **巢狀路由**: 主要功能都在同一個 layout 下

## 6 HTTP 與錯誤處理

### API 設定
- **Base URL**: 透過 `environment.apiBaseUrl` 設定為 `/api`
- **Proxy**: `proxy.conf.js` 將 `/api` 轉發到 `http://localhost:8080`
- **認證**: `auth.interceptor.ts` 自動加上 Bearer token

### 錯誤處理機制
- **`HttpErrorHandlerService`**: 統一處理 HTTP 錯誤，提供使用者友善訊息
- **`CaseConversionInterceptor`**: 自動轉換前後端資料格式
  - 出站：camelCase → snake_case
  - 入站：snake_case → camelCase

### API 服務範例
```typescript
// 每個功能都有對應的 Service
employee.service.ts     // 員工相關 API
department.service.ts   // 部門相關 API
job-role.service.ts     // 職位相關 API
```

## 7 狀態管理/資料快取

### 狀態策略
- **Signals**: 使用 Angular 19 的 signals 作為主要狀態管理
- **Service 層快取**: 在 Service 中暫存查詢結果，避免重複請求
- **UserStore**: 專門管理使用者登入狀態和權限資訊

### 狀態流向
- **誰改狀態**: Service 層的方法（如 `createEmployee`、`updateEmployee`）
- **誰讀狀態**: Component 透過 Service 讀取 signals
- **避免重複請求**: Service 內建快取機制，相同查詢條件不重複發送

## 8 UI 組件與樣式

### 樣式架構
- **Bootstrap 5**: 主要 UI 框架 (`bootstrap.min.css`)
- **Angular Material**: 特定組件使用 (`@angular/material`)
- **Bootstrap Icons**: 圖示庫 (`bootstrap-icons.css`)
- **自訂 SCSS**: 
  - `src/styles.scss` - 全域樣式
  - `src/styles/_variables.scss` - 變數定義
  - `src/styles/_form-controls.scss` - 表單樣式
  - `src/styles/_modal-view.scss` - 彈窗樣式

### 共用組件位置
- `src/app/shared/components/` - 可重用的 UI 組件
- 命名慣例：`組件名.component.ts`

### 樣式特色
- 支援 SCSS 預處理器
- 使用 CSS Custom Properties (CSS 變數)
- 響應式設計（Bootstrap Grid 系統）

## 9 如何本機執行、如何打包

### 🚀 本機開發
```bash
# 1. 安裝依賴
npm install

# 2. 啟動開發伺服器（含 API 代理）
npm start
# 或
ng serve --proxy-config proxy.conf.js

# 3. 開啟瀏覽器
# http://localhost:4200
```

### 📦 正式環境打包
```bash
# 建置正式版本
npm run build
# 或
ng build --configuration production

# 輸出目錄
dist/course-angular-frontend/
```

### 重要設定
- **開發伺服器**: `localhost:4200`
- **API 代理**: 自動轉發到 `localhost:8080`
- **環境變數**: 透過 `src/environments/` 切換

## 10 初學者可能會卡的點

### 🔧 常見問題清單

| 問題 | 症狀 | 如何檢查 | 快速修正 |
|------|------|---------|---------|
| **路由不到** | 頁面顯示空白或 404 | 檢查 `app.routes.ts` 路徑設定 | 確認路徑拼寫和組件 import |
| **CORS 錯誤** | 瀏覽器控制台顯示跨域錯誤 | 檢查 `proxy.conf.js` 設定 | 確認後端伺服器已啟動 |
| **攔截器 401** | API 請求被拒絕 | 檢查登入狀態和 token | 重新登入或檢查 `auth.interceptor.ts` |
| **環境變數沒切** | API 指向錯誤位址 | 檢查 `environment.ts` 設定 | 確認使用正確的環境檔案 |
| **權限檢查失敗** | 無法進入某些頁面 | 檢查 `PermissionGuard` 和使用者權限 | 確認登入使用者具有所需權限 |
| **樣式不生效** | 畫面樣式異常 | 檢查 SCSS 編譯錯誤 | 檢查 `styles.scss` 語法 |
| **Mock 資料問題** | 假資料顯示異常 | 檢查 Service 中的 `useMockData` 設定 | 切換到真實 API 或修正 mock 資料 |

## 11 名詞小字典

| 術語 | 白話解釋 |
|------|---------|
| **Component** | 頁面上的一個區塊，包含畫面和互動邏輯 |
| **Service** | 處理資料和 API 呼叫的工具人，可被多個 Component 共用 |
| **Interceptor** | HTTP 請求的攔截器，自動處理認證和資料轉換 |
| **Guard** | 路由守衛，決定使用者能否進入某個頁面 |
| **Signal** | Angular 19 的新式狀態管理，自動追蹤資料變化 |
| **Observable** | RxJS 的資料流，用於處理非同步操作 |
| **Dependency Injection** | 自動注入服務的機制，不用手動 new 物件 |
| **Lazy Loading** | 延遲載入，只有需要時才載入頁面，加快啟動速度 |
| **Standalone Component** | 新式組件架構，不依賴 NgModule |
| **Proxy** | 代理伺服器，將前端請求轉發到後端 |

## 12 實作導引（新增功能步驟）

### 🛠️ 新增一個功能模組（以「公告管理」為例）

#### 第1步：建立目錄結構
```bash
src/app/features/announcement-management/
├── components/           # 子組件
├── models/              # 資料模型
├── pages/               # 主要頁面
├── services/            # API 服務
└── announcement.routes.ts  # 路由設定
```

#### 第2步：定義資料模型
```typescript
// models/announcement.model.ts
export interface Announcement {
  id: number;
  title: string;
  content: string;
  isActive: boolean;
  createTime: string;
  createUser: string;
}
```

#### 第3步：建立 API 服務
```typescript
// services/announcement.service.ts
@Injectable({ providedIn: 'root' })
export class AnnouncementService extends BaseQueryService<Announcement, AnnouncementSearchParams> {
  protected override readonly apiUrl = `${environment.apiBaseUrl}/announcements`;
  // 實作 CRUD 方法...
}
```

#### 第4步：建立頁面組件
```typescript
// pages/announcement-list/announcement-list.component.ts
@Component({
  selector: 'app-announcement-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `<!-- 列表畫面 -->`
})
export class AnnouncementListComponent {
  // 使用 signals 管理狀態
  announcements = signal<Announcement[]>([]);
}
```

#### 第5步：設定路由
```typescript
// app.routes.ts 中加入
{
  path: 'announcement',
  canActivate: [PermissionGuard],
  data: { permissions: [PermissionName.ANNOUNCEMENT_READ] },
  loadComponent: () => import('./features/announcement-management/pages/announcement-list/announcement-list.component')
    .then(m => m.AnnouncementListComponent)
}
```

#### 第6步：更新權限定義
```typescript
// models/user.model.ts 中加入
export enum PermissionName {
  // ...existing permissions
  ANNOUNCEMENT_READ = 'ANNOUNCEMENT_READ',
  ANNOUNCEMENT_CREATE = 'ANNOUNCEMENT_CREATE',
  ANNOUNCEMENT_UPDATE = 'ANNOUNCEMENT_UPDATE',
  ANNOUNCEMENT_DELETE = 'ANNOUNCEMENT_DELETE'
}
```

#### 第7步：加入導航選單
在主選單組件中加入新的導航項目，記得加上權限檢查。

### 💡 開發小技巧
1. **先建立模型和服務**，再建立組件
2. **參考現有模組**的結構和命名方式
3. **使用 Angular CLI**：`ng generate component` 等指令
4. **先用 Mock 資料**測試，再接真實 API
5. **記得加入權限檢查**和錯誤處理

---

## 🎯 總結

這個 Angular 專案採用現代化的架構設計：
- **Standalone Components** + **Signals** 提供更好的效能
- **自動化攔截器** 處理繁瑣的資料轉換和認證
- **清楚的目錄分層** 讓功能模組易於維護
- **完整的權限控管** 確保系統安全性

對初學者來說，建議先從理解 **Component → Service → API** 的資料流開始，再逐步學習攔截器、路由守衛等進階功能。記住，每個檔案都有明確的職責分工，這是 Angular 強大之處！
