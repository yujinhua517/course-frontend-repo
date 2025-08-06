import {
    BaseSearchParams,
    QueryOptions,
    ApiResponse,
    PagerDto,
    ServiceListResponse
} from '../../../core/models/common.model';

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

// 搜尋參數介面 - 繼承統一的基礎查詢參數
export interface EmployeeSearchParams extends BaseSearchParams {
    // 員工特有的搜尋欄位
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
}

/**
 * 員工列表回應介面
 */
export interface EmployeeListResponse extends ServiceListResponse<Employee> { }

/**
 * 員工查詢選項介面
 */
export interface EmployeeQueryOptions extends QueryOptions<Employee, EmployeeFilters> { }

/**
 * 員工篩選條件介面
 */
export interface EmployeeFilters {
    deptId?: number;
    isActive?: boolean;
    hireDateFrom?: string;
    hireDateTo?: string;
    resignDateFrom?: string;
    resignDateTo?: string;
}

// 重新匯出統一介面供其他模組使用
export type {
    ApiResponse,
    PagerDto,
    ServiceListResponse
} from '../../../core/models/common.model';
