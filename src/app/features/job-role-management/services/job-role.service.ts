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
import { ApiResponseTransformer } from '../../../core/utils/object-case.util';
import { HttpErrorHandlerService } from '../../../core/services/http-error-handler.service';

@Injectable({
    providedIn: 'root'
})
export class JobRoleService {
    private http = inject(HttpClient);
    private httpErrorHandler = inject(HttpErrorHandlerService);
    private readonly useMockData = false; // 臨時使用 Mock 資料來檢查前端邏輯
    private apiUrl = `${environment.apiBaseUrl}/job-roles`;

    // Signals
    isLoading = signal<boolean>(false);
    error = signal<string | null>(null);

    // Mock 資料 (使用 camelCase)
    private mockJobRoles: JobRole[] = [
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

    /**
     * 將前端排序欄位映射為後端欄位名稱
     */
    private mapSortColumnToBackend(frontendColumn?: string): string {
        const columnMap: Record<string, string> = {
            'jobRoleId': 'job_role_id',
            'jobRoleCode': 'job_role_code',
            'jobRoleName': 'job_role_name',
            'description': 'description',
            'isActive': 'is_active',
            'createTime': 'create_time',
            'updateTime': 'update_time'
        };
        
        return columnMap[frontendColumn || ''] || 'job_role_code';
    }

    /**
     * 分頁查詢職務列表
     */
    getJobRoles(params?: JobRoleSearchParams): Observable<JobRoleListResponse> {
        if (this.useMockData) {
            return this.getMockJobRoles(params);
        }

        // 前端適配後端的 PageBean 分頁格式
        // 將前端的 pageIndex(0-based) 和 pageSize 轉換為後端的 firstIndexInPage 和 lastIndexInPage
        const page = (params?.pageIndex || 0) + 1; // 後端頁碼從 1 開始
        const pageSize = params?.pageSize || 10;
        
        // 計算後端 PageBean 需要的索引 (1-based)
        const firstIndex = (page - 1) * pageSize + 1; // 第一筆資料的索引
        const lastIndex = page * pageSize; // 最後一筆資料的索引

        const requestParams = {
            // 後端 PageBean 的分頁參數 (前端 camelCase，攔截器會自動轉換)
            firstIndexInPage: firstIndex,
            lastIndexInPage: lastIndex,
            pageable: true,
            
            // 排序參數 (使用 camelCase，攔截器會轉換為 snake_case)
            // 注意：sortColumn 的值需要對應後端的欄位名稱
            sortColumn: this.mapSortColumnToBackend(params?.sortColumn) || 'job_role_code',
            sortDirection: params?.sortDirection || 'asc',
            
            // 搜尋條件
            ...(params?.keyword && { keyword: params.keyword }),
            ...(params?.isActive !== undefined && { isActive: params.isActive }),
            ...(params?.jobRoleId && { jobRoleId: params.jobRoleId }),
            ...(params?.jobRoleCode && { jobRoleCode: params.jobRoleCode }),
            ...(params?.jobRoleName && { jobRoleName: params.jobRoleName }),
            ...(params?.description && { description: params.description })
        };

        console.log(`前端分頁參數轉換: pageIndex=${params?.pageIndex}, pageSize=${pageSize} -> firstIndex=${firstIndex}, lastIndex=${lastIndex}`);
        console.log('發送參數 (camelCase，攔截器會自動轉換):', requestParams);

        return this.http.post<ApiResponse<PagerDto<JobRole>>>(`${this.apiUrl}/query`, requestParams)
            .pipe(
                map(response => {
                    console.log('後端回應 (已由攔截器轉換為 camelCase):', response);
                    
                    if (response.code === 1000) {
                        // 後端回傳的資料可能分頁資訊不正確，前端重新計算
                        const backendData = response.data;
                        const actualDataCount = backendData.dataList?.length || 0;
                        
                        // 重新計算正確的分頁資訊
                        const adaptedData: PagerDto<JobRole> = {
                            dataList: backendData.dataList,
                            totalRecords: backendData.totalRecords,
                            // 使用前端計算的正確分頁資訊
                            firstIndexInPage: firstIndex,
                            lastIndexInPage: Math.min(lastIndex, backendData.totalRecords),
                            pageable: backendData.pageable,
                            sortColumn: backendData.sortColumn,
                            sortDirection: backendData.sortDirection,
                            // 額外的分頁資訊
                            totalPages: Math.ceil(backendData.totalRecords / pageSize),
                            page: params?.pageIndex || 0,
                            size: pageSize,
                            hasNext: (params?.pageIndex || 0) < Math.ceil(backendData.totalRecords / pageSize) - 1,
                            hasPrevious: (params?.pageIndex || 0) > 0
                        };
                        
                        console.log(`前端修正分頁資訊: 請求範圍=${firstIndex}-${lastIndex}, 實際回傳=${actualDataCount}筆, 總計=${backendData.totalRecords}筆`);
                        
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
                    console.error('Error occurred:', error);
                    return of({
                        code: 500,
                        message: '發生錯誤，請稍後再試。',
                        data: {
                            dataList: [],
                            totalRecords: 0,
                            firstIndexInPage: 0,
                            lastIndexInPage: 0,
                            pageable: true
                        }
                    } as JobRoleListResponse);
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
                item.jobRoleCode.toLowerCase().includes(keyword) ||
                item.jobRoleName.toLowerCase().includes(keyword) ||
                (item.description && item.description.toLowerCase().includes(keyword))
            );
        }

        // 狀態篩選
        if (params?.isActive !== undefined) {
            let targetStatus: boolean;
            if (typeof params.isActive === 'string') {
                targetStatus = params.isActive === 'true';
            } else {
                targetStatus = params.isActive;
            }
            filteredData = filteredData.filter(item => item.isActive === targetStatus);
        }

        // 排序
        if (params?.sortColumn && params?.sortDirection) {
            filteredData.sort((a, b) => {
                const aValue = (a as any)[params.sortColumn!];
                const bValue = (b as any)[params.sortColumn!];

                if (aValue === undefined || bValue === undefined) return 0;

                let comparison = 0;
                if (aValue < bValue) comparison = -1;
                else if (aValue > bValue) comparison = 1;

                return params.sortDirection === 'desc' ? -comparison : comparison;
            });
        }

        // 分頁
        const page = params?.pageIndex || 0;
        const pageSize = params?.pageSize || 10;
        const startIndex = page * pageSize;
        const endIndex = startIndex + pageSize;
        const paginatedData = filteredData.slice(startIndex, endIndex);

        const totalRecords = filteredData.length;
        const totalPages = Math.ceil(totalRecords / pageSize);
        
        const result: JobRoleListResponse = {
            code: 200,
            message: '查詢成功',
            data: {
                dataList: paginatedData,
                totalRecords: totalRecords,
                firstIndexInPage: startIndex + 1,
                lastIndexInPage: Math.min(endIndex, totalRecords),
                pageable: true,
                sortColumn: params?.sortColumn,
                sortDirection: params?.sortDirection,
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
            const activeJobRoles = this.mockJobRoles.filter(c => c.isActive);
            return of({
                code: 200,
                message: '查詢成功',
                data: activeJobRoles
            }).pipe(delay(300));
        }

        return this.http.get<ApiResponse<JobRole[]>>(`${this.apiUrl}/active`)
            .pipe(
                map(response => ApiResponseTransformer.transformResponse<ApiResponse<JobRole[]>>(response)),
                catchError(this.httpErrorHandler.handleError('getActiveJobRoles'))
            );
    }

    /**
     * 根據 ID 獲取職務
     */
    getJobRoleById(id: number): Observable<ApiResponse<JobRole>> {
        if (this.useMockData) {
            const jobRole = this.mockJobRoles.find(c => c.jobRoleId === id);
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

        return this.http.get<ApiResponse<JobRole>>(`${this.apiUrl}/find/${id}`)
            .pipe(
                map(response => ApiResponseTransformer.transformResponse<ApiResponse<JobRole>>(response)),
                catchError(this.httpErrorHandler.handleError('getJobRoleById'))
            );
    }

    /**
     * 根據職務代碼查詢職務詳情
     */
    getJobRoleByCode(jobRoleCode: string): Observable<ApiResponse<JobRole>> {
        if (this.useMockData) {
            const jobRole = this.mockJobRoles.find(c => c.jobRoleCode === jobRoleCode);
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
            const exists = this.mockJobRoles.some(c => c.jobRoleCode === dto.jobRoleCode);
            if (exists) {
                return of({
                    code: 400,
                    message: '職務代碼已存在',
                    data: null as any
                }).pipe(delay(300));
            }

            const newJobRole: JobRole = {
                jobRoleId: this.mockJobRoles.length + 1,
                jobRoleCode: dto.jobRoleCode,
                jobRoleName: dto.jobRoleName,
                description: dto.description,
                isActive: dto.isActive ?? true,
                createTime: new Date().toISOString(),
                createUser: createUser,
                updateTime: new Date().toISOString(),
                updateUser: createUser
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
            const index = this.mockJobRoles.findIndex(c => c.jobRoleId === dto.jobRoleId);
            if (index === -1) {
                return of({
                    code: 404,
                    message: '職務不存在',
                    data: null as any
                }).pipe(delay(300));
            }

            const updatedJobRole: JobRole = {
                ...this.mockJobRoles[index],
                jobRoleCode: dto.jobRoleCode,
                jobRoleName: dto.jobRoleName,
                description: dto.description,
                isActive: dto.isActive ?? this.mockJobRoles[index].isActive,
                updateTime: new Date().toISOString(),
                updateUser: updateUser
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
            const index = this.mockJobRoles.findIndex(c => c.jobRoleId === jobRoleId);
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
                if (jobRoleCodes.includes(jobRole.jobRoleCode)) {
                    jobRole.isActive = isActive;
                    jobRole.updateTime = new Date().toISOString();
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
                const index = this.mockJobRoles.findIndex(c => c.jobRoleCode === code);
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
