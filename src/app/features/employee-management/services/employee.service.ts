import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, delay } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import {
    Employee,
    EmployeeCreateDto,
    EmployeeUpdateDto,
    EmployeeSearchParams,
    ApiResponse,
    PagerDto
} from '../models/employee.model';

@Injectable({
    providedIn: 'root'
})
export class EmployeeService {
    private http = inject(HttpClient);
    private readonly apiUrl = `${environment.apiBaseUrl}/employees`;

    // Toggle between mock data and real API
    private readonly useMockData = false;
    static employeeService: any;

    /**
     * 查詢員工列表
     * @param params 搜尋參數
     * @returns 員工列表分頁結果
     */
    getEmployees(params?: EmployeeSearchParams): Observable<PagerDto<Employee>> {
        if (this.useMockData) {
            let all = this.getMockEmployeeList().data_list;

            // console.log('原始員工數據數量:', all.length);
            // console.log('搜尋參數:', params);

            // 根據搜尋參數過濾
            if (params?.dept_id !== undefined) {
                all = all.filter(e => e.dept_id === params.dept_id);
                //console.log('按部門過濾後數量:', all.length);
            }

            if (params?.is_active !== undefined) {
                //console.log('按狀態過濾，目標狀態:', params.is_active, '類型:', typeof params.is_active);

                // 確保比較時類型一致
                const targetStatus = Boolean(params.is_active);
                all = all.filter(e => {
                    const employeeStatus = Boolean(e.is_active);
                    //console.log(`員工 ${e.emp_name} 狀態: ${employeeStatus}, 目標: ${targetStatus}, 匹配: ${employeeStatus === targetStatus}`);
                    return employeeStatus === targetStatus;
                });
                //console.log('按狀態過濾後數量:', all.length);
            }

            if (params?.emp_name) {
                all = all.filter(e => e.emp_name.includes(params.emp_name as string));
                //console.log('按姓名過濾後數量:', all.length);
            }

            // 通用關鍵字搜尋 (搜尋員工姓名、工號、電子郵件)
            if (params?.keyword) {
                const keyword = params.keyword.toLowerCase();
                all = all.filter(e => 
                    e.emp_name.toLowerCase().includes(keyword) ||
                    e.emp_code.toLowerCase().includes(keyword) ||
                    (e.emp_email && e.emp_email.toLowerCase().includes(keyword))
                );
                //console.log('按關鍵字過濾後數量:', all.length);
            }
            // 其他欄位可依需求補充

            // 排序
            if (params?.sort_column && params?.sort_direction) {
                all.sort((a, b) => {
                    const aValue = (a as any)[params.sort_column!];
                    const bValue = (b as any)[params.sort_column!];

                    if (aValue === undefined || bValue === undefined) return 0;

                    let comparison = 0;
                    if (aValue < bValue) comparison = -1;
                    else if (aValue > bValue) comparison = 1;

                    return params.sort_direction === 'DESC' ? -comparison : comparison;
                });
                //console.log('按排序條件排序:', params.sort_column, params.sort_direction);
            }

            // 分頁
            const page = params?.page ?? 1;
            const pageSize = params?.pageSize ?? 10;
            const start = (page - 1) * pageSize;
            const end = start + pageSize;
            const paged = all.slice(start, end);

            //console.log('最終返回數據數量:', paged.length);

            return of({
                data_list: paged,
                total_records: all.length,
                first_index_in_page: start + 1,
                last_index_in_page: Math.min(end, all.length),
                pageable: true,
                sort_column: params?.sort_column ?? 'emp_code',
                sort_direction: params?.sort_direction ?? 'ASC'
            }).pipe(delay(300)); // 添加 300ms 延遲以模擬網路請求
        }

        // 前端適配後端的 PageBean 分頁格式
        // 將前端的 page(1-based) 和 pageSize 轉換為後端的 first_index_in_page 和 last_index_in_page
        const page = params?.page || 1; // 前端頁碼從 1 開始
        const pageSize = params?.pageSize || 10;
        
        // 計算後端 PageBean 需要的索引 (1-based)
        const firstIndex = (page - 1) * pageSize + 1; // 第一筆資料的索引
        const lastIndex = page * pageSize; // 最後一筆資料的索引

        const requestParams = {
            // 後端 PageBean 的分頁參數
            first_index_in_page: firstIndex,
            last_index_in_page: lastIndex,
            pageable: true,
            
            // 排序參數
            sort_column: params?.sort_column || 'emp_code',
            sort_direction: params?.sort_direction || 'ASC',
            
            // 搜尋條件
            ...(params?.keyword && { keyword: params.keyword }),
            ...(params?.is_active !== undefined && { is_active: params.is_active }),
            ...(params?.dept_id && { dept_id: params.dept_id }),
            ...(params?.emp_name && { emp_name: params.emp_name }),
            ...(params?.emp_code && { emp_code: params.emp_code }),
            ...(params?.emp_email && { emp_email: params.emp_email })
        };

        //console.log(`前端分頁參數轉換: page=${page}, pageSize=${pageSize} -> first_index=${firstIndex}, last_index=${lastIndex}`);
        //console.log('發送到後端的參數:', requestParams);

        return this.http.post<ApiResponse<PagerDto<Employee>>>(`${this.apiUrl}/query`, requestParams)
            .pipe(
                map(response => {
                    //console.log('後端回應:', response);
                    if (response.code === 1000) {
                        // 後端回傳的資料可能分頁資訊不正確，前端重新計算
                        const backendData = response.data;
                        const actualDataCount = backendData.data_list?.length || 0;
                        
                        // 重新計算正確的分頁資訊
                        const adaptedData: PagerDto<Employee> = {
                            data_list: backendData.data_list,
                            total_records: backendData.total_records,
                            // 使用前端計算的正確分頁資訊
                            first_index_in_page: firstIndex,
                            last_index_in_page: Math.min(lastIndex, backendData.total_records),
                            pageable: backendData.pageable,
                            sort_column: backendData.sort_column,
                            sort_direction: backendData.sort_direction
                        };
                        
                        //console.log(`前端修正分頁資訊: 請求範圍=${firstIndex}-${lastIndex}, 實際回傳=${actualDataCount}筆, 總計=${backendData.total_records}筆`);
                        return adaptedData;
                    } else {
                        throw new Error(response.message || '查詢失敗');
                    }
                }),
                catchError(error => {
                    console.error('API 查詢失敗，使用 Mock 資料:', error);
                    return of(this.getMockEmployeeList());
                })
            );
    }

