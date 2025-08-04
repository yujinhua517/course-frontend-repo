export interface JobRole {
    job_role_id?: number; // 新增主鍵欄位
    job_role_code: string;
    job_role_name: string;
    description?: string;
    is_active: boolean; // 修改為 boolean 類型
    create_time?: string; // 修改為 string 類型，可選
    create_user?: string; // 可選
    update_time?: string; // 修改為 string 類型，可選
    update_user?: string; // 可選
}

export interface JobRoleCreateDto {
    job_role_code: string;
    job_role_name: string;
    description?: string;
    is_active?: boolean; // 修改為 boolean 類型，可選
    create_user?: string; // 新增建立者欄位
}

export interface JobRoleUpdateDto {
    job_role_id: number; // 新增主鍵欄位，更新時必需
    job_role_code: string;
    job_role_name: string;
    description?: string;
    is_active?: boolean; // 修改為 boolean 類型，可選
    update_user?: string; // 新增更新者欄位
}

export interface JobRoleSearchParams {
    job_role_id?: number;
    job_role_code?: string;
    job_role_name?: string;
    description?: string;
    is_active?: boolean;
    // 搜尋參數
    keyword?: string;
    // 排序參數
    sort_column?: string;
    sort_direction?: string;
    // 分頁參數 (前端使用，會轉換為後端 PageBean 格式)
    page_index?: number;  // 0-based 頁碼
    page_size?: number;   // 每頁筆數
    // 後端 PageBean 分頁參數 (轉換後傳送給後端)
    first_index_in_page?: number;  // 1-based 第一筆索引
    last_index_in_page?: number;   // 1-based 最後一筆索引
    pageable?: boolean;
    total_records?: number;
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
    // 額外的分頁資訊（匹配後端 Spring Data Page）
    totalPages?: number;
    page?: number;
    size?: number;
    hasNext?: boolean;
    hasPrevious?: boolean;
}

// 回應類型
export type JobRoleListResponse = ApiResponse<PagerDto<JobRole>>;
