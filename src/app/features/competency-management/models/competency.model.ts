export interface Competency {
    job_role_code: string;
    job_role_name: string;
    description?: string;
    is_active: boolean; // 修改為 boolean 類型
    create_time: string; // 修改為 string 類型
    create_user: string;
    update_time: string; // 修改為 string 類型
    update_user: string;
}

export interface CompetencyCreateDto {
    job_role_code: string;
    job_role_name: string;
    description?: string;
    is_active: boolean; // 修改為 boolean 類型
}

export interface CompetencyUpdateDto {
    job_role_code: string;
    job_role_name: string;
    description?: string;
    is_active: boolean; // 修改為 boolean 類型
}

export interface CompetencySearchParams {
    job_role_code?: string;
    job_role_name?: string;
    description?: string;
    is_active?: boolean; // 修改為 boolean 類型
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

// API 回應包裝器
export interface ApiResponse<T> {
    code: number;
    message: string;
    data: T;
}

// 分頁回應 DTO
export interface PagerDto<T> {
    data_list: T[];
    total_records: number;
    first_index_in_page: number;
    last_index_in_page: number;
    pageable: boolean;
    sort_column?: string;
    sort_direction?: string;
}

// 回應類型
export type CompetencyListResponse = ApiResponse<PagerDto<Competency>>;