    /**
     * 根據 ID 取得單一員工
     * @param id 員工 ID
     * @returns 員工資料
     */
    getEmployeeById(id: number): Observable<Employee | null> {
        if (this.useMockData) {
            return of(this.getMockEmployeeById(id)).pipe(delay(300));
        }

        return this.http.get<ApiResponse<Employee>>(`${this.apiUrl}/${id}`)
            .pipe(
                map(response => response.data),
                catchError(() => of(this.getMockEmployeeById(id)))
            );
    }

    /**
     * 建立新員工
     * @param employeeData 員工建立資料
     * @returns 建立的員工資料
     */
    createEmployee(employeeData: EmployeeCreateDto): Observable<Employee> {
        if (this.useMockData) {
            return of(this.createMockEmployee(employeeData)).pipe(delay(600));
        }

        return this.http.post<ApiResponse<Employee>>(`${this.apiUrl}/create`, employeeData)
            .pipe(
                map(response => response.data),
                catchError(() => of(this.createMockEmployee(employeeData)))
            );
    }

    /**
     * 更新員工資料
     * @param id 員工 ID
     * @param employeeData 員工更新資料
     * @returns 更新後的員工資料
     */
    updateEmployee(id: number, employeeData: EmployeeUpdateDto): Observable<Employee> {
        if (this.useMockData) {
            return of(this.updateMockEmployee(id, employeeData)).pipe(delay(600));
        }

        return this.http.post<ApiResponse<Employee>>(`${this.apiUrl}/update`, {
            ...employeeData,
            emp_id: id
        })
            .pipe(
                map(response => response.data),
                catchError(() => of(this.updateMockEmployee(id, employeeData)))
            );
    }

