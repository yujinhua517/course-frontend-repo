import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, delay } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import {
    JobRole,
    JobRoleCreateDto,
    JobRoleUpdateDto,
    JobRoleSearchParams,
    ApiResponse
} from '../models/job-role.model';
import { HttpErrorHandlerService } from '../../../core/services/http-error-handler.service';
import { BaseQueryService } from '../../../core/services/base-query.service';

@Injectable({
    providedIn: 'root'
})
export class JobRoleService extends BaseQueryService<JobRole, JobRoleSearchParams> {
    protected override readonly http = inject(HttpClient);
    protected override readonly httpErrorHandler = inject(HttpErrorHandlerService);
    protected override readonly apiUrl = `${environment.apiBaseUrl}/job-roles`;
    protected override readonly defaultSortColumn = 'jobRoleCode';
    protected override readonly useMockData = false;

    // Mock 資料 (使用 camelCase)
    protected override readonly mockData: JobRole[] = [
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
            jobRoleCode: 'DEV003',
            jobRoleName: '全端開發工程師',
            description: '具備前後端開發能力的工程師',
            isActive: true,
            createTime: '2024-01-03T09:00:00',
            createUser: 'admin',
            updateTime: '2024-01-03T09:00:00',
            updateUser: 'admin'
        },
        {
            jobRoleId: 4,
            jobRoleCode: 'TEST001',
            jobRoleName: '軟體測試工程師',
            description: '負責軟體品質保證與測試',
            isActive: true,
            createTime: '2024-01-04T09:00:00',
            createUser: 'admin',
            updateTime: '2024-01-04T09:00:00',
            updateUser: 'admin'
        },
        {
            jobRoleId: 5,
            jobRoleCode: 'DEVOPS001',
            jobRoleName: 'DevOps 工程師',
            description: '負責 CI/CD 流程與基礎設施管理',
            isActive: false,
            createTime: '2024-01-05T09:00:00',
            createUser: 'admin',
            updateTime: '2024-01-05T09:00:00',
            updateUser: 'admin'
        },
        {
            jobRoleId: 6,
            jobRoleCode: 'PM001',
            jobRoleName: '專案經理',
            description: '負責專案規劃與執行管理',
            isActive: true,
            createTime: '2024-01-06T09:00:00',
            createUser: 'admin',
            updateTime: '2024-01-06T09:00:00',
            updateUser: 'admin'
        },
        {
            jobRoleId: 7,
            jobRoleCode: 'UI001',
            jobRoleName: 'UI/UX 設計師',
            description: '負責使用者介面與體驗設計',
            isActive: true,
            createTime: '2024-01-07T09:00:00',
            createUser: 'admin',
            updateTime: '2024-01-07T09:00:00',
            updateUser: 'admin'
        },
        {
            jobRoleId: 8,
            jobRoleCode: 'SA001',
            jobRoleName: '系統分析師',
            description: '負責系統需求分析與設計',
            isActive: false,
            createTime: '2024-01-08T09:00:00',
            createUser: 'admin',
            updateTime: '2024-01-08T09:00:00',
            updateUser: 'admin'
        },
        {
            jobRoleId: 9,
            jobRoleCode: 'DB001',
            jobRoleName: '資料庫管理師',
            description: '負責資料庫規劃與管理',
            isActive: false,
            createTime: '2024-01-09T09:00:00',
            createUser: 'admin',
            updateTime: '2024-01-09T09:00:00',
            updateUser: 'admin'
        },
        {
            jobRoleId: 10,
            jobRoleCode: 'SEC001',
            jobRoleName: '資安工程師',
            description: '負責資訊安全與風險評估',
            isActive: true,
            createTime: '2024-01-10T09:00:00',
            createUser: 'admin',
            updateTime: '2024-01-10T09:00:00',
            updateUser: 'admin'
        }
    ];

    protected override mapSortColumn(column: string): string {
        // JobRole 表格的排序欄位映射
        const columnMap: Record<string, string> = {
            'jobRoleId': 'job_role_id',
            'jobRoleCode': 'job_role_code',
            'jobRoleName': 'job_role_name',
            'description': 'description',
            'isActive': 'is_active',
            'createTime': 'create_time',
            'updateTime': 'update_time'
        };
        return columnMap[column] || column;
    }

    protected override applyMockFilters(data: JobRole[], params?: JobRoleSearchParams): JobRole[] {
        let filtered = [...data];

        if (params?.isActive !== undefined) {
            const targetStatus = Boolean(params.isActive);
            filtered = filtered.filter(jr => Boolean(jr.isActive) === targetStatus);
        }

        if (params?.jobRoleCode) {
            filtered = filtered.filter(jr => jr.jobRoleCode.includes(params.jobRoleCode as string));
        }

        if (params?.jobRoleName) {
            filtered = filtered.filter(jr => jr.jobRoleName.includes(params.jobRoleName as string));
        }

        if (params?.description) {
            filtered = filtered.filter(jr => jr.description?.includes(params.description as string));
        }

        if (params?.keyword) {
            const keyword = params.keyword.toLowerCase();
            filtered = filtered.filter(jr =>
                jr.jobRoleName.toLowerCase().includes(keyword) ||
                jr.jobRoleCode.toLowerCase().includes(keyword) ||
                (jr.description && jr.description.toLowerCase().includes(keyword))
            );
        }

        return filtered;
    }

    /**
     * 根據 ID 取得單一職務角色
     */
    getJobRoleById(id: number): Observable<JobRole | null> {
        if (this.useMockData) {
            return of(this.getMockJobRoleById(id)).pipe(delay(300));
        }

        return this.http.get<ApiResponse<JobRole>>(`${this.apiUrl}/find/${id}`)
            .pipe(
                map(response => response.data || null),
                catchError(this.httpErrorHandler.handleError('getJobRoleById', null))
            );
    }

    /**
     * 根據職務代碼取得職務角色
     */
    getJobRoleByCode(jobRoleCode: string): Observable<JobRole | null> {
        if (this.useMockData) {
            return of(this.getMockJobRoleByCode(jobRoleCode)).pipe(delay(300));
        }

        return this.http.get<ApiResponse<JobRole>>(`${this.apiUrl}/code/${jobRoleCode}`)
            .pipe(
                map(response => response.data || null),
                catchError(this.httpErrorHandler.handleError('getJobRoleByCode', null))
            );
    }

    /**
     * 建立新職務角色
     */
    createJobRole(jobRoleData: JobRoleCreateDto): Observable<JobRole | null> {
        if (this.useMockData) {
            return of(this.createMockJobRole(jobRoleData)).pipe(delay(600));
        }

        return this.http.post<ApiResponse<JobRole>>(`${this.apiUrl}/create`, jobRoleData)
            .pipe(
                map(response => response.data || null),
                catchError(this.httpErrorHandler.handleError('createJobRole', null))
            );
    }

    /**
     * 更新職務角色資料
     */
    updateJobRole(id: number, jobRoleData: JobRoleUpdateDto): Observable<JobRole | null> {
        if (this.useMockData) {
            return of(this.updateMockJobRole(id, jobRoleData)).pipe(delay(600));
        }

        return this.http.post<ApiResponse<JobRole>>(`${this.apiUrl}/update`, {
            ...jobRoleData,
            jobRoleId: id
        })
            .pipe(
                map(response => response.data || null),
                catchError(this.httpErrorHandler.handleError('updateJobRole', null))
            );
    }

    /**
     * 刪除職務角色
     */
    deleteJobRole(id: number): Observable<boolean> {
        if (this.useMockData) {
            return of(true).pipe(delay(400));
        }

        return this.http.post<ApiResponse<void>>(`${this.apiUrl}/delete`, { jobRoleId: id })
            .pipe(
                map(response => response.code === 1000),
                catchError(this.httpErrorHandler.handleError('deleteJobRole', false))
            );
    }

    // Mock 資料處理方法
    private getMockJobRoleById(id: number): JobRole | null {
        return this.mockData.find((jr: JobRole) => jr.jobRoleId === id) || null;
    }

    private getMockJobRoleByCode(jobRoleCode: string): JobRole | null {
        return this.mockData.find((jr: JobRole) => jr.jobRoleCode === jobRoleCode) || null;
    }

    private createMockJobRole(jobRoleData: JobRoleCreateDto): JobRole {
        const newId = Math.max(...this.mockData.map((jr: JobRole) => jr.jobRoleId || 0)) + 1;
        const now = new Date().toISOString();

        return {
            jobRoleId: newId,
            jobRoleCode: jobRoleData.jobRoleCode,
            jobRoleName: jobRoleData.jobRoleName,
            description: jobRoleData.description,
            isActive: jobRoleData.isActive ?? true,
            createTime: now,
            createUser: jobRoleData.createUser || 'current_user',
            updateTime: now,
            updateUser: jobRoleData.createUser || 'current_user'
        };
    }

    private updateMockJobRole(id: number, jobRoleData: JobRoleUpdateDto): JobRole {
        const existing = this.getMockJobRoleById(id);
        if (!existing) {
            throw new Error('Job role not found');
        }

        return {
            ...existing,
            jobRoleCode: jobRoleData.jobRoleCode ?? existing.jobRoleCode,
            jobRoleName: jobRoleData.jobRoleName ?? existing.jobRoleName,
            description: jobRoleData.description ?? existing.description,
            isActive: jobRoleData.isActive ?? existing.isActive,
            updateTime: new Date().toISOString(),
            updateUser: jobRoleData.updateUser || 'current_user'
        };
    }
}
