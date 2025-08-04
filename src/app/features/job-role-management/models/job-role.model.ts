export interface JobRole {
    jobRoleId?: number; // 新增主鍵欄位
    jobRoleCode: string;
    jobRoleName: string;
    description?: string;
    isActive: boolean; // 修改為 boolean 類型
    createTime?: string; // 修改為 string 類型，可選
    createUser?: string; // 可選
    updateTime?: string; // 修改為 string 類型，可選
    updateUser?: string; // 可選
}

export interface JobRoleCreateDto {
    jobRoleCode: string;
    jobRoleName: string;
    description?: string;
    isActive?: boolean; // 修改為 boolean 類型，可選
    createUser?: string; // 新增建立者欄位
}

export interface JobRoleUpdateDto {
    jobRoleId: number; // 新增主鍵欄位，更新時必需
    jobRoleCode: string;
    jobRoleName: string;
    description?: string;
    isActive?: boolean; // 修改為 boolean 類型，可選
    updateUser?: string; // 新增更新者欄位
}

export interface JobRoleSearchParams {
    jobRoleId?: number;
    jobRoleCode?: string;
    jobRoleName?: string;
    description?: string;
    isActive?: boolean;
    // 搜尋參數
    keyword?: string;
    // 排序參數
    sortColumn?: string;
    sortDirection?: string;
    // 分頁參數 (前端使用，會轉換為後端 PageBean 格式)
    pageIndex?: number;  // 0-based 頁碼
    pageSize?: number;   // 每頁筆數
    // 後端 PageBean 分頁參數 (轉換後傳送給後端)
    firstIndexInPage?: number;  // 1-based 第一筆索引
    lastIndexInPage?: number;   // 1-based 最後一筆索引
    pageable?: boolean;
    totalRecords?: number;
}

// API 回應包裝器
export interface ApiResponse<T> {
    code: number;
    message: string;
    data: T;
}

// 分頁回應 DTO (前端使用 camelCase)
export interface PagerDto<T> {
    dataList: T[];
    totalRecords: number;
    firstIndexInPage: number;
    lastIndexInPage: number;
    pageable: boolean;
    sortColumn?: string;
    sortDirection?: string;
    // 額外的分頁資訊（匹配後端 Spring Data Page）
    totalPages?: number;
    page?: number;
    size?: number;
    hasNext?: boolean;
    hasPrevious?: boolean;
}

// 回應類型
export type JobRoleListResponse = ApiResponse<PagerDto<JobRole>>;
