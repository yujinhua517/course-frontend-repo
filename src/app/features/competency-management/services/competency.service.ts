import { Injectable, signal } from '@angular/core';
import { Observable, of, delay, map } from 'rxjs';
import {
    Competency,
    CompetencyCreateDto,
    CompetencyUpdateDto,
    CompetencySearchParams,
    ApiResponse,
    PagerDto,
    CompetencyListResponse
} from '../models/competency.model';

@Injectable({
    providedIn: 'root'
})
export class CompetencyService {
    private useMockData = true; // 設為 false 時切換至真實 API

    // Mock 資料
    private mockCompetencies: Competency[] = [
        {
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
            job_role_code: 'PM001',
            job_role_name: '專案經理',
            description: '負責專案規劃、執行與管理',
            is_active: true,
            create_time: '2024-01-04T09:00:00',
            create_user: 'admin',
            update_time: '2024-01-04T09:00:00',
            update_user: 'admin'
        },
        {
            job_role_code: 'UI001',
            job_role_name: 'UI/UX 設計師',
            description: '負責使用者介面與體驗設計',
            is_active: false,
            create_time: '2024-01-05T09:00:00',
            create_user: 'admin',
            update_time: '2024-01-05T09:00:00',
            update_user: 'admin'
        },
        {
            job_role_code: 'QA001',
            job_role_name: '測試工程師',
            description: '負責軟體測試與品質保證',
            is_active: true,
            create_time: '2024-01-06T09:00:00',
            create_user: 'admin',
            update_time: '2024-01-06T09:00:00',
            update_user: 'admin'
        },
        {
            job_role_code: 'OPS001',
            job_role_name: '運維工程師',
            description: '負責系統運維與自動化部署',
            is_active: true,
            create_time: '2024-01-07T09:00:00',
            create_user: 'admin',
            update_time: '2024-01-07T09:00:00',
            update_user: 'admin'
        },
        {
            job_role_code: 'SA001',
            job_role_name: '系統分析師',
            description: '進行系統需求分析與規格設計',
            is_active: true,
            create_time: '2024-01-08T09:00:00',
            create_user: 'admin',
            update_time: '2024-01-08T09:00:00',
            update_user: 'admin'
        },
        {
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
            job_role_code: 'SEC001',
            job_role_name: '資安工程師',
            description: '負責資訊安全與風險評估',
            is_active: true,
            create_time: '2024-01-10T09:00:00',
            create_user: 'admin',
            update_time: '2024-01-10T09:00:00',
            update_user: 'admin'
        },
        {
            job_role_code: 'DS001',
            job_role_name: '資料科學家',
            description: '進行數據分析與建模',
            is_active: false,
            create_time: '2024-01-11T09:00:00',
            create_user: 'admin',
            update_time: '2024-01-11T09:00:00',
            update_user: 'admin'
        },
        {
            job_role_code: 'ML001',
            job_role_name: '機器學習工程師',
            description: '建構與部署機器學習模型',
            is_active: true,
            create_time: '2024-01-12T09:00:00',
            create_user: 'admin',
            update_time: '2024-01-12T09:00:00',
            update_user: 'admin'
        },
        {
            job_role_code: 'BI001',
            job_role_name: '商業智慧分析師',
            description: '負責商業數據分析與報表',
            is_active: true,
            create_time: '2024-01-13T09:00:00',
            create_user: 'admin',
            update_time: '2024-01-13T09:00:00',
            update_user: 'admin'
        },
        {
            job_role_code: 'PO001',
            job_role_name: '產品負責人',
            description: '產品規劃與發展管理',
            is_active: true,
            create_time: '2024-01-14T09:00:00',
            create_user: 'admin',
            update_time: '2024-01-14T09:00:00',
            update_user: 'admin'
        },
        {
            job_role_code: 'SCRUM001',
            job_role_name: '敏捷教練',
            description: '推動敏捷開發流程與文化',
            is_active: false,
            create_time: '2024-01-15T09:00:00',
            create_user: 'admin',
            update_time: '2024-01-15T09:00:00',
            update_user: 'admin'
        },
        {
            job_role_code: 'IT001',
            job_role_name: 'IT 支援工程師',
            description: '提供內外部 IT 支援服務',
            is_active: true,
            create_time: '2024-01-16T09:00:00',
            create_user: 'admin',
            update_time: '2024-01-16T09:00:00',
            update_user: 'admin'
        },
        {
            job_role_code: 'NET001',
            job_role_name: '網路工程師',
            description: '網路架構規劃與維護',
            is_active: true,
            create_time: '2024-01-17T09:00:00',
            create_user: 'admin',
            update_time: '2024-01-17T09:00:00',
            update_user: 'admin'
        },
        {
            job_role_code: 'DEVOPS001',
            job_role_name: 'DevOps 工程師',
            description: '負責 CI/CD 及跨部門協作',
            is_active: false,
            create_time: '2024-01-18T09:00:00',
            create_user: 'admin',
            update_time: '2024-01-18T09:00:00',
            update_user: 'admin'
        },
        {
            job_role_code: 'SUP001',
            job_role_name: '技術支援專員',
            description: '處理客戶技術問題',
            is_active: true,
            create_time: '2024-01-19T09:00:00',
            create_user: 'admin',
            update_time: '2024-01-19T09:00:00',
            update_user: 'admin'
        },
        {
            job_role_code: 'CS001',
            job_role_name: '客服專員',
            description: '提供顧客服務與協助',
            is_active: true,
            create_time: '2024-01-20T09:00:00',
            create_user: 'admin',
            update_time: '2024-01-20T09:00:00',
            update_user: 'admin'
        }
    ];

