import {
    BaseSearchParams,
    QueryOptions,
    ServiceListResponse
} from '../../../models/common.model';

// 1. 主核心模型
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
    deptName?: string; // JOIN 出來才有
}

// 2. DTOs
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
export interface EmployeeUpdateDto extends EmployeeCreateDto {
    empId: number;
}

// 3. 後端查詢參數
export interface EmployeeSearchParams extends BaseSearchParams {
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

// 4. 後端回應格式
export type EmployeeListResponse = ServiceListResponse<Employee>;

// 5. 前端 UI 查詢狀態
export type EmployeeQueryOptions = QueryOptions<Employee, EmployeeFilters>;

// 6. 前端篩選條件
export interface EmployeeFilters {
    deptId?: number;
    isActive?: boolean;
    hireDateFrom?: string;
    hireDateTo?: string;
    resignDateFrom?: string;
    resignDateTo?: string;
}
