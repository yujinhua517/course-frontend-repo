export interface Employee {
    empId: number; // 主鍵，自動遞增
    empCode: string; // 員工工號，UK
    empName: string; // 員工姓名
    empEmail?: string; // 電子郵件
    empPhone?: string; // 聯絡電話
    deptId: number; // 所屬部門代碼，FK
    jobTitle?: string; // 職稱
    hireDate?: string; // 到職日 (後端使用 LocalDate，前端接收為 string)
    resignDate?: string | null; // 離職日
    isActive: boolean; // 是否在職 (後端使用 Boolean)
    createTime: string; // 建檔時間 (後端使用 LocalDateTime，前端接收為 string)
    createUser: string; // 建檔人員
    updateTime?: string; // 最後更新時間
    updateUser?: string; // 最後更新人員
    deptName?: string; // 部門名稱 (從 JOIN 查詢取得)
}

export interface EmployeeCreateDto {
    empCode: string;
    empName: string;
    empEmail?: string;
    empPhone?: string;
    deptId: number;
    jobTitle?: string;
    hireDate?: string;
    resignDate?: string | null;
    isActive: boolean;
}

export interface EmployeeUpdateDto {
    empId: number;
    empCode: string;
    empName: string;
    empEmail?: string;
    empPhone?: string;
    deptId: number;
    jobTitle?: string;
    hireDate?: string;
    resignDate?: string | null;
    isActive: boolean;
}

export interface EmployeeSearchParams {
    // Employee search fields (matching EmployeeVo)
    empId?: number;
    empCode?: string;
    empName?: string;
    empEmail?: string;
    empPhone?: string;
    deptId?: number;
    jobTitle?: string;
    hireDate?: string;
    hireDateFrom?: string;
    hireDateTo?: string;
    resignDate?: string;
    resignDateFrom?: string;
    resignDateTo?: string;
    isActive?: boolean;

    // 搜尋相關參數
    keyword?: string;
    // 排序參數
    sortBy?: string;
    sortColumn?: string;
    sortDirection?: string;
    // 分頁參數
    page?: number;
    pageSize?: number;
    // 分頁參數 (匹配後端 PageBean)
    totalRecords?: number;
    firstIndexInPage?: number;
    lastIndexInPage?: number;
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
    dataList: T[];
    totalRecords: number;
    firstIndexInPage: number;
    lastIndexInPage: number;
    pageable: boolean;
    sortColumn?: string;
    sortDirection?: string;
}

export interface EmployeeListResponse {
    data: Employee[];
    total: number;
    page: number;
    pageSize: number;
}