    // Signals for state management
    competencies = signal<Competency[]>([]);
    loading = signal<boolean>(false);
    error = signal<string | null>(null);

    getCompetencies(params?: CompetencySearchParams): Observable<CompetencyListResponse> {
        if (this.useMockData) {
            return this.getMockCompetencies(params);
        }

        // TODO: 實際 API 呼叫
        //return this.http.get<CompetencyListResponse>('/api/competencies', { params });
        return this.getMockCompetencies(params);
    }

    private getMockCompetencies(params?: CompetencySearchParams): Observable<CompetencyListResponse> {
        //console.log('🔍 getMockCompetencies called with params:', params);
        let filteredData = [...this.mockCompetencies];
        //console.log('📊 Initial data count:', filteredData.length);

        // 搜尋篩選
        if (params?.keyword) {
            const keyword = params.keyword.toLowerCase();
            filteredData = filteredData.filter(item =>
                item.job_role_code.toLowerCase().includes(keyword) ||
                item.job_role_name.toLowerCase().includes(keyword) ||
                (item.description && item.description.toLowerCase().includes(keyword))
            );
            //console.log('🔎 After keyword filter:', filteredData.length);
        }

        // 狀態篩選
        if (params?.is_active !== undefined) {
            //console.log('⚡ Filtering by is_active:', params.is_active, 'type:', typeof params.is_active);
            // 確保比較時類型一致，處理字串和布林值
            let targetStatus: boolean;
            if (typeof params.is_active === 'string') {
                targetStatus = params.is_active === 'true';
            } else {
                targetStatus = params.is_active;
            }
            filteredData = filteredData.filter(item => item.is_active === targetStatus);
            //console.log('✅ After status filter:', filteredData.length);
        }

        // 排序
        if (params?.sortBy) {
            filteredData.sort((a, b) => {
                const aValue = (a as any)[params.sortBy!];
                const bValue = (b as any)[params.sortBy!];

                if (aValue === undefined || bValue === undefined) return 0;

                let comparison = 0;
                if (aValue > bValue) comparison = 1;
                if (aValue < bValue) comparison = -1;

                return params.sort_direction === 'desc' ? -comparison : comparison;
            });
        }

        // 分頁
        const page = params?.page || 1;
        const pageSize = params?.pageSize || 10;
        const startIndex = (page - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        const paginatedData = filteredData.slice(startIndex, endIndex);

        const response: CompetencyListResponse = {
            code: 200,
            message: 'success',
            data: {
                data_list: paginatedData,
                total_records: filteredData.length,
                first_index_in_page: startIndex,
                last_index_in_page: endIndex - 1,
                pageable: true,
                sort_column: params?.sort_column,
                sort_direction: params?.sort_direction
            }
        };

        return of(response).pipe(delay(300)); // 模擬網路延遲
    }

    getCompetencyByCode(code: string): Observable<Competency | null> {
        if (this.useMockData) {
            const competency = this.mockCompetencies.find(c => c.job_role_code === code);
            return of(competency || null).pipe(delay(200));
        }

        // TODO: 實際 API 呼叫
        // return this.http.get<Competency>(`/api/competencies/${code}`);
        return of(null);
    }

    createCompetency(competency: CompetencyCreateDto): Observable<Competency> {
        if (this.useMockData) {
            const now = new Date().toISOString();
            const newCompetency: Competency = {
                ...competency,
                create_time: now,
                create_user: 'current_user', // 實際專案中應從認證服務取得
                update_time: now,
                update_user: 'current_user'
            };

            this.mockCompetencies.push(newCompetency);
            return of(newCompetency).pipe(delay(300));
        }

        // TODO: 實際 API 呼叫
        // return this.http.post<Competency>('/api/competencies', competency);
        return of({} as Competency);
    }

    updateCompetency(code: string, competency: CompetencyUpdateDto): Observable<Competency> {
        if (this.useMockData) {
            const index = this.mockCompetencies.findIndex(c => c.job_role_code === code);
            if (index !== -1) {
                const updatedCompetency: Competency = {
                    ...this.mockCompetencies[index],
                    ...competency,
                    update_time: new Date().toISOString(),
                    update_user: 'current_user'
                };

                this.mockCompetencies[index] = updatedCompetency;
                return of(updatedCompetency).pipe(delay(300));
            }
        }

        // TODO: 實際 API 呼叫
        // return this.http.put<Competency>(`/api/competencies/${code}`, competency);
        return of({} as Competency);
    }

    deleteCompetency(code: string): Observable<boolean> {
        if (this.useMockData) {
            const index = this.mockCompetencies.findIndex(c => c.job_role_code === code);
            if (index !== -1) {
                this.mockCompetencies.splice(index, 1);
                return of(true).pipe(delay(300));
            }
            return of(false);
        }

        // TODO: 實際 API 呼叫
        // return this.http.delete<void>(`/api/competencies/${code}`).pipe(map(() => true));
        return of(false);
    }

    toggleActiveStatus(code: string): Observable<Competency | null> {
        if (this.useMockData) {
            const index = this.mockCompetencies.findIndex(c => c.job_role_code === code);
            if (index !== -1) {
                this.mockCompetencies[index].is_active = !this.mockCompetencies[index].is_active;
                this.mockCompetencies[index].update_time = new Date().toISOString();
                this.mockCompetencies[index].update_user = 'current_user';

                return of(this.mockCompetencies[index]).pipe(delay(300));
            }
        }

        // TODO: 實際 API 呼叫
        // return this.http.patch<Competency>(`/api/competencies/${code}/toggle-status`, {});
        return of(null);
    }

    /**
     * 批量刪除職能
     * @param codes 職能代碼陣列
     * @returns Observable<boolean>
     */
    bulkDeleteCompetencies(codes: string[]): Observable<boolean> {
        if (this.useMockData) {
            // 從 mock 資料中移除
            codes.forEach(code => {
                const index = this.mockCompetencies.findIndex(c => c.job_role_code === code);
                if (index !== -1) {
                    this.mockCompetencies.splice(index, 1);
                }
            });

            return of(true).pipe(delay(800)); // 模擬網路延遲
        }

        // TODO: 實際 API 呼叫
        // return this.http.delete<void>('/api/competencies/bulk', { body: { codes } }).pipe(map(() => true));
        return of(true);
    }
}
