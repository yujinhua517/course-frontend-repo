import {
    BaseSearchParams,
    QueryOptions,
    ServiceListResponse,
} from '../../../models/common.model';

/** ---- View Model（畫面用，camelCase） ---- */
export interface Department {
    deptId: number;
    parentDeptId?: number | null;  // 改為可選 + null
    deptCode: string;
    deptName: string;
    deptLevel: DepartmentLevel;    // 使用嚴格 union
    managerEmpId?: number | null;  // 改為可選 + null
    isActive: boolean;
    deptDesc?: string;             // 可能由後端 DTO 投影
    createTime?: string;           // 系統欄位 → 可選
    createUser?: string;
    updateTime?: string;
    updateUser?: string;
    /** UI only fields (backend-projected) */
    parentDeptName?: string;
    managerName?: string;
}

/** ---- 安全的層級型別 ---- */
export const DEPARTMENT_LEVEL_OPTIONS = [
    { value: 'BI', label: 'BI', color: 'primary', icon: 'bi-building', description: '商業單位（最高層）' },
    { value: 'BU', label: 'BU', color: 'info', icon: 'bi-diagram-3', description: '事業群' },
    { value: 'TU', label: 'TU', color: 'warning', icon: 'bi-gear', description: '技術單位' },
    { value: 'SU', label: 'SU', color: 'secondary', icon: 'bi-people', description: '服務單位' },
    { value: 'LOB-T', label: 'LOB-T', color: 'success', icon: 'bi-code-slash', description: '技術導向事業線' },
    { value: 'LOB-S', label: 'LOB-S', color: 'dark', icon: 'bi-headset', description: '服務導向事業線' }
] as const;

export type DepartmentLevel = typeof DEPARTMENT_LEVEL_OPTIONS[number]['value'];

/** ---- 建立/更新請求（View → API） ---- */
export interface CreateDepartmentRequest {
    deptCode: string;
    deptName: string;
    deptLevel: DepartmentLevel;    // 強型別
    parentDeptId?: number | null;
    managerEmpId?: number | null;
    isActive: boolean;
    deptDesc?: string;
}

export interface UpdateDepartmentRequest extends Partial<CreateDepartmentRequest> {
    deptId: number;
}

/** ---- 列表回應（語意別名） ---- */
export type DepartmentListResponse = ServiceListResponse<Department>;

/** ---- 查詢參數（送 API 用） ---- */
export interface DepartmentSearchParams extends BaseSearchParams {
    deptLevel?: DepartmentLevel;
    parentDeptId?: number;
    managerEmpId?: number;
    deptCode?: string;
    deptName?: string;
}

/** ---- UI 查詢選項（頁面狀態） ---- */
export interface DepartmentFilters {
    isActive?: boolean;
    parentDeptId?: number;        // 命名對齊
    deptLevel?: DepartmentLevel;  // 命名對齊
    activeOnly?: boolean;         // 若保留，Service 端轉成 isActive=true
}

export interface DepartmentQueryOptions extends QueryOptions<Department, DepartmentFilters> { }

/** ---- 階層規則（型別綁定） ---- */
export const DEPARTMENT_HIERARCHY_RULES: Record<
    DepartmentLevel,
    { allowedParents: DepartmentLevel[]; description: string }
> = {
    'BI': { allowedParents: [], description: '商業單位（最高層）' },
    'BU': { allowedParents: ['BI'], description: '事業群' },
    'TU': { allowedParents: ['BU'], description: '技術單位' },
    'SU': { allowedParents: ['BU'], description: '服務單位' },
    'LOB-T': { allowedParents: ['TU'], description: '技術導向事業線' },
    'LOB-S': { allowedParents: ['SU'], description: '服務導向事業線' }
};
