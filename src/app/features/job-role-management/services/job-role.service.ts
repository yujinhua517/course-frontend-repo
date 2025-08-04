import { Injectable, signal, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, delay, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
    JobRole,
    JobRoleCreateDto,
    JobRoleUpdateDto,
    JobRoleSearchParams,
    ApiResponse,
    PagerDto,
    JobRoleListResponse
} from '../models/job-role.model';

@Injectable({
    providedIn: 'root'
})
export class JobRoleService {
    private http = inject(HttpClient);
    private useMockData = false; // 臨時使用 Mock 資料來檢查前端邏輯
    private apiUrl = `${environment.apiBaseUrl}/job-roles`;

    // Signals
    isLoading = signal<boolean>(false);
    error = signal<string | null>(null);

    // Mock 資料
    private mockJobRoles: JobRole[] = [
        {
            job_role_id: 1,
            job_role_code: 'DEV001',
            job_role_name: '前端開發工程師',
            description: '負責前端使用者介面開發與維護',
            is_active: true,
            create_time: '2024-01-01T09:00:00',
            create_user: 'admin',
            update_time: '2024-01-01T09:00:00',
            update_user: 'admin'
        },
        {
            job_role_id: 2,
            job_role_code: 'DEV002',
            job_role_name: '後端開發工程師',
            description: '負責後端系統架構設計與 API 開發',
            is_active: true,
            create_time: '2024-01-02T09:00:00',
            create_user: 'admin',
            update_time: '2024-01-02T09:00:00',
            update_user: 'admin'
        },
        {
            job_role_id: 3,
            job_role_code: 'DEV003',
            job_role_name: '全端開發工程師',
            description: '具備前後端開發能力的工程師',
            is_active: true,
            create_time: '2024-01-03T09:00:00',
            create_user: 'admin',
            update_time: '2024-01-03T09:00:00',
            update_user: 'admin'
        },
        {
            job_role_id: 4,
            job_role_code: 'TEST001',
            job_role_name: '軟體測試工程師',
            description: '負責軟體品質保證與測試',
            is_active: true,
            create_time: '2024-01-04T09:00:00',
            create_user: 'admin',
            update_time: '2024-01-04T09:00:00',
            update_user: 'admin'
        },
        {
            job_role_id: 5,
            job_role_code: 'DEVOPS001',
            job_role_name: 'DevOps 工程師',
            description: '負責 CI/CD 流程與基礎設施管理',
            is_active: false,
            create_time: '2024-01-05T09:00:00',
            create_user: 'admin',
            update_time: '2024-01-05T09:00:00',
            update_user: 'admin'
        },
        {
            job_role_id: 6,
            job_role_code: 'PM001',
            job_role_name: '專案經理',
            description: '負責專案規劃與執行管理',
            is_active: true,
            create_time: '2024-01-06T09:00:00',
            create_user: 'admin',
            update_time: '2024-01-06T09:00:00',
            update_user: 'admin'
        },
        {
            job_role_id: 7,
            job_role_code: 'UI001',
            job_role_name: 'UI/UX 設計師',
            description: '負責使用者介面與體驗設計',
            is_active: true,
            create_time: '2024-01-07T09:00:00',
            create_user: 'admin',
            update_time: '2024-01-07T09:00:00',
            update_user: 'admin'
        },
        {
            job_role_id: 8,
            job_role_code: 'SA001',
            job_role_name: '系統分析師',
            description: '負責系統需求分析與設計',
            is_active: false,
            create_time: '2024-01-08T09:00:00',
            create_user: 'admin',
            update_time: '2024-01-08T09:00:00',
            update_user: 'admin'
        },
        {
            job_role_id: 9,
            job_role_code: 'DB001',
            job_role_name: '資料庫管理師',
            description: '負責資料庫規劃與管理',
            is_active: false,
            create_time: '2024-01-09T09:00:00',
            create_user: 'admin',
            update_time: '2024-01-09T09:00:00',
            update_user: 'admin'
        },
        {
            job_role_id: 10,
            job_role_code: 'SEC001',
            job_role_name: '資安工程師',
            description: '負責資訊安全與風險評估',
            is_active: true,
            create_time: '2024-01-10T09:00:00',
            create_user: 'admin',
            update_time: '2024-01-10T09:00:00',
            update_user: 'admin'
        }
    ];

