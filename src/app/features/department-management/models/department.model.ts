export interface Department {
    deptId: number;
    parentDeptId: number | null;
    deptCode: string;
    deptName: string;
    deptLevel: string; // 後端為 string，前端可用 enum 或 union type
    managerEmpId: number | null;
    isActive: boolean;
    deptDesc?: string; // 後端有此欄位
    createTime: string; // API 回傳字串格式
    createUser: string;
    updateTime?: string; // API 回傳字串格式
    updateUser?: string;
    parentDeptName?: string; // 後端 UI 額外欄位
    managerName?: string; // 後端 UI 額外欄位
}

export type DepartmentLevel = 'BI' | 'BU' | 'TU' | 'SU' | 'LOB-S' | 'LOB-T' | string;

export interface CreateDepartmentRequest {
    deptCode: string;
    deptName: string;
    deptLevel: string;
    parentDeptId?: number | null;
    managerEmpId?: number | null;
    isActive: boolean;
    deptDesc?: string;
}


export interface UpdateDepartmentRequest extends Partial<CreateDepartmentRequest> {
    deptId: number;
}

export interface DepartmentListResponse {
    data: Department[];
    total: number;
    page: number;
    pageSize: number;
}

export interface DepartmentSearchFilters {
    keyword?: string;
    deptLevel?: string;
    isActive?: boolean;
    parentDeptId?: number;
}

export interface DepartmentSearchParams {
    keyword?: string;
    deptLevel?: string;
    isActive?: boolean;
    parentDeptId?: number;
    page?: number;
    pageSize?: number;
    sortBy?: keyof Department;
    sortDirection?: 'asc' | 'desc';
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

/**
 * 部門階層關係定義
 * BI (最高層) -> BU -> TU/SU -> LOB-T/LOB-S
 */
export const DEPARTMENT_HIERARCHY_RULES = {
    'BI': { allowedParents: [], description: '商業單位（最高層）' },
    'BU': { allowedParents: ['BI'], description: '事業群' },
    'TU': { allowedParents: ['BU'], description: '技術單位' },
    'SU': { allowedParents: ['BU'], description: '服務單位' },
    'LOB-T': { allowedParents: ['TU'], description: '技術導向事業線' },
    'LOB-S': { allowedParents: ['SU'], description: '服務導向事業線' }
} as const;

export const DEPARTMENT_LEVEL_OPTIONS = [
    { value: 'BI', label: 'BI', color: 'primary', icon: 'bi-building', description: '商業單位（最高層）' },
    { value: 'BU', label: 'BU', color: 'info', icon: 'bi-diagram-3', description: '事業群' },
    { value: 'TU', label: 'TU', color: 'warning', icon: 'bi-gear', description: '技術單位' },
    { value: 'SU', label: 'SU', color: 'secondary', icon: 'bi-people', description: '服務單位' },
    { value: 'LOB-T', label: 'LOB-T', color: 'success', icon: 'bi-code-slash', description: '技術導向事業線' },
    { value: 'LOB-S', label: 'LOB-S', color: 'dark', icon: 'bi-headset', description: '服務導向事業線' }
] as const;
