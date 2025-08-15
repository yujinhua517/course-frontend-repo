/**
 * Department Management Constants
 * 統一的部門管理常數定義，避免重複定義
 */

/**
 * 部門層級排序順序
 */
export const DEPARTMENT_LEVEL_ORDER = {
    'BI': 0,    // 最高層 - Business Intelligence
    'BU': 1,    // 事業群 - Business Unit  
    'TU': 2,    // 技術單位 - Technical Unit
    'SU': 2,    // 服務單位 - Service Unit (與TU同級)
    'LOB-T': 3, // 技術導向事業線 - Line of Business - Technical
    'LOB-S': 3  // 服務導向事業線 - Line of Business - Service
} as const;

/**
 * 部門階層關係映射
 * 定義每個層級可以有哪些上級部門層級
 */
export const DEPARTMENT_HIERARCHY_MAP = {
    'BU': ['BI'],           // BU 的上層只能是 BI
    'TU': ['BU'],           // TU 的上層只能是 BU
    'SU': ['BU'],           // SU 的上層只能是 BU
    'LOB-T': ['TU'],        // LOB-T 的上層只能是 TU
    'LOB-S': ['SU']         // LOB-S 的上層只能是 SU
} as const;

/**
 * 部門狀態常數
 */
export const DEPARTMENT_STATUS = {
    ACTIVE: true,
    INACTIVE: false
} as const;

/**
 * API 回應狀態碼
 */
export const API_STATUS_CODES = {
    SUCCESS: 1000,
    ERROR: 1001
} as const;

/**
 * 表單驗證常數
 */
export const VALIDATION_RULES = {
    DEPT_CODE_MAX_LENGTH: 20,
    DEPT_NAME_MAX_LENGTH: 100,
    DEPT_DESC_MAX_LENGTH: 500
} as const;

/**
 * 統一的排序方向型別
 */
export type SortDirection = 'asc' | 'desc';

/**
 * 排序方向常數
 */
export const SORT_DIRECTIONS = {
    ASC: 'asc' as const,
    DESC: 'desc' as const
} as const;

/**
 * 型別定義
 */
export type DepartmentLevelType = keyof typeof DEPARTMENT_LEVEL_ORDER;
export type DepartmentStatusType = typeof DEPARTMENT_STATUS[keyof typeof DEPARTMENT_STATUS];
