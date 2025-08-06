/**
 * Job-Role Service 重構版本
 * 
 * 示範如何使用統一的 BaseQueryService 來重構現有的 Service
 * 這個版本完全依賴攔截器進行前後端格式轉換
 */

import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, delay } from 'rxjs';
import { BaseQueryService } from '../../../core/services/base-query.service';
import { environment } from '../../../../environments/environment';
import {
    JobRole,
    JobRoleCreateDto,
    JobRoleUpdateDto,
    JobRoleSearchParams,
    ApiResponse,
    JobRoleListResponse
} from '../models/job-role.model';

@Injectable({
    providedIn: 'root'
})
export class JobRoleServiceRefactored extends BaseQueryService<JobRole, JobRoleSearchParams> {
    // 基礎配置
    protected readonly apiUrl = `${environment.apiBaseUrl}/job-roles`;
    protected readonly useMockData = false;
    protected readonly defaultSortColumn = 'jobRoleCode';

    // Mock 資料
    protected readonly mockData: JobRole[] = [
        {
            jobRoleId: 1,
            jobRoleCode: 'DEV001',
            jobRoleName: '前端開發工程師',
            description: '負責前端使用者介面開發與維護',
            isActive: true,
            createTime: '2024-01-01T09:00:00',
            createUser: 'admin',
            updateTime: '2024-01-01T09:00:00',
            updateUser: 'admin'
        },
        {
            jobRoleId: 2,
            jobRoleCode: 'DEV002',
            jobRoleName: '後端開發工程師',
            description: '負責後端系統架構設計與 API 開發',
            isActive: true,
            createTime: '2024-01-02T09:00:00',
            createUser: 'admin',
            updateTime: '2024-01-02T09:00:00',
            updateUser: 'admin'
        },
        {
            jobRoleId: 3,
            jobRoleCode: 'QA001',
            jobRoleName: '軟體測試工程師',
            description: '負責軟體品質保證與測試流程規劃',
            isActive: true,
            createTime: '2024-01-03T09:00:00',
            createUser: 'admin',
            updateTime: '2024-01-03T09:00:00',
            updateUser: 'admin'
        },
        {
            jobRoleId: 4,
            jobRoleCode: 'PM001',
            jobRoleName: '專案經理',
            description: '負責專案規劃、執行與管控',
            isActive: true,
            createTime: '2024-01-04T09:00:00',
            createUser: 'admin',
            updateTime: '2024-01-04T09:00:00',
            updateUser: 'admin'
        },
        {
            jobRoleId: 5,
            jobRoleCode: 'UI001',
            jobRoleName: 'UI/UX 設計師',
            description: '負責使用者介面與體驗設計',
            isActive: false,
            createTime: '2024-01-05T09:00:00',
            createUser: 'admin',
            updateTime: '2024-01-05T09:00:00',
            updateUser: 'admin'
        }
    ];

    // Signals (保持原有的狀態管理)
    isLoading = signal<boolean>(false);
    error = signal<string | null>(null);

    /**
     * 欄位映射：前端 camelCase -> 後端 snake_case
     */
    protected override mapSortColumn(frontendColumn?: string): string {
        const mapping: Record<string, string> = {
            'jobRoleId': 'job_role_id',
            'jobRoleCode': 'job_role_code',
            'jobRoleName': 'job_role_name',
            'description': 'description',
            'isActive': 'is_active',
            'createTime': 'create_time',
            'createUser': 'create_user',
            'updateTime': 'update_time',
            'updateUser': 'update_user'
        };
        return mapping[frontendColumn || ''] || 'job_role_code';
    }

    /**
     * Mock 資料篩選邏輯
     */
    protected override applyMockFilters(data: JobRole[], params?: JobRoleSearchParams): JobRole[] {
        let filtered = [...data];

        // 關鍵字搜尋
        if (params?.keyword) {
            const keyword = params.keyword.toLowerCase();
            filtered = filtered.filter(role =>
                role.jobRoleCode.toLowerCase().includes(keyword) ||
                role.jobRoleName.toLowerCase().includes(keyword) ||
                role.description?.toLowerCase().includes(keyword)
            );
        }

        // 啟用狀態篩選
        if (params?.isActive !== undefined) {
            filtered = filtered.filter(role => role.isActive === params.isActive);
        }

        // 職務代碼篩選
        if (params?.jobRoleCode) {
            filtered = filtered.filter(role =>
                role.jobRoleCode.toLowerCase().includes(params.jobRoleCode!.toLowerCase())
            );
        }

        // 職務名稱篩選
        if (params?.jobRoleName) {
            filtered = filtered.filter(role =>
                role.jobRoleName.toLowerCase().includes(params.jobRoleName!.toLowerCase())
            );
        }

        return filtered;
    }

