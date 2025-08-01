---
mode: 'agent'
model: Claude Sonnet 4
tools: ['codebase', 'editFiles']
description: 'Scaffold Global Permission Guard and Global Notification/Message System for Angular 19+'
---

# Scaffold Global Permission Control & Global Message Notification (Angular 19+ Standard)

## Step 1: Scaffold Permission Guard（全域權限攔截）

- 在 `/src/app/core/auth/` 下建立：
  - `permission.guard.ts`
    - Angular Route Guard，支援 canActivate/canLoad。
    - 允許依據 route data（roles/permissions）及 `/src/app/core/auth/user.store.ts` 當前 user/claims 判斷權限。
    - 權限、角色等型別請用 enum/type 定義，嚴格型別。

- `user.store.ts`
  - 定義 User、Role、Permission interface/enum。
  - 使用 signal/store 提供 current user/roles/permissions（可先 mock）。

- 每個 feature route 可於 route data 註明需哪些權限（如：`data: { roles: ['ADMIN', 'MANAGER'] }`），guard 自動驗證。

## Step 2: Scaffold Global Message/Notification System（全域訊息通知）

- 在 `/src/app/core/message/` 或 `/src/app/shared/components/` 下建立：
  - `global-message.service.ts`
    - 提供 `success/info/error/warning` 快捷訊息 API（RxJS Subject 或 signal stream）。
    - 支援 queue、timeout、auto-dismiss。

  - `global-message.component.ts/.html/.scss`
    - Snackbar/Toast 類型，Bootstrap 樣式、ARIA 標籤、多訊息隊列。
    - `<app-global-message />` 插入 `app.component.html`，全域可見。

## Step 3: 範例與測試

- 為 guard、store、service、component 製作簡要 `.spec.ts` 單元測試。
- 於 `/src/app/models/` 定義必要嚴格型別（如 User、Role、Permission、MessageType）。

## Step 4: README/說明文件

- 說明如何於 route data 設定權限，如何於任一元件呼叫訊息服務，以及如何存取當前 user/permission。

## Step 5: 可維護性與共用原則

- guard/service/component 採 singleton/global 設計，全專案可直接 import 使用。
- message component 支援 i18n，HTML/SCSS 遵循 BEM 或專案規範。

---

### 補充

- 本 prompt 僅補足 instructions 未細述之 scaffold 操作細節與範例，所有型別結構、三檔案分離、命名、共用原則等，皆依主 instructions 規範。
- **如需自動產生，可依此 prompt 執行 scaffold；如需專案維護，請參考 instructions 對應細節。**

---

**Example Usage:**

```typescript
// Route 配置
{
  path: 'admin',
  canActivate: [PermissionGuard],
  data: { roles: ['ADMIN'] },
  loadComponent: () => import('...')
}
// 訊息服務
this.globalMessageService.success('操作成功')
```
---