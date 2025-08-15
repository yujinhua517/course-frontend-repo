import { SortDirection } from './department.constants';
import {
    BaseSearchParams,
    QueryOptions,
    ApiResponse,
    PagerDto,
    ServiceListResponse
} from '../../../models/common.model';

export interface Department {
    deptId: number;
    parentDeptId: number | null;
    deptCode: string;
    deptName: string;
    deptLevel: string; // 後端為 string，對應 DepartmentLevel union type
    managerEmpId: number | null;
    isActive: boolean;
    deptDesc?: string; // 後端DepartmentDto有此欄位，但Entity沒有
    createTime: string; // API 回傳字串格式 (LocalDateTime 序列化)
    createUser: string;
    updateTime?: string; // API 回傳字串格式 (LocalDateTime 序列化)
    updateUser?: string;
    parentDeptName?: string; // 後端 DepartmentDto UI 額外欄位
    managerName?: string; // 後端 DepartmentDto UI 額外欄位
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

export interface DepartmentListResponse extends ServiceListResponse<Department> { }

/**
 * 部門查詢參數 - 繼承統一的基礎查詢參數
 */
export interface DepartmentSearchParams extends BaseSearchParams {
    // 部門特有的篩選條件
    deptLevel?: string;
    parentDeptId?: number;
    managerEmpId?: number;
    deptCode?: string;
    deptName?: string;
}

/**
 * 統一的部門查詢選項介面 - 使用通用 QueryOptions
 */
export interface DepartmentQueryOptions extends QueryOptions<Department, DepartmentFilters> { }

/**
 * 部門篩選條件介面
 */
export interface DepartmentFilters {
    activeOnly?: boolean;
    rootOnly?: boolean;
    parentId?: number;
    level?: string;
    isActive?: boolean;
}

// 重新匯出統一介面供其他模組使用
export type { ApiResponse, PagerDto } from '../../../models/common.model';

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
