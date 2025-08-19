---
mode: 'agent'
tools: ['codebase', 'editFiles']
description: ''
---

# 🧭 請用最簡單方式解析我的 Angular 專案（初學者視角）

**角色與目標**
你是資深 Angular 教練。對象是完全不懂 Angular 的初學者。
請閱讀整個專案並用「白話、一步一步」的方式解釋它是如何啟動、如何運作、資料怎麼流動。
出一分`explain.md`在 `docs`，並包含以下內容：

**請先做這些：**

1. 掃描並引用關鍵檔案與設定（如存在）：

   * `package.json`, `angular.json`, `tsconfig.app.json`, `src/main.ts`, `src/app/app.config.ts`, `src/app/app.routes.ts`、`index.html`, `src/styles.*`
   * 目錄：`/core/**`, `/shared/**`, `/features/**`, `/models/**`, `/shared/**`, `/assets/**`, `/environments/**`, `/styles/**`
   * 常見服務/攔截器/守衛/狀態：`**/*.service.ts`, `**/*interceptor*.ts`, `**/*guard*.ts`, `**/*store*`, `**/*state*`
2. 以實際檔案路徑與極短程式片段（必要時）佐證你的說明。避免長篇貼碼。

---

## 期望輸出格式（照順序）

### 1 一句話總結

用 2–3 句話，用「生活化比喻」先告訴我：這個專案大概在做什麼、怎麼跑起來。

### 2 專案如何執行（啟動流程地圖）

* 從 `npm scripts` → `main.ts` → `bootstrapApplication()`（）→ 路由 → 第一個畫面，逐步解釋。
* 用簡單流程圖（ASCII）表示：

  ```
  npm start → Angular 啟動 → 載入 main.ts → 建立根組件 → 套用路由 → 顯示對應頁面
  ```

### 3 資料夾用途（用白話分工表）

以表格列出每個目錄在做什麼與常見檔案（若存在就列出）：

| 目錄/檔案                  | 簡單用途                     | 代表性檔案/說明                          |
| ---------------------- | ------------------------ | --------------------------------- |
| `src/app/core`         | 放全域單例服務、攔截器、守衛、錯誤處理      | 例：`http-error-handler.service.ts` |
| `src/app/shared`       | 可重用 UI/管道/工具，**不得含業務邏輯** | 例：`shared/components/table`       |
| `src/app/features/...` | 各功能頁面（路由、元件、服務）          | 例：`features/employee/...`         |
| `src/assets`           | 圖片、icon、i18n             |                                   |
| `src/environments`     | API 主機等環境變數              | `environment.ts`                  |
| 其他（請補齊）                |                          |                                   |

### 4 畫一張「資料怎麼流」的圖（前端視角）

* 從使用者操作 → 元件（Component）→ 服務（Service）→ HTTP → 後端 → 回來後如何更新畫面（signals 或 RxJS）。
* 若專案使用 **Standalone Components / Signals / InjectionToken / Interceptor / Guard / Resolver / Store(NgRx or signals store)**，請用一句話白話解釋其角色。
* ASCII 範例：

  ```
  [使用者點擊] → [Component 收集表單/事件]
                 → [Service 發送 HTTP 請求]
                 → [Interceptor 加上認證/錯誤處理]
                 → [後端 API]
                 ← [回傳資料]
                 → [Service 整理資料]
                 → [Component 更新 signals 或狀態]
                 → [畫面重新渲染]
  ```

### 5 路由導覽（用樹狀圖列出主要頁面）

* 列出 `app.routes.ts`（或 `app-routing.module.ts`）的主要路徑、對應元件、可能的守衛。
* 簡述 Lazy Loading 是否使用、各 feature 的進入點。

### 6 HTTP 與錯誤處理（請指路）

* API Base URL 從哪裡來（環境設定/攔截器）？
* 哪些服務在打 API？錯誤怎麼攔？重試/訊息提示在哪裡做？

### 7 狀態管理/資料快取（若有）

* 用一句話解釋目前的狀態策略（signals、RxJS service in-memory、NgRx）。
* 指出「誰改狀態」「誰讀狀態」「如何避免重複請求」。

### 8 UI 組件與樣式

* 全域樣式來源（Bootstrap/Tailwind/自訂 SCSS）。
* 共用 UI 元件位置與命名慣例。

### 9 如何本機執行、如何打包

* 「我該怎麼跑？」（安裝、`npm start`、環境變數）
* 「如何產生正式包？」（`npm run build`、輸出目錄、重要參數）

### 10 初學者可能會卡的點（清單式）

* 例如：路由不到、CORS、攔截器 401、環境變數沒切、Standalone 與 NgModule 混用等。
* 每項附「如何檢查」與「快速修正」。

### 11 名詞小字典（10 條以內）

* 用超白話解釋如 Component / Service / Interceptor / Guard / Resolver / Signal / RxJS Observable / DI / Lazy Loading。

### 12 實作導引

* 初學者要新增一個feature，請給步驟引導。

---

## 輸出要求

* **語氣**：非常白話、避免術語；若出現專有名詞，請括號補白話註解。
* **證據**：每段結論盡量附檔案路徑，必要時貼**極短**碼片段。
* **可掃可讀**：用小段落、清單、表格、ASCII 圖。
* **不要**貼整大段原始碼；必要時只貼關鍵 5–15 行。

---

## 若找不到某些檔案

* 請說明「沒找到」並推測可能位置與替代做法（例如：專案使用 Standalone 結構、或放在 feature 內）。

> 現在開始解析，並依照上述 12 個章節輸出。

---
