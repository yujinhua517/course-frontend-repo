# Job Role Management System - 前後端整合說明

## 概述

本系統包含前端 Angular 應用程式和後端 Spring Boot API，實現了完整的職務角色管理功能。

## 系統架構

### 後端 (Spring Boot)
- **端口**: 8080
- **API 基礎路徑**: `/api/job-roles`
- **資料庫**: SQL Server

### 前端 (Angular)
- **端口**: 4200
- **代理配置**: 所有 `/api/*` 請求代理到 `http://localhost:8080`

## 啟動步驟

### 1. 啟動後端
```bash
cd course-backend-hua
mvn spring-boot:run
```

### 2. 啟動前端
```bash
cd course-frontend-hua
npm start
```

或者使用：
```bash
ng serve
```

## API 端點對應

| 前端請求 | 後端端點 | 說明 |
|---------|---------|------|
| `GET /api/job-roles` | `GET /api/job-roles` | 獲取所有職務角色 |
| `GET /api/job-roles/find/{id}` | `GET /api/job-roles/find/{id}` | 根據ID獲取職務角色 |
| `GET /api/job-roles/code/{code}` | `GET /api/job-roles/code/{code}` | 根據代碼獲取職務角色 |
| `POST /api/job-roles/create` | `POST /api/job-roles/create` | 創建新職務角色 |
| `POST /api/job-roles/update` | `POST /api/job-roles/update` | 更新職務角色 |
| `POST /api/job-roles/delete` | `POST /api/job-roles/delete` | 刪除職務角色 |
| `POST /api/job-roles/query` | `POST /api/job-roles/query` | 分頁查詢職務角色 |

## 主要修正內容

### 1. 模型更新
- 新增 `job_role_id` 主鍵欄位
- 統一欄位命名規範 (snake_case)
- 修正資料型別匹配

### 2. 服務層更新
- 更新 API 端點路徑以匹配後端
- 修正 HTTP 方法 (GET/POST)
- 更新請求參數格式
- 修正 Mock 資料結構

### 3. 組件更新
- 表單組件支援 `job_role_id` 更新
- 列表組件使用 ID 進行刪除操作
- 錯誤處理改進

## 資料格式範例

### 創建職務角色請求
```json
{
  "job_role_code": "DEV001",
  "job_role_name": "前端開發工程師",
  "description": "負責前端使用者介面開發與維護",
  "is_active": true,
  "create_user": "admin"
}
```

### 更新職務角色請求
```json
{
  "job_role_id": 1,
  "job_role_code": "DEV001",
  "job_role_name": "資深前端開發工程師",
  "description": "負責前端架構設計與開發",
  "is_active": true,
  "update_user": "admin"
}
```

### 分頁查詢請求
```json
{
  "job_role_name": "開發",
  "is_active": true,
  "page_index": 0,
  "page_size": 10,
  "sort_column": "job_role_id",
  "sort_direction": "DESC",
  "pageable": true
}
```

## 測試連接

可以使用提供的測試腳本來驗證前後端連接：

1. 在瀏覽器開發者工具中執行：
```javascript
// 複製 test-backend-connection.js 中的內容並執行
```

2. 或者直接訪問：
- 後端 API：http://localhost:8080/api/job-roles
- 前端應用：http://localhost:4200/job-role

## 故障排除

### 常見問題

1. **後端無法啟動**
   - 檢查 SQL Server 是否運行
   - 確認資料庫連接字串正確
   - 確保端口 8080 未被佔用

2. **前端無法連接後端**
   - 確認後端已啟動並在端口 8080 上運行
   - 檢查代理配置 (proxy.conf.js)
   - 查看瀏覽器網路標籤頁的錯誤

3. **資料庫錯誤**
   - 執行 `database/setup_database.bat` 創建資料庫和表
   - 確認 SQL Server 服務正在運行

## 下一步

系統現在應該能夠正常運行，包括：
- ✅ 職務角色列表顯示
- ✅ 創建新職務角色
- ✅ 編輯現有職務角色
- ✅ 刪除職務角色
- ✅ 分頁和搜索功能

如需進一步的功能擴展或問題排除，請參考相關文檔或聯繫開發團隊。