    /**
     * 分頁查詢職務列表
     */
    getJobRoles(params?: JobRoleSearchParams): Observable<JobRoleListResponse> {
        if (this.useMockData) {
            return this.getMockJobRoles(params);
        }

        // 真實 API 呼叫 - 使用 GET 方式獲取所有職務，前端處理分頁和篩選
        return this.http.get<ApiResponse<JobRole[]>>(this.apiUrl).pipe(
            map(response => {
                if (response.code === 1000) {
                    let filteredData = [...response.data];

                    // 搜尋篩選
                    if (params?.keyword) {
                        const keyword = params.keyword.toLowerCase();
                        filteredData = filteredData.filter(item =>
                            item.job_role_code.toLowerCase().includes(keyword) ||
                            item.job_role_name.toLowerCase().includes(keyword) ||
                            (item.description && item.description.toLowerCase().includes(keyword))
                        );
                    }

                    // 狀態篩選
                    if (params?.is_active !== undefined) {
                        let targetStatus: boolean;
                        if (typeof params.is_active === 'string') {
                            targetStatus = params.is_active === 'true';
                        } else {
                            targetStatus = params.is_active;
                        }
                        filteredData = filteredData.filter(item => item.is_active === targetStatus);
                    }

                    // 排序
                    if (params?.sort_column && params?.sort_direction) {
                        filteredData.sort((a, b) => {
                            const aValue = (a as any)[params.sort_column!];
                            const bValue = (b as any)[params.sort_column!];

                            if (aValue === undefined || bValue === undefined) return 0;

                            let comparison = 0;
                            if (aValue < bValue) comparison = -1;
                            else if (aValue > bValue) comparison = 1;

                            return params.sort_direction === 'desc' ? -comparison : comparison;
                        });
                    }

                    // 分頁
                    const page = params?.page_index || 0;
                    const pageSize = params?.page_size || 10;
                    const startIndex = page * pageSize;
                    const endIndex = startIndex + pageSize;
                    const paginatedData = filteredData.slice(startIndex, endIndex);

                    const totalRecords = filteredData.length;
                    const totalPages = Math.ceil(totalRecords / pageSize);
                    
                    const result: JobRoleListResponse = {
                        code: 200,
                        message: '查詢成功',
                        data: {
                            data_list: paginatedData,
                            total_records: totalRecords,
                            first_index_in_page: startIndex + 1,
                            last_index_in_page: Math.min(endIndex, totalRecords),
                            pageable: true,
                            sort_column: params?.sort_column,
                            sort_direction: params?.sort_direction,
                            // 額外資訊
                            totalPages,
                            page,
                            size: pageSize,
                            hasNext: page < totalPages - 1,
                            hasPrevious: page > 0
                        }
                    };

                    return result;
                } else {
                    // 處理錯誤回應
                    throw new Error(response.message || '查詢失敗');
                }
            })
        );
    }

