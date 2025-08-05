// 核心員工介面
export interface Employee {
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
    createTime: string;
    createUser: string;
    updateTime?: string;
    updateUser?: string;
    deptName?: string; // 從 JOIN 查詢取得
}

// DTO 介面
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

// 搜尋參數介面
export interface EmployeeSearchParams {
    // 基本搜尋欄位
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
    keyword?: string;

    // 排序參數
    sortBy?: string;
    sortColumn?: string;
    sortDirection?: string;

    // 分頁參數
    page?: number;
    pageSize?: number;
    totalRecords?: number;
    firstIndexInPage?: number;
    lastIndexInPage?: number;
    pageable?: boolean;
}

// API 標準回應格式
export interface ApiResponse<T> {
    code: number;
    message: string;
    data: T;
}

// 分頁回應格式
export interface PagerDto<T> {
    dataList: T[];
    totalRecords: number;
    firstIndexInPage: number;
    lastIndexInPage: number;
    pageable: boolean;
    sortColumn?: string;
    sortDirection?: string;
}
