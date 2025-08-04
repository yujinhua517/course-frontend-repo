# 前後端資料轉換系統使用指南

## 📋 概述

此系統實現了前端與後端之間資料格式的自動轉換：
- **前端**: 使用 `camelCase` (符合 JavaScript/TypeScript 慣例)
- **後端**: 使用 `snake_case` (符合 API/Database 慣例)
- **轉換**: 透過 HTTP 攔截器自動處理

## 🔧 核心工具

### 1. 轉換工具 (`object-case.util.ts`)

```typescript
import { keysToCamelCase, keysToSnakeCase, ApiResponseTransformer } from '@/core/utils/object-case.util';

// 字串轉換
snakeToCamel('job_role_code') // → 'jobRoleCode'
camelToSnake('jobRoleCode')   // → 'job_role_code'

// 物件轉換
keysToCamelCase({ job_role_id: 1, job_role_name: 'Test' })
// → { jobRoleId: 1, jobRoleName: 'Test' }

keysToSnakeCase({ jobRoleId: 1, jobRoleName: 'Test' })
// → { job_role_id: 1, job_role_name: 'Test' }
```

### 2. HTTP 錯誤處理 (`http-error-handler.service.ts`)

```typescript
import { HttpErrorHandlerService } from '@/core/services/http-error-handler.service';

// 在服務中使用
catchError(this.httpErrorHandler.handleError('methodName'))
```

### 3. HTTP 攔截器 (`case-conversion.interceptor.ts`)

自動處理所有 HTTP 請求/回應的格式轉換。

## 💡 使用方式

### 方案一：使用 HTTP 攔截器（推薦）✅

**優點**：
- 全自動，無需手動轉換
- 統一處理，減少錯誤
- 程式碼更簡潔

**設定**：
已在 `app.config.ts` 中註冊，無需額外設定。

**使用範例**：
```typescript
// 服務中的程式碼變得非常簡潔
export class JobRoleService {
  getJobRoles(params: { pageIndex: number; isActive: boolean }) {
    // 直接使用 camelCase，攔截器會自動轉換
    return this.http.post('/api/job-roles/query', params)
      .pipe(
        catchError(this.httpErrorHandler.handleError('getJobRoles'))
      );
  }
}
```

### 方案二：手動轉換

**使用時機**：
- 需要特殊轉換邏輯
- 調試或測試時

**範例**：
```typescript
export class JobRoleService {
  createJobRole(dto: JobRoleCreateDto) {
    // 手動轉換請求
    const backendDto = keysToSnakeCase(dto);
    
    return this.http.post('/api/job-roles', backendDto)
      .pipe(
        // 手動轉換回應
        map(response => ApiResponseTransformer.transformResponse(response)),
        catchError(this.httpErrorHandler.handleError('createJobRole'))
      );
  }
}
```

## 📝 模型定義規範

### 前端模型 (camelCase)

```typescript
// ✅ 正確：前端使用 camelCase
export interface JobRole {
  jobRoleId: number;
  jobRoleCode: string;
  jobRoleName: string;
  isActive: boolean;
  createTime?: string;
  updateTime?: string;
}

export interface JobRoleCreateDto {
  jobRoleCode: string;
  jobRoleName: string;
  isActive?: boolean;
}
```

### 後端模型對應 (snake_case)

```java
// 後端 Java (camelCase + @JsonProperty)
public class JobRoleDto {
    @JsonProperty("job_role_id")
    private Integer jobRoleId;
    
    @JsonProperty("job_role_code")
    private String jobRoleCode;
    
    @JsonProperty("job_role_name")
    private String jobRoleName;
    
    @JsonProperty("is_active")
    private Boolean isActive;
}
```

## 🔄 資料流程

```
前端 Component
    ↓ (camelCase)
前端 Service 
    ↓ (camelCase)
HTTP 攔截器 → 轉換為 snake_case
    ↓ (snake_case)
後端 API
    ↓ (snake_case)
HTTP 攔截器 ← 轉換為 camelCase  
    ↓ (camelCase)
前端 Service
    ↓ (camelCase)
前端 Component
```

## 🎯 最佳實踐

### 1. 命名規範

```typescript
// ✅ 前端：一律使用 camelCase
interface User {
  userId: number;
  userName: string;
  isActive: boolean;
  createTime: string;
}

// ❌ 避免：前端使用 snake_case
interface User {
  user_id: number;      // 錯誤
  user_name: string;    // 錯誤
  is_active: boolean;   // 錯誤
}
```

### 2. 服務寫法

```typescript
// ✅ 推薦：使用攔截器，程式碼簡潔
export class UserService {
  getUsers(params: { pageIndex: number; isActive: boolean }) {
    return this.http.post<ApiResponse<User[]>>('/api/users/query', params)
      .pipe(
        catchError(this.httpErrorHandler.handleError('getUsers'))
      );
  }
}

// ⚠️ 備用：手動轉換（特殊需求時使用）
export class UserService {
  getUsers(params: { pageIndex: number; isActive: boolean }) {
    const backendParams = keysToSnakeCase(params);
    return this.http.post('/api/users/query', backendParams)
      .pipe(
        map(response => ApiResponseTransformer.transformResponse(response)),
        catchError(this.httpErrorHandler.handleError('getUsers'))
      );
  }
}
```

### 3. 錯誤處理

```typescript
// ✅ 統一使用 HttpErrorHandlerService
.pipe(
  catchError(this.httpErrorHandler.handleError('methodName'))
)

// ❌ 避免：各別處理錯誤
.pipe(
  catchError(error => {
    console.error(error);
    return throwError(error);
  })
)
```

## 🐛 調試技巧

### 1. 檢查轉換日誌

打開瀏覽器開發者工具，查看 Console：
```
🔄 請求轉換: { 原始: {...}, 轉換後: {...} }
🔄 回應轉換: { 原始: {...}, 轉換後: {...} }
```

### 2. 暫時關閉攔截器

在 `case-conversion.interceptor.ts` 中：
```typescript
export function caseConversionInterceptor(request: HttpRequest<any>, next: HttpHandlerFn) {
  // 暫時關閉轉換
  return next(request);
}
```

### 3. 檢查特定 API 路徑

修改 `shouldConvertRequest` 函數來包含或排除特定路徑。

## 📁 檔案結構

```
src/app/core/
├── utils/
│   └── object-case.util.ts          # 轉換工具
├── services/
│   └── http-error-handler.service.ts # 錯誤處理
├── interceptors/
│   └── case-conversion.interceptor.ts # HTTP 攔截器
└── examples/
    └── service-with-converter.example.ts # 使用範例
```

## 🔧 故障排除

### 問題 1：轉換沒有生效
- 檢查 `app.config.ts` 是否註冊攔截器
- 檢查 API 路徑是否在 `shouldConvertRequest` 中

### 問題 2：某些欄位沒有轉換
- 檢查是否有巢狀物件
- 轉換工具支援深層轉換

### 問題 3：效能問題
- 轉換僅在需要時進行
- 可針對特定路徑關閉轉換

---

## 總結

透過這個轉換系統，前端開發者可以：
1. 使用標準的 camelCase 命名
2. 自動處理與後端的格式轉換
3. 統一錯誤處理
4. 減少重複程式碼
5. 提高程式碼品質

**推薦使用方案一（HTTP 攔截器）**，讓轉換完全自動化！