    /**
     * Mock 資料查詢實現
     */
    private getMockJobRoles(params?: JobRoleSearchParams): Observable<JobRoleListResponse> {
        let filteredData = [...this.mockJobRoles];

        // 搜尋篩選
        if (params?.keyword) {
            const keyword = params.keyword.toLowerCase();
            filteredData = filteredData.filter(item =>
                item.job_role_code.toLowerCase().includes(keyword) ||
                item.job_role_name.toLowerCase().includes(keyword) ||
                (item.description && item.description.toLowerCase().includes(keyword))
            );
        }

        // 狀態篩選
        if (params?.is_active !== undefined) {
            let targetStatus: boolean;
            if (typeof params.is_active === 'string') {
                targetStatus = params.is_active === 'true';
            } else {
                targetStatus = params.is_active;
            }
            filteredData = filteredData.filter(item => item.is_active === targetStatus);
        }

        // 排序
        if (params?.sort_column && params?.sort_direction) {
            filteredData.sort((a, b) => {
                const aValue = (a as any)[params.sort_column!];
                const bValue = (b as any)[params.sort_column!];

                if (aValue === undefined || bValue === undefined) return 0;

                let comparison = 0;
                if (aValue < bValue) comparison = -1;
                else if (aValue > bValue) comparison = 1;

                return params.sort_direction === 'desc' ? -comparison : comparison;
            });
        }

        // 分頁
        const page = params?.page_index || 0;
        const pageSize = params?.page_size || 10;
        const startIndex = page * pageSize;
        const endIndex = startIndex + pageSize;
        const paginatedData = filteredData.slice(startIndex, endIndex);

        const totalRecords = filteredData.length;
        const totalPages = Math.ceil(totalRecords / pageSize);
        
        const result: JobRoleListResponse = {
            code: 200,
            message: '查詢成功',
            data: {
                data_list: paginatedData,
                total_records: totalRecords,
                first_index_in_page: startIndex + 1,
                last_index_in_page: Math.min(endIndex, totalRecords),
                pageable: true,
                sort_column: params?.sort_column,
                sort_direction: params?.sort_direction,
                // 額外資訊
                totalPages,
                page,
                size: pageSize,
                hasNext: page < totalPages - 1,
                hasPrevious: page > 0
            }
        };

        return of(result).pipe(delay(300));
    }

    /**
     * 查詢所有啟用的職務列表
     */
    getActiveJobRoles(): Observable<ApiResponse<JobRole[]>> {
        if (this.useMockData) {
            const activeJobRoles = this.mockJobRoles.filter(c => c.is_active);
            return of({
                code: 200,
                message: '查詢成功',
                data: activeJobRoles
            }).pipe(delay(300));
        }

        return this.http.get<ApiResponse<JobRole[]>>(`${this.apiUrl}/active`);
    }

    /**
     * 根據 ID 獲取職務
     */
    getJobRoleById(id: number): Observable<ApiResponse<JobRole>> {
        if (this.useMockData) {
            const jobRole = this.mockJobRoles.find(c => c.job_role_id === id);
            if (jobRole) {
                return of({
                    code: 200,
                    message: '查詢成功',
                    data: jobRole
                }).pipe(delay(300));
            } else {
                return of({
                    code: 404,
                    message: '職務不存在',
                    data: null as any
                }).pipe(delay(300));
            }
        }

        return this.http.get<ApiResponse<JobRole>>(`${this.apiUrl}/find/${id}`);
    }

    /**
     * 根據職務代碼查詢職務詳情
     */
    getJobRoleByCode(jobRoleCode: string): Observable<ApiResponse<JobRole>> {
        if (this.useMockData) {
            const jobRole = this.mockJobRoles.find(c => c.job_role_code === jobRoleCode);
            if (jobRole) {
                return of({
                    code: 200,
                    message: '查詢成功',
                    data: jobRole
                }).pipe(delay(300));
            } else {
                return of({
                    code: 404,
                    message: '職務不存在',
                    data: null as any
                }).pipe(delay(300));
            }
        }

        return this.http.get<ApiResponse<JobRole>>(`${this.apiUrl}/code/${jobRoleCode}`);
    }

    /**
     * 創建職務
     */
    createJobRole(dto: JobRoleCreateDto, createUser: string = 'system'): Observable<ApiResponse<JobRole>> {
        if (this.useMockData) {
            // 檢查代碼是否已存在
            const exists = this.mockJobRoles.some(c => c.job_role_code === dto.job_role_code);
            if (exists) {
                return of({
                    code: 400,
                    message: '職務代碼已存在',
                    data: null as any
                }).pipe(delay(300));
            }

            const newJobRole: JobRole = {
                job_role_id: this.mockJobRoles.length + 1,
                job_role_code: dto.job_role_code,
                job_role_name: dto.job_role_name,
                description: dto.description,
                is_active: dto.is_active ?? true,
                create_time: new Date().toISOString(),
                create_user: createUser,
                update_time: new Date().toISOString(),
                update_user: createUser
            };

            this.mockJobRoles.push(newJobRole);
            
            return of({
                code: 200,
                message: '創建成功',
                data: newJobRole
            }).pipe(delay(300));
        }

        // 真實 API 呼叫 - 使用 POST /create 端點
        const requestBody = {
            ...dto,
            create_user: createUser
        };

        return this.http.post<ApiResponse<JobRole>>(`${this.apiUrl}/create`, requestBody);
    }

