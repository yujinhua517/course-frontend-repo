# 全局權限控制與消息通知系統

本項目實現了完整的權限控制和全局消息通知系統，遵循 Angular 19+ 最佳實踐。

## 📁 項目結構

```
src/app/
├── core/
│   ├── auth/
│   │   ├── auth.service.ts                   # 認證服務（登入/登出）
│   │   ├── auth.interceptor.ts               # HTTP 攔截器
│   │   ├── permission.guard.ts               # 權限守衛
│   │   ├── permission.guard.spec.ts          # 權限守衛測試
│   │   ├── user.store.ts                     # 用戶狀態管理
│   │   └── user.store.spec.ts                # 用戶狀態測試
│   └── message/
│       ├── global-message.service.ts         # 全局消息服務
│       ├── global-message.service.spec.ts    # 消息服務測試
│       ├── global-message.component.ts       # 全局消息組件
│       ├── global-message.component.html
│       └── global-message.component.scss
├── models/
│   ├── user.model.ts                         # 用戶相關類型定義
│   └── message.model.ts                      # 消息相關類型定義
├── features/
│   ├── login/
│   │   ├── components/
│   │   │   └── login.component.ts            # 登入組件（已整合）
│   │   └── services/
│   │       └── login.service.ts              # 登入服務（已更新）
│   └── main/
│       └── components/
│           └── main-page.component.ts        # 主頁面（已整合）
└── shared/
    └── components/
        └── unauthorized/                     # 無權限訪問頁面
            ├── unauthorized.component.ts
            ├── unauthorized.component.html
            └── unauthorized.component.scss
```

## � 完整的登入流程聯動

### 1. 登入流程
```
用戶訪問受保護頁面 → PermissionGuard 檢查認證 → 未登入 → 重定向到 /login?returnUrl=...
                                                          ↓
用戶輸入帳密 → AuthService.login() → LoginService.login() → 設定 UserStore → 顯示成功消息 → 重定向到原始頁面
```

### 2. 權限檢查流程
```
PermissionGuard → 檢查 isAuthenticated() → 檢查角色/權限 → 允許/拒絕訪問 → 顯示相應消息
```

### 3. 登出流程
```
用戶點擊登出 → AuthService.logout() → 清除 UserStore → 清除 tokens → 顯示登出消息 → 重定向到登入頁
```

## 🔐 權限控制系統

### 測試帳號
- **管理員**: `admin` / `password123` (具有所有權限)
- **一般用戶**: `user` / `password123` (僅有基本權限)

### 權限檢查方法

```typescript
// 在組件中檢查權限
private readonly userStore = inject(UserStore);

// 檢查是否已登入
if (this.userStore.isAuthenticated()) {
  // 用戶已登入
}

// 檢查角色
if (this.userStore.hasRole(RoleName.ADMIN)) {
  // 用戶是管理員
}

// 檢查權限
if (this.userStore.hasPermission(PermissionName.USER_CREATE)) {
  // 用戶有創建用戶的權限
}
```

### 路由保護配置

```typescript
// 需要登入但無特定權限要求
{
  path: 'dashboard',
  canActivate: [PermissionGuard],
  data: { requireAuth: true },
  loadComponent: () => import('./dashboard.component')
}

// 需要特定權限
{
  path: 'admin',
  canActivate: [PermissionGuard],
  data: { 
    roles: [RoleName.ADMIN],
    permissions: [PermissionName.USER_CREATE]
  },
  loadComponent: () => import('./admin.component')
}
```

## 📢 全局消息通知系統

### 基本使用

```typescript
private readonly messageService = inject(GlobalMessageService);

// 顯示各類消息
this.messageService.success('操作成功！');
this.messageService.error('操作失敗');
this.messageService.warning('請注意');
this.messageService.info('系統通知');
```

### 高級配置

```typescript
// 自定義配置和操作按鈕
this.messageService.success('操作完成', '成功', {
  timeout: 0,        // 不自動消失
  dismissible: true, // 可手動關閉
  actions: [
    {
      label: '查看詳情',
      action: () => this.router.navigate(['/details']),
      style: 'primary'
    }
  ]
});
```

## 🛡️ 安全特性

### HTTP 攔截器
- 自動在請求中加入 Authorization header
- 處理 401 未授權錯誤（自動登出）
- 處理 403 權限不足錯誤（重定向到無權限頁面）

### Token 管理
- 登入成功後自動儲存 token 到 localStorage
- 登出時清除所有認證資料
- 應用啟動時檢查儲存的認證狀態

### 路由保護
- 所有主要功能頁面都受到權限保護
- 未登入用戶自動重定向到登入頁
- 權限不足時顯示無權限頁面

## 🎯 整合特性

### 登入頁面整合
- ✅ 支援 `returnUrl` 參數，登入後返回原始頁面
- ✅ 登入成功後自動設定用戶狀態
- ✅ 顯示歡迎消息
- ✅ 錯誤處理和消息提示

### 主頁面整合
- ✅ 動態顯示用戶姓名和角色
- ✅ 支援登出功能
- ✅ 應用啟動時檢查認證狀態
- ✅ 個人設定功能提示

### 路由配置整合
- ✅ 主要路由都受到權限保護
- ✅ 支援基本認證檢查
- ✅ 支援角色和權限檢查
- ✅ 完善的錯誤處理

## 🚀 快速開始

### 1. 測試登入功能
1. 訪問任何受保護頁面（如 `/course`）
2. 系統自動重定向到登入頁並保存 `returnUrl`
3. 使用測試帳號登入：`admin` / `1234` 或 `user` / `5678`
4. 登入成功後自動跳轉到原始頁面

### 2. 測試權限控制
1. 以 `user` 帳號登入
2. 嘗試訪問 `/department` 頁面（需要管理員權限）
3. 系統顯示權限不足消息並重定向到無權限頁面

### 3. 測試登出功能
1. 登入後點擊右上角用戶頭像
2. 選擇「登出」
3. 系統清除認證狀態並重定向到登入頁

## 🔧 自定義配置

### 擴展權限系統
在 `user.model.ts` 中加入新的角色或權限：

```typescript
export enum RoleName {
  // 現有角色...
  AUDITOR = 'AUDITOR'        // 新增角色
}

export enum PermissionName {
  // 現有權限...
  AUDIT_READ = 'AUDIT_READ'  // 新增權限
}
```

### 修改登入服務
在生產環境中，將 `LoginService` 中的模擬數據替換為實際 API 調用：

```typescript
login(username: string, password: string): Observable<LoginResponse> {
  return this.http.post<LoginResponse>('/api/auth/login', { username, password });
}
```

## 📝 最佳實踐

1. **認證優先**: 所有業務功能都應該要求用戶先登入
2. **權限分層**: 使用角色和權限的組合進行細粒度控制
3. **用戶體驗**: 提供清晰的錯誤消息和操作指引
4. **安全考量**: 定期清理過期 token，使用 HTTPS
5. **測試覆蓋**: 為所有認證和權限邏輯編寫測試

## ✅ 功能檢查清單

- [x] 登入頁面與權限系統完全整合
- [x] 支援 returnUrl 重定向機制
- [x] 動態用戶信息顯示
- [x] 完整的登出流程
- [x] HTTP 攔截器處理認證
- [x] 路由級別的權限保護
- [x] 全局消息通知整合
- [x] 錯誤處理和用戶反饋
- [x] 測試帳號和演示功能
- [x] 完整的文檔說明

---

**系統現已完全整合**，您可以使用測試帳號體驗完整的登入、權限控制和消息通知功能！