    /**
     * 刪除員工
     * @param id 員工 ID
     * @returns 是否刪除成功
     */
    deleteEmployee(id: number): Observable<boolean> {
        if (this.useMockData) {
            return of(true).pipe(delay(400));
        }

        return this.http.post<ApiResponse<boolean>>(`${this.apiUrl}/delete`, { emp_id: id })
            .pipe(
                map(response => response.data),
                catchError(() => of(true))
            );
    }

    /**
     * 批量刪除員工
     * @param ids 員工 ID 陣列
     * @returns 是否刪除成功
     */
    bulkDeleteEmployees(ids: number[]): Observable<boolean> {
        if (this.useMockData) {
            return of(true).pipe(delay(800));
        }

        return this.http.post<ApiResponse<boolean>>(`${this.apiUrl}/bulk-delete`, { emp_ids: ids })
            .pipe(
                map(response => response.data),
                catchError(() => of(true))
            );
    }

    /**
     * 切換員工啟用狀態
     * @param id 員工 ID
     * @returns 更新後的員工資料
     */
    toggleActiveStatus(id: number): Observable<Employee | null> {
        if (this.useMockData) {
            return of(this.toggleMockEmployeeStatus(id)).pipe(delay(500));
        }

        return this.http.post<ApiResponse<Employee>>(`${this.apiUrl}/toggle-status`, { emp_id: id })
            .pipe(
                map(response => response.data),
                catchError(() => of(this.toggleMockEmployeeStatus(id)))
            );
    }

