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

export type DepartmentLevel = 'BI' | 'BU' | 'LOB' | string;

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

export const DEPARTMENT_LEVEL_OPTIONS = [
    { value: 'BI', label: 'BI', color: 'primary', icon: 'bi-building' },
    { value: 'BU', label: 'BU', color: 'info', icon: 'bi-diagram-3' },
    { value: 'LOB', label: 'LOB', color: 'success', icon: 'bi-boxes' }
] as const;
