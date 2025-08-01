---
mode: 'agent'
tools: ['codebase', 'editFiles']
description: 'Generate Angular API Service and TypeScript Models for Automated Backend Integration (with Feature-First, Mock Switch, and Strict Naming Rules)'
---

# Auto-Generate Angular API Service from Backend (Spring Boot/SpringDoc/Swagger/OpenAPI)  
**With Team Coding Standards, Feature-First Structure, and Mock/API Toggle**

---

## Step 1: Input API Source

**Please provide one of the following:**
- [ ] Java Controller code (Spring Boot, with @RestController/@RequestMapping/@GetMapping... and DTO/VO)
- [ ] Swagger/OpenAPI YAML/JSON file or spec URL
- [ ] Postman collection (JSON)

---

## Step 2: Analyze & Extract

- Parse all endpoints, HTTP methods, paths, and parameters.
- Extract all request/response models (DTO, VO, or OpenAPI schemas).
- For each model, convert to strict TypeScript interface/type (no any).
- Infer all enums, array/object structures, and required/optional fields.

---

## Step 3: Generate Angular Code (Strict, Feature-First, Mock Switch)

**For each API resource:**
- **Auto-detect feature/domain name（可用路徑、controller class名、或用戶指定）並建立於**  
  `/src/app/features/{feature}/services/{feature}-api.service.ts`
- **Models 產生於** `/src/app/features/{feature}/models/{feature}.model.ts`  
  （如有多個 model，可合併，enum/type 也同檔或同資料夾）
- 服務名稱遵循：`{Feature}ApiService`（PascalCase 類名 + kebab-case 檔名）

**Service 內容務必包含：**
- 使用 Angular 的 `HttpClient` 及 `Observable`
- **全部公開方法皆加上 `if (this.useMockData) { ... } else { ... }` 判斷，依照 instructions 實現一鍵 mock/api 切換**
  ```typescript
  private useMockData = true; // 設為 false 切換至真實 API
  ```
- **所有方法型別嚴格，無 any**，request/response 型別直接用 TS interface/enum
- CRUD 方法命名與 REST 路徑需與後端相符，並加註簡要註解
- 錯誤處理要有基本範例
- 若 API 有 ApiResponse<T> 包裝，請自動 unwrap，產生 generic TS interface

**SCSS/Style 不用產生**

---

## Step 4: Usage & Docs

- Print usage example：於 Angular component 注入與調用
- List 所有產生的 TS interfaces 與 endpoints
- **註明：所有 API service 皆可用一鍵 mock/api 切換，路徑與組織符合團隊 instructions**

---

## Step 5: 檢查與驗證

- No `any` in any interface or method
- Service/model/enum 路徑、命名、型別皆依據 Angular instructions
- Service 中 `useMockData` 切換覆蓋所有 CRUD
- 建議測試檔案結構（如 `{feature}-api.service.spec.ts`）

---

## 範例對話 (Example Dialogue)

User:  
```java
@RestController
@RequestMapping("/api/departments")
public class DepartmentController {
    @GetMapping("/{id}")
    public ResponseEntity<DepartmentDTO> getDepartment(@PathVariable Long id) { ... }
    @PostMapping
    public ResponseEntity<DepartmentDTO> createDepartment(@RequestBody DepartmentDTO department) { ... }
}
```
Copilot:  
1. 自動判斷 feature: department
2. 產生 `/src/app/features/department/services/department-api.service.ts`，並於檔頭加註「本檔案由 Copilot 根據 instructions 自動產生」
3. 產生 `/src/app/features/department/models/department.model.ts`，所有 enum/interface 集中於此
4. CRUD 方法皆以 if (this.useMockData) 包裝，可隨時切換
5. 輸出使用方式與所有 endpoints/type 一覽

---

## 中文快速說明

- 根據 Controller/Swagger，**自動產生對應 Feature 資料夾下的 API Service 與 TypeScript 型別，含 mock/api 切換**
- 檔案、命名、型別、switch、service路徑，**全部符合 Angular instructions 規範**
- 若需調整組織、命名、mock資料、測試檔等，均可補充需求

---
