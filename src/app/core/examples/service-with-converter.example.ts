/**
 * 示範如何在服務中使用轉換工具
 * 這個範例展示了正確的前後端資料轉換模式
 */

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, catchError } from 'rxjs';
import { ApiResponseTransformer, keysToSnakeCase } from '../utils/object-case.util';
import { HttpErrorHandlerService } from '../services/http-error-handler.service';

// 前端模型 (使用 camelCase)
interface JobRole {
  jobRoleId: number;
  jobRoleCode: string;
  jobRoleName: string;
  description?: string;
  isActive: boolean;
  createTime?: string;
  createUser?: string;
  updateTime?: string;
  updateUser?: string;
}

interface JobRoleCreateDto {
  jobRoleCode: string;
  jobRoleName: string;
  description?: string;
  isActive?: boolean;
  createUser?: string;
}

interface ApiResponse<T> {
  code: number;
  message: string;
  data?: T;
}

@Injectable({
  providedIn: 'root'
})
export class ExampleJobRoleService {
  private http = inject(HttpClient);
  private httpErrorHandler = inject(HttpErrorHandlerService);
  private apiUrl = '/api/job-roles';

  /**
   * 查詢職務列表
   * 示範：前端發送 camelCase，後端接收 snake_case，回應轉換為 camelCase
   */
  getJobRoles(params: { pageIndex?: number; pageSize?: number; isActive?: boolean }): Observable<ApiResponse<JobRole[]>> {
    // 1. 前端參數使用 camelCase
    const frontendParams = {
      pageIndex: params.pageIndex || 0,
      pageSize: params.pageSize || 10,
      isActive: params.isActive
    };

    // 2. 轉換為後端 snake_case 格式
    const backendParams = keysToSnakeCase(frontendParams);
    console.log('發送到後端的參數:', backendParams);
    // 結果: { page_index: 0, page_size: 10, is_active: true }

    return this.http.post<ApiResponse<JobRole[]>>(`${this.apiUrl}/query`, backendParams)
      .pipe(
        // 3. 將後端回應從 snake_case 轉換為 camelCase
        map(response => {
          console.log('後端原始回應:', response);
          const transformedResponse = ApiResponseTransformer.transformResponse<ApiResponse<JobRole[]>>(response);
          console.log('轉換後的回應:', transformedResponse);
          return transformedResponse;
        }),
        // 4. 統一錯誤處理
        catchError(this.httpErrorHandler.handleError('getJobRoles'))
      );
  }

  /**
   * 創建職務
   * 示範：DTO 轉換和錯誤處理
   */
  createJobRole(dto: JobRoleCreateDto): Observable<ApiResponse<JobRole>> {
    // 1. 前端 DTO 使用 camelCase
    console.log('前端 DTO (camelCase):', dto);

    // 2. 轉換為後端格式
    const backendDto = keysToSnakeCase(dto);
    console.log('後端 DTO (snake_case):', backendDto);

    return this.http.post<ApiResponse<JobRole>>(`${this.apiUrl}`, backendDto)
      .pipe(
        // 3. 轉換回應
        map(response => ApiResponseTransformer.transformResponse<ApiResponse<JobRole>>(response)),
        // 4. 錯誤處理
        catchError(this.httpErrorHandler.handleError('createJobRole'))
      );
  }

  /**
   * 更新職務
   */
  updateJobRole(id: number, dto: Partial<JobRoleCreateDto>): Observable<ApiResponse<JobRole>> {
    const backendDto = keysToSnakeCase(dto);
    
    return this.http.put<ApiResponse<JobRole>>(`${this.apiUrl}/${id}`, backendDto)
      .pipe(
        map(response => ApiResponseTransformer.transformResponse<ApiResponse<JobRole>>(response)),
        catchError(this.httpErrorHandler.handleError('updateJobRole'))
      );
  }

  /**
   * 刪除職務
   */
  deleteJobRole(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`)
      .pipe(
        map(response => ApiResponseTransformer.transformResponse<ApiResponse<void>>(response)),
        catchError(this.httpErrorHandler.handleError('deleteJobRole'))
      );
  }

  /**
   * 批量更新狀態
   */
  batchUpdateStatus(jobRoleCodes: string[], isActive: boolean): Observable<ApiResponse<void>> {
    const payload = keysToSnakeCase({
      jobRoleCodes,  // 轉換為 job_role_codes
      isActive       // 轉換為 is_active
    });

    return this.http.patch<ApiResponse<void>>(`${this.apiUrl}/batch-status`, payload)
      .pipe(
        map(response => ApiResponseTransformer.transformResponse<ApiResponse<void>>(response)),
        catchError(this.httpErrorHandler.handleError('batchUpdateStatus'))
      );
  }
}

/**
 * 使用範例：
 * 
 * 1. 在 Component 中注入服務
 * const jobRoleService = inject(ExampleJobRoleService);
 * 
 * 2. 呼叫服務方法
 * jobRoleService.getJobRoles({ pageIndex: 0, pageSize: 10, isActive: true })
 *   .subscribe(response => {
 *     console.log('前端收到的資料 (camelCase):', response.data);
 *   });
 * 
 * 3. 資料流程：
 *    前端 camelCase → 轉換 → 後端 snake_case → API → 
 *    後端回應 snake_case → 轉換 → 前端 camelCase
 */