    /**
     * 更新職務
     */
    updateJobRole(dto: JobRoleUpdateDto, updateUser: string = 'system'): Observable<ApiResponse<JobRole>> {
        if (this.useMockData) {
            const index = this.mockJobRoles.findIndex(c => c.job_role_id === dto.job_role_id);
            if (index === -1) {
                return of({
                    code: 404,
                    message: '職務不存在',
                    data: null as any
                }).pipe(delay(300));
            }

            const updatedJobRole: JobRole = {
                ...this.mockJobRoles[index],
                job_role_code: dto.job_role_code,
                job_role_name: dto.job_role_name,
                description: dto.description,
                is_active: dto.is_active ?? this.mockJobRoles[index].is_active,
                update_time: new Date().toISOString(),
                update_user: updateUser
            };

            this.mockJobRoles[index] = updatedJobRole;
            
            return of({
                code: 200,
                message: '更新成功',
                data: updatedJobRole
            }).pipe(delay(300));
        }

        // 真實 API 呼叫 - 使用 POST /update 端點
        const requestBody = {
            ...dto,
            update_user: updateUser
        };

        return this.http.post<ApiResponse<JobRole>>(`${this.apiUrl}/update`, requestBody);
    }

    /**
     * 刪除職務
     */
    deleteJobRole(jobRoleId: number): Observable<ApiResponse<void>> {
        if (this.useMockData) {
            const index = this.mockJobRoles.findIndex(c => c.job_role_id === jobRoleId);
            if (index === -1) {
                return of({
                    code: 404,
                    message: '職務不存在',
                    data: null as any
                }).pipe(delay(300));
            }

            this.mockJobRoles.splice(index, 1);
            
            return of({
                code: 200,
                message: '刪除成功',
                data: null as any
            }).pipe(delay(300));
        }

        // 真實 API 呼叫 - 使用 POST /delete 端點
        const requestBody = {
            job_role_id: jobRoleId
        };

        return this.http.post<ApiResponse<void>>(`${this.apiUrl}/delete`, requestBody);
    }

    /**
     * 批量更新職務狀態 (簡化版本)
     */
    batchUpdateJobRoleStatus(jobRoleCodes: string[], isActive: boolean): Observable<ApiResponse<number>> {
        if (this.useMockData) {
            let updatedCount = 0;
            this.mockJobRoles.forEach(jobRole => {
                if (jobRoleCodes.includes(jobRole.job_role_code)) {
                    jobRole.is_active = isActive;
                    jobRole.update_time = new Date().toISOString();
                    updatedCount++;
                }
            });
            
            return of({
                code: 200,
                message: '批量更新成功',
                data: updatedCount
            }).pipe(delay(300));
        }

        const requestBody = {
            job_role_codes: jobRoleCodes,
            is_active: isActive
        };

        return this.http.post<ApiResponse<number>>(`${this.apiUrl}/batch-status`, requestBody);
    }

    /**
     * 批量刪除職務 (簡化版本)
     */
    bulkDeleteJobRoles(jobRoleCodes: string[]): Observable<ApiResponse<number>> {
        if (this.useMockData) {
            let deletedCount = 0;
            jobRoleCodes.forEach(code => {
                const index = this.mockJobRoles.findIndex(c => c.job_role_code === code);
                if (index !== -1) {
                    this.mockJobRoles.splice(index, 1);
                    deletedCount++;
                }
            });
            
            return of({
                code: 200,
                message: '批量刪除成功',
                data: deletedCount
            }).pipe(delay(300));
        }

        const requestBody = {
            job_role_codes: jobRoleCodes
        };

        return this.http.post<ApiResponse<number>>(`${this.apiUrl}/batch-delete`, requestBody);
    }
}