    /**
     * 建構自訂 API 參數
     */
    protected override buildCustomApiParams(params?: JobRoleSearchParams): Record<string, any> {
        return {
            ...(params?.jobRoleId && { jobRoleId: params.jobRoleId }),
            ...(params?.jobRoleCode && { jobRoleCode: params.jobRoleCode }),
            ...(params?.jobRoleName && { jobRoleName: params.jobRoleName }),
            ...(params?.description && { description: params.description })
        };
    }

    // === 以下為 CRUD 操作，保持原有邏輯 ===

    /**
     * 查詢所有啟用的職務列表
     */
    getActiveJobRoles(): Observable<ApiResponse<JobRole[]>> {
        if (this.useMockData) {
            const activeJobRoles = this.mockData.filter(role => role.isActive);
            return of({
                code: 200,
                message: '查詢成功',
                data: activeJobRoles
            }).pipe(delay(300));
        }

        // 依賴攔截器轉換，無需手動處理格式
        return this.http.get<ApiResponse<JobRole[]>>(`${this.apiUrl}/active`);
    }

    /**
     * 根據 ID 獲取職務
     */
    getJobRoleById(id: number): Observable<ApiResponse<JobRole>> {
        if (this.useMockData) {
            const jobRole = this.mockData.find(role => role.jobRoleId === id);
            return of({
                code: jobRole ? 200 : 404,
                message: jobRole ? '查詢成功' : '職務不存在',
                data: jobRole
            }).pipe(delay(300));
        }

        return this.http.get<ApiResponse<JobRole>>(`${this.apiUrl}/find/${id}`);
    }

    /**
     * 根據職務代碼查詢職務詳情
     */
    getJobRoleByCode(jobRoleCode: string): Observable<ApiResponse<JobRole>> {
        if (this.useMockData) {
            const jobRole = this.mockData.find(role => role.jobRoleCode === jobRoleCode);
            return of({
                code: jobRole ? 200 : 404,
                message: jobRole ? '查詢成功' : '職務不存在',
                data: jobRole
            }).pipe(delay(300));
        }

        return this.http.get<ApiResponse<JobRole>>(`${this.apiUrl}/code/${jobRoleCode}`);
    }

    /**
     * 創建職務
     */
    createJobRole(dto: JobRoleCreateDto, createUser: string = 'system'): Observable<ApiResponse<JobRole>> {
        const createData = { ...dto, createUser };

        if (this.useMockData) {
            const newJobRole: JobRole = {
                jobRoleId: Math.max(...this.mockData.map(r => r.jobRoleId || 0)) + 1,
                ...createData,
                isActive: createData.isActive ?? true,
                createTime: new Date().toISOString(),
                updateTime: new Date().toISOString(),
                updateUser: createUser
            };

            this.mockData.push(newJobRole);

            return of({
                code: 200,
                message: '創建成功',
                data: newJobRole
            }).pipe(delay(500));
        }

        // 依賴攔截器轉換格式
        return this.http.post<ApiResponse<JobRole>>(`${this.apiUrl}/create`, createData);
    }

    /**
     * 更新職務
     */
    updateJobRole(dto: JobRoleUpdateDto, updateUser: string = 'system'): Observable<ApiResponse<JobRole>> {
        const updateData = { ...dto, updateUser };

        if (this.useMockData) {
            const index = this.mockData.findIndex(role => role.jobRoleId === dto.jobRoleId);
            if (index === -1) {
                return of({
                    code: 404,
                    message: '職務不存在'
                }).pipe(delay(300));
            }

            const updatedJobRole = {
                ...this.mockData[index],
                ...updateData,
                updateTime: new Date().toISOString()
            };

            this.mockData[index] = updatedJobRole;

            return of({
                code: 200,
                message: '更新成功',
                data: updatedJobRole
            }).pipe(delay(500));
        }

        return this.http.post<ApiResponse<JobRole>>(`${this.apiUrl}/update`, updateData);
    }

    /**
     * 刪除職務
     */
    deleteJobRole(id: number): Observable<ApiResponse<void>> {
        if (this.useMockData) {
            const index = this.mockData.findIndex(role => role.jobRoleId === id);
            if (index === -1) {
                return of({
                    code: 404,
                    message: '職務不存在'
                }).pipe(delay(300));
            }

            this.mockData.splice(index, 1);

            return of({
                code: 200,
                message: '刪除成功'
            }).pipe(delay(500));
        }

        return this.http.post<ApiResponse<void>>(`${this.apiUrl}/delete`, { jobRoleId: id });
    }

    // === 向後兼容的統一查詢方法 ===

    /**
     * 統一的分頁查詢方法（向後兼容）
     * 內部使用 BaseQueryService 的 getPagedData 方法
     */
    getJobRoles(params?: JobRoleSearchParams): Observable<JobRoleListResponse> {
        return this.getPagedData(params);
    }
}
