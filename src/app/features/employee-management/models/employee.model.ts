export interface Employee {
    emp_id: number; // 主鍵，自動遞增
    emp_code: string; // 員工工號，UK
    emp_name: string; // 員工姓名
    emp_email?: string; // 電子郵件
    emp_phone?: string; // 聯絡電話
    dept_id: number; // 所屬部門代碼，FK
    job_title?: string; // 職稱
    hire_date?: string; // 到職日 (後端使用 LocalDate，前端接收為 string)
    resign_date?: string | null; // 離職日
    is_active: boolean; // 是否在職 (後端使用 Boolean)
    create_time: string; // 建檔時間 (後端使用 LocalDateTime，前端接收為 string)
    create_user: string; // 建檔人員
    update_time?: string; // 最後更新時間
    update_user?: string; // 最後更新人員
    dept_name?: string; // 部門名稱 (從 JOIN 查詢取得)
}

export interface EmployeeCreateDto {
    emp_code: string;
    emp_name: string;
    emp_email?: string;
    emp_phone?: string;
    dept_id: number;
    job_title?: string;
    hire_date?: string;
    resign_date?: string | null;
    is_active: boolean;
}

export interface EmployeeUpdateDto {
    emp_id: number;
    emp_code: string;
    emp_name: string;
    emp_email?: string;
    emp_phone?: string;
    dept_id: number;
    job_title?: string;
    hire_date?: string;
    resign_date?: string | null;
    is_active: boolean;
}

export interface EmployeeSearchParams {
    // Employee search fields (matching EmployeeVo)
    emp_id?: number;
    emp_code?: string;
    emp_name?: string;
    emp_email?: string;
    emp_phone?: string;
    dept_id?: number;
    job_title?: string;
    hire_date?: string;
    hire_date_from?: string;
    hire_date_to?: string;
    resign_date?: string;
    resign_date_from?: string;
    resign_date_to?: string;
    is_active?: boolean;

    // 搜尋相關參數
    keyword?: string;
    // 排序參數
    sortBy?: string;
    sort_column?: string;
    sort_direction?: string;
    // 分頁參數
    page?: number;
    pageSize?: number;
    // 分頁參數 (匹配後端 PageBean)
    total_records?: number;
    first_index_in_page?: number;
    last_index_in_page?: number;
    pageable?: boolean;
}

// API 回應包裝器 (與後端 ApiResponse<T> 對應)
export interface ApiResponse<T> {
    code: number;
    message: string;
    data: T;
}

// 分頁回應 DTO (與後端 PagerDto<T> 對應)
export interface PagerDto<T> {
    data_list: T[];
    total_records: number;
    first_index_in_page: number;
    last_index_in_page: number;
    pageable: boolean;
    sort_column?: string;
    sort_direction?: string;
}

export interface EmployeeListResponse {
    data: Employee[];
    total: number;
    page: number;
    pageSize: number;
}