    // Mock 資料方法 - 用於開發階段
    private getMockEmployeeList(): PagerDto<Employee> {
        const mockEmployees: Employee[] = [
            {
                emp_id: 1,
                emp_code: 'EMP001',
                emp_name: '林泰安',
                emp_email: 'an.lin@example.com',
                emp_phone: '0911222333',
                dept_id: 1,
                job_title: '企業策略長',
                hire_date: '2021-09-01',
                resign_date: null,
                is_active: true,
                create_time: '2024-01-10T08:10:00',
                create_user: 'sysadmin',
                update_time: '2024-06-01T09:05:00',
                update_user: 'sysadmin',
                dept_name: '企業發展事業群'
            },
            {
                emp_id: 2,
                emp_code: 'EMP002',
                emp_name: '張偉翔',
                emp_email: 'will.zhang@example.com',
                emp_phone: '0922123456',
                dept_id: 2,
                job_title: '技術長',
                hire_date: '2022-01-15',
                resign_date: null,
                is_active: true,
                create_time: '2024-01-12T09:20:00',
                create_user: 'sysadmin',
                update_time: '2024-06-03T10:00:00',
                update_user: 'sysadmin',
                dept_name: '技術策略事業群'
            },
            {
                emp_id: 3,
                emp_code: 'EMP003',
                emp_name: '蘇怡君',
                emp_email: 'yijun.su@example.com',
                emp_phone: '0919111222',
                dept_id: 3,
                job_title: '營運總監',
                hire_date: '2023-05-20',
                resign_date: null,
                is_active: true,
                create_time: '2024-02-01T10:15:00',
                create_user: 'admin1',
                update_time: '2024-06-08T08:45:00',
                update_user: 'admin1',
                dept_name: '營運管理中心'
            },
            {
                emp_id: 4,
                emp_code: 'EMP004',
                emp_name: '高家豪',
                emp_email: 'hao.gao@example.com',
                emp_phone: '0933122999',
                dept_id: 4,
                job_title: '業務主管',
                hire_date: '2022-03-12',
                resign_date: null,
                is_active: true,
                create_time: '2024-02-02T13:40:00',
                create_user: 'admin2',
                update_time: '2024-06-10T14:20:00',
                update_user: 'admin2',
                dept_name: '銷售服務中心'
            },
            {
                emp_id: 5,
                emp_code: 'EMP005',
                emp_name: '許惠玲',
                emp_email: 'ling.hsueh@example.com',
                emp_phone: '0966555777',
                dept_id: 5,
                job_title: '研發經理',
                hire_date: '2021-11-01',
                resign_date: null,
                is_active: true,
                create_time: '2024-02-03T11:50:00',
                create_user: 'admin3',
                update_time: '2024-06-11T15:00:00',
                update_user: 'admin3',
                dept_name: '工程研發中心'
            },
            {
                emp_id: 6,
                emp_code: 'EMP006',
                emp_name: '吳志軒',
                emp_email: 'chihsuan.wu@example.com',
                emp_phone: '0977122334',
                dept_id: 6,
                job_title: '品質總監',
                hire_date: '2022-06-08',
                resign_date: null,
                is_active: true,
                create_time: '2024-02-04T15:35:00',
                create_user: 'admin4',
                update_time: '2024-06-12T16:30:00',
                update_user: 'admin4',
                dept_name: '品質管理中心'
            },
            {
                emp_id: 7,
                emp_code: 'EMP007',
                emp_name: '鄭佳珊',
                emp_email: 'jshan.cheng@example.com',
                emp_phone: '0910112233',
                dept_id: 7,
                job_title: '客服專員',
                hire_date: '2023-02-10',
                resign_date: null,
                is_active: true,
                create_time: '2024-03-01T09:00:00',
                create_user: 'ops_mgr',
                update_time: '2024-07-01T09:30:00',
                update_user: 'ops_mgr',
                dept_name: '客服組'
            },
            {
                emp_id: 8,
                emp_code: 'EMP008',
                emp_name: '王柏廷',
                emp_email: 'po.wang@example.com',
                emp_phone: '0988654321',
                dept_id: 8,
                job_title: '採購主任',
                hire_date: '2021-10-20',
                resign_date: null,
                is_active: true,
                create_time: '2024-03-02T10:10:00',
                create_user: 'ops_mgr',
                update_time: '2024-07-01T10:15:00',
                update_user: 'ops_mgr',
                dept_name: '採購組'
            },
            {
                emp_id: 9,
                emp_code: 'EMP009',
                emp_name: '林家宏',
                emp_email: 'chiahong.lin@example.com',
                emp_phone: '0912123456',
                dept_id: 9,
                job_title: '國內業務',
                hire_date: '2023-07-11',
                resign_date: null,
                is_active: true,
                create_time: '2024-03-03T11:20:00',
                create_user: 'sale_mgr',
                update_time: '2024-07-01T11:25:00',
                update_user: 'sale_mgr',
                dept_name: '國內銷售組'
            },
            {
                emp_id: 10,
                emp_code: 'EMP010',
                emp_name: '葉欣怡',
                emp_email: 'hsinyi.yeh@example.com',
                emp_phone: '0933987654',
                dept_id: 10,
                job_title: '國際業務',
                hire_date: '2022-05-19',
                resign_date: null,
                is_active: true,
                create_time: '2024-03-04T12:30:00',
                create_user: 'sale_mgr',
                update_time: '2024-07-01T12:35:00',
                update_user: 'sale_mgr',
                dept_name: '國際銷售組'
            },
            {
                emp_id: 11,
                emp_code: 'EMP011',
                emp_name: '曾國凱',
                emp_email: 'kuokai.tseng@example.com',
                emp_phone: '0977111222',
                dept_id: 11,
                job_title: '後端工程師',
                hire_date: '2021-09-13',
                resign_date: null,
                is_active: true,
                create_time: '2024-03-05T13:40:00',
                create_user: 'eng_mgr',
                update_time: '2024-07-01T13:45:00',
                update_user: 'eng_mgr',
                dept_name: '後端開發組'
            },
            {
                emp_id: 12,
                emp_code: 'EMP012',
                emp_name: '陳韋廷',
                emp_email: 'weitin.chen@example.com',
                emp_phone: '0922233445',
                dept_id: 12,
                job_title: '前端工程師',
                hire_date: '2022-08-08',
                resign_date: null,
                is_active: true,
                create_time: '2024-03-06T14:50:00',
                create_user: 'eng_mgr',
                update_time: '2024-07-01T14:55:00',
                update_user: 'eng_mgr',
                dept_name: '前端開發組'
            },
            {
                emp_id: 13,
                emp_code: 'EMP013',
                emp_name: '賴信瑋',
                emp_email: 'shinwei.lai@example.com',
                emp_phone: '0910666777',
                dept_id: 13,
                job_title: '測試工程師',
                hire_date: '2023-01-15',
                resign_date: null,
                is_active: true,
                create_time: '2024-03-07T15:10:00',
                create_user: 'qa_mgr',
                update_time: '2024-07-01T15:20:00',
                update_user: 'qa_mgr',
                dept_name: '軟體測試組'
            },
            {
                emp_id: 14,
                emp_code: 'EMP014',
                emp_name: '簡雅婷',
                emp_email: 'yating.jian@example.com',
                emp_phone: '0918999888',
                dept_id: 14,
                job_title: '品管稽核員',
                hire_date: '2023-12-25',
                resign_date: null,
                is_active: true,
                create_time: '2024-03-08T16:30:00',
                create_user: 'qa_mgr',
                update_time: '2024-07-01T16:40:00',
                update_user: 'qa_mgr',
                dept_name: '品管稽核組'
            },
            {
                emp_id: 15,
                emp_code: 'EMP015',
                emp_name: '許榮華',
                emp_email: 'jung.hua.hsu@example.com',
                emp_phone: '0910222999',
                dept_id: 15,
                job_title: '風險分析師',
                hire_date: '2022-04-01',
                resign_date: '2024-06-10',
                is_active: false,
                create_time: '2024-03-09T17:00:00',
                create_user: 'ops_mgr',
                update_time: '2024-07-02T17:10:00',
                update_user: 'ops_mgr',
                dept_name: '風險控管組'
            },
            {
                emp_id: 16,
                emp_code: 'EMP016',
                emp_name: '葉姿君',
                emp_email: 'zijun.yeh@example.com',
                emp_phone: '0922112233',
                dept_id: 16,
                job_title: '行銷專員',
                hire_date: '2023-06-22',
                resign_date: null,
                is_active: true,
                create_time: '2024-03-10T18:20:00',
                create_user: 'sale_mgr',
                update_time: '2024-07-02T18:30:00',
                update_user: 'sale_mgr',
                dept_name: '行銷推廣組'
            },
            {
                emp_id: 17,
                emp_code: 'EMP017',
                emp_name: '鄧宜樺',
                emp_email: 'yi.hua.teng@example.com',
                emp_phone: '0910223555',
                dept_id: 17,
                job_title: 'UX設計師',
                hire_date: '2022-10-05',
                resign_date: null,
                is_active: true,
                create_time: '2024-03-11T19:00:00',
                create_user: 'eng_mgr',
                update_time: '2024-07-02T19:10:00',
                update_user: 'eng_mgr',
                dept_name: 'UX設計組'
            },
            {
                emp_id: 18,
                emp_code: 'EMP018',
                emp_name: '方承睿',
                emp_email: 'cheng.jui.fang@example.com',
                emp_phone: '0933444111',
                dept_id: 18,
                job_title: '自動化測試工程師',
                hire_date: '2023-09-01',
                resign_date: null,
                is_active: true,
                create_time: '2024-03-12T20:00:00',
                create_user: 'qa_mgr',
                update_time: '2024-07-02T20:10:00',
                update_user: 'qa_mgr',
                dept_name: '自動化測試組'
            },
            {
                emp_id: 19,
                emp_code: 'EMP019',
                emp_name: '廖立文',
                emp_email: 'liwen.liao@example.com',
                emp_phone: '0919555333',
                dept_id: 19,
                job_title: '技術寫手',
                hire_date: '2021-05-18',
                resign_date: null,
                is_active: true,
                create_time: '2024-03-13T21:00:00',
                create_user: 'eng_mgr',
                update_time: '2024-07-02T21:10:00',
                update_user: 'eng_mgr',
                dept_name: '技術文件組'
            },
            {
                emp_id: 20,
                emp_code: 'EMP020',
                emp_name: '林品妤',
                emp_email: 'pin.yu.lin@example.com',
                emp_phone: '0988777333',
                dept_id: 20,
                job_title: '支援專員',
                hire_date: '2024-01-04',
                resign_date: null,
                is_active: true,
                create_time: '2024-03-14T22:00:00',
                create_user: 'ops_mgr',
                update_time: '2024-07-02T22:10:00',
                update_user: 'ops_mgr',
                dept_name: '支援服務組'
            }
        ];

        return {
            data_list: mockEmployees,
            total_records: mockEmployees.length,
            first_index_in_page: 1,
            last_index_in_page: mockEmployees.length,
            pageable: true,
            sort_column: 'emp_code',
            sort_direction: 'ASC'
        };
    }

