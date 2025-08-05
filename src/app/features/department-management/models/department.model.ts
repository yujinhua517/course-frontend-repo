import { SortDirection } from './department.constants';

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

export interface DepartmentListResponse {
    data: Department[];
    total: number;
    page: number;
    pageSize: number;
}

export interface DepartmentSearchParams {
    // 篩選條件
    keyword?: string;
    deptLevel?: string;
    isActive?: boolean;
    parentDeptId?: number;
    // 分頁參數
    page?: number;
    pageSize?: number;
    // 排序參數
    sortBy?: keyof Department;
    sortDirection?: SortDirection;
}

/**
 * 統一的部門查詢選項介面
 * 整合所有查詢需求，避免重複的方法
 */
export interface DepartmentQueryOptions {
    // 分頁參數
    page?: number;
    pageSize?: number;

    // 搜尋關鍵字
    searchTerm?: string;

    // 篩選選項
    filters?: {
        activeOnly?: boolean;
        rootOnly?: boolean;
        parentId?: number;
        level?: string;
        isActive?: boolean;
    };

    // 排序選項
    sort?: {
        field: keyof Department;
        direction: SortDirection;
    };
}

// API 回應包裝器 - 對齊後端 ApiResponse<T>
export interface ApiResponse<T> {
    code: number; // 對應後端 Integer code (1000=成功)
    message: string; // 對應後端 String message
    data: T; // 對應後端 T data
}

// 分頁回應 DTO - 對齊後端 PagerDto<T> + PageBean
export interface PagerDto<T> {
    // 後端 PagerDto 的 dataList 欄位 (使用 @JsonProperty("data_list"))
    dataList: T[]; // 對應後端 @JsonProperty("data_list") List<T> dataList

    // 後端 PageBean 的分頁欄位 (使用 snake_case JsonProperty)
    totalRecords: number; // 對應 @JsonProperty("total_records") int totalRecords
    firstIndexInPage: number; // 對應 @JsonProperty("first_index_in_page") int firstIndexInPage
    lastIndexInPage: number; // 對應 @JsonProperty("last_index_in_page") int lastIndexInPage
    pageable: boolean; // 對應 @JsonProperty("pageable") boolean pageable
    sortColumn?: string; // 對應 @JsonProperty("sort_column") String sortColumn
    sortDirection?: string; // 對應 @JsonProperty("sort_direction") String sortDirection

    // Spring Data Page 額外資訊（前端計算用）
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
