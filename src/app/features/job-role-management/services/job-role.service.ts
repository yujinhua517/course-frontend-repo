import { Injectable, signal, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, delay, map, catchError } from 'rxjs';
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

        // 前端適配後端的 PageBean 分頁格式
        // 將前端的 page_index(0-based) 和 page_size 轉換為後端的 first_index_in_page 和 last_index_in_page
        const page = (params?.page_index || 0) + 1; // 後端頁碼從 1 開始
        const pageSize = params?.page_size || 10;
        
        // 計算後端 PageBean 需要的索引 (1-based)
        const firstIndex = (page - 1) * pageSize + 1; // 第一筆資料的索引
        const lastIndex = page * pageSize; // 最後一筆資料的索引

        const requestParams = {
            // 後端 PageBean 的分頁參數
            first_index_in_page: firstIndex,
            last_index_in_page: lastIndex,
            pageable: true,
            
            // 排序參數
            sort_column: params?.sort_column || 'job_role_code',
            sort_direction: params?.sort_direction || 'ASC',
            
            // 搜尋條件
            ...(params?.keyword && { keyword: params.keyword }),
            ...(params?.is_active !== undefined && { is_active: params.is_active }),
            ...(params?.job_role_id && { job_role_id: params.job_role_id }),
            ...(params?.job_role_code && { job_role_code: params.job_role_code }),
            ...(params?.job_role_name && { job_role_name: params.job_role_name }),
            ...(params?.description && { description: params.description })
        };

        console.log(`前端分頁參數轉換: page_index=${params?.page_index}, page_size=${pageSize} -> first_index=${firstIndex}, last_index=${lastIndex}`);
        console.log('發送到後端的參數:', requestParams);

        return this.http.post<ApiResponse<PagerDto<JobRole>>>(`${this.apiUrl}/query`, requestParams)
            .pipe(
                map(response => {
                    console.log('後端回應:', response);
                    if (response.code === 1000) {
                        // 後端回傳的資料可能分頁資訊不正確，前端重新計算
                        const backendData = response.data;
                        const actualDataCount = backendData.data_list?.length || 0;
                        
                        // 重新計算正確的分頁資訊
                        const adaptedData: PagerDto<JobRole> = {
                            data_list: backendData.data_list,
                            total_records: backendData.total_records,
                            // 使用前端計算的正確分頁資訊
                            first_index_in_page: firstIndex,
                            last_index_in_page: Math.min(lastIndex, backendData.total_records),
                            pageable: backendData.pageable,
                            sort_column: backendData.sort_column,
                            sort_direction: backendData.sort_direction,
                            // 額外的分頁資訊
                            totalPages: Math.ceil(backendData.total_records / pageSize),
                            page: params?.page_index || 0,
                            size: pageSize,
                            hasNext: (params?.page_index || 0) < Math.ceil(backendData.total_records / pageSize) - 1,
                            hasPrevious: (params?.page_index || 0) > 0
                        };
                        
                        console.log(`前端修正分頁資訊: 請求範圍=${firstIndex}-${lastIndex}, 實際回傳=${actualDataCount}筆, 總計=${backendData.total_records}筆`);
                        
                        const result: JobRoleListResponse = {
                            code: 200,
                            message: '查詢成功',
                            data: adaptedData
                        };
                        
                        return result;
                    } else {
                        throw new Error(response.message || '查詢失敗');
                    }
                }),
                catchError(error => {
                    console.error('API 查詢失敗，使用 Mock 資料:', error);
                    return this.getMockJobRoles(params);
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