    private getMockEmployeeById(id: number): Employee | null {
        const mockData = this.getMockEmployeeList();
        return mockData.data_list.find((emp: Employee) => emp.emp_id === id) || null;
    }

    private createMockEmployee(employeeData: EmployeeCreateDto): Employee {
        const newId = Math.max(...this.getMockEmployeeList().data_list.map((e: Employee) => e.emp_id)) + 1;
        const now = new Date().toISOString();

        return {
            emp_id: newId,
            emp_code: employeeData.emp_code,
            emp_name: employeeData.emp_name,
            dept_id: employeeData.dept_id,
            dept_name: this.getDeptNameById(employeeData.dept_id),
            is_active: employeeData.is_active ?? true,
            create_time: now,
            create_user: 'current_user',
            update_time: now,
            update_user: 'current_user'
        };
    }

    private updateMockEmployee(id: number, employeeData: EmployeeUpdateDto): Employee {
        const existing = this.getMockEmployeeById(id);
        if (!existing) {
            throw new Error('Employee not found');
        }

        return {
            ...existing,
            emp_code: employeeData.emp_code ?? existing.emp_code,
            emp_name: employeeData.emp_name ?? existing.emp_name,
            dept_id: employeeData.dept_id ?? existing.dept_id,
            dept_name: employeeData.dept_id ? this.getDeptNameById(employeeData.dept_id) : existing.dept_name,
            is_active: employeeData.is_active ?? existing.is_active,
            update_time: new Date().toISOString(),
            update_user: 'current_user'
        };
    }

    private toggleMockEmployeeStatus(id: number): Employee | null {
        const existing = this.getMockEmployeeById(id);
        if (!existing) {
            return null;
        }

        return {
            ...existing,
            is_active: !existing.is_active,
            update_time: new Date().toISOString(),
            update_user: 'current_user'
        };
    }

    private getDeptNameById(deptId: number): string {
        const deptMap: { [key: number]: string } = {
            1: '人力資源部',
            2: '財務部',
            3: '資訊部',
            4: '行銷部',
            5: '業務部'
        };
        return deptMap[deptId] || '未知部門';
    }
}
