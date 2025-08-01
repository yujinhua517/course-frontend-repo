export interface Department {
    dept_id: number;
    parent_dept_id: number | null;
    dept_code: string;
    dept_name: string;
    dept_level: string; // 後端為 string，前端可用 enum 或 union type
    manager_emp_id: number | null;
    is_active: boolean;
    dept_desc?: string; // 後端有此欄位
    create_time: Date;
    create_user: string;
    update_time?: Date;
    update_user?: string;
    parent_dept_name?: string; // 後端 UI 額外欄位
    manager_name?: string; // 後端 UI 額外欄位
}

export type DepartmentLevel = 'BI' | 'BU' | 'TU' | 'SU' | 'LOB-S' | 'LOB-T' | string;

export interface CreateDepartmentRequest {
    dept_code: string;
    dept_name: string;
    dept_level: string;
    parent_dept_id?: number | null;
    manager_emp_id?: number | null;
    is_active: boolean;
    dept_desc?: string;
}


export interface UpdateDepartmentRequest extends Partial<CreateDepartmentRequest> {
    dept_id: number;
}

export interface DepartmentListResponse {
    data?: Department[];
    departments?: Department[];
    total: number;
    page: number;
    pageSize: number;
}

export interface DepartmentSearchFilters {
    keyword?: string;
    dept_level?: string;
    is_active?: boolean;
    parent_dept_id?: number;
}

export interface DepartmentSearchParams {
    keyword?: string;
    dept_level?: string;
    is_active?: boolean;
    parent_dept_id?: number;
    page?: number;
    pageSize?: number;
    sortBy?: keyof Department;
    sortDirection?: 'asc' | 'desc';
    sort_direction?: 'asc' | 'desc';
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
