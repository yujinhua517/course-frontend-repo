---
mode: 'agent'
tools: ['codebase', 'editFiles']
description: 'Generate Angular API Service and TypeScript Models for Automated Backend Integration'
---

# Auto-Generate Angular API Service from Backend (Spring Boot/SpringDoc/Swagger/OpenAPI)

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

## Step 3: Generate Angular Code (Strict)

**For each API resource:**
- Create a new service file under `/src/app/services/` (e.g., `department-api.service.ts`)
- Generate strongly-typed Angular service with CRUD methods:
  - Use Angular's `HttpClient` and `Observable`
  - All methods must type parameters and response with generated TS interfaces
  - Use consistent, kebab-case REST paths and method names (`findAll()`, `findById()`, `create()`, `update()`, `delete()`, `findByPage()` etc.)
  - Add helpful comments for each API method (summary/description, param type, expected response)
  - Add error handling and types

**Model generation:**
- All DTO/VO/response objects must be generated as TypeScript `interface` in `/src/app/models/` (or `/models/department.model.ts` etc.)
- Enum fields are converted to TypeScript union type or `enum`
- All interfaces are strict, follow project naming conventions

**Extra:**
- If the API uses envelope (e.g., `ApiResponse<T>`), unwrap/generate the generic TypeScript wrapper

---

## Step 4: Usage & Docs

- At the end, print a usage example for consuming the generated service in Angular component
- List all generated interfaces and endpoints for reference

---

## Validation

- No `any` in any interface or method
- All models/interfaces are strict, with field comments (if source has)
- All endpoints/types match backend logic
- All paths, naming, and method signatures are Angular/TS best practice
- Service is ready to be imported and injected in Angular app

---

## Example Dialogue

User:  
```java
@RestController
@RequestMapping("/api/departments")
public class DepartmentController {
    @GetMapping("/{id}")
    public ResponseEntity<DepartmentDTO> getDepartment(@PathVariable Long id) {
        // ...
    }

    @PostMapping
    public ResponseEntity<DepartmentDTO> createDepartment(@RequestBody DepartmentDTO department) {
        // ...
    }
}
```

Copilot:
1. Parsed endpoints:  
   - GET /api/departments
   - GET /api/departments/find/{id}
   - POST /api/departments/create
   - ...
2. Generated TypeScript interfaces for DepartmentDto, DepartmentVo, ApiResponse<T>
3. Created `department-api.service.ts` with all CRUD methods, strongly typed
4. Example usage in Angular:

```typescript
constructor(private departmentApi: DepartmentApiService) {}
ngOnInit() {
  this.departmentApi.findAll().subscribe(depts => this.data = depts);
}
```
5. Generated models:
   - `DepartmentDto`
   - `ApiResponse<T>`
   - `DepartmentStatus` (enum)
   - Full code and documentation generated
---

## 中文快速說明（For 中文需求直接下指令）
- 請幫我自動產生 Angular 前端 API Service 和 TypeScript 型別，依據我給的 Controller/Swagger 文件，自動完成以下：
- 解析所有 API 路徑、方法、參數，並將回應模型/DTO 轉為 TS interface
- 幫我生成 /src/app/services/xxx-api.service.ts（含所有 CRUD 方法、型別正確、用 Observable、可直接注入使用）
- 型別、欄位、回傳物件完全嚴格（無 any），所有 Enum/type 一律正確轉為 TS union type 或 enum
- 如有 ApiResponse<T> 包裝，請自動 unwrap 並產生 generic type
- 給我一份元件調用 Service 的 usage example
- 最後列出所有生成的 endpoints 與 TypeScript 型別

## Paste your backend Controller or Swagger/OpenAPI spec below to start!

