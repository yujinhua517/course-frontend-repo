import {
    BaseSearchParams,
    QueryOptions,
    ServiceListResponse
} from '../../../core/models/common.model';

export interface JobRole {
    jobRoleId?: number; // 新增主鍵欄位
    jobRoleCode: string;
    jobRoleName: string;
    description?: string;
    isActive: boolean; // 修改為 boolean 類型
    createTime?: string; // 修改為 string 類型，可選
    createUser?: string; // 可選
    updateTime?: string; // 修改為 string 類型，可選
    updateUser?: string; // 可選
}

export interface JobRoleCreateDto {
    jobRoleCode: string;
    jobRoleName: string;
    description?: string;
    isActive?: boolean; // 修改為 boolean 類型，可選
    createUser?: string; // 新增建立者欄位
}

export interface JobRoleUpdateDto {
    jobRoleId: number; // 新增主鍵欄位，更新時必需
    jobRoleCode: string;
    jobRoleName: string;
    description?: string;
    isActive?: boolean; // 修改為 boolean 類型，可選
    updateUser?: string; // 新增更新者欄位
}

/**
 * 職務角色查詢參數 - 繼承統一的基礎查詢參數
 */
export interface JobRoleSearchParams extends BaseSearchParams {
    // 職務角色特有的搜尋欄位
    jobRoleId?: number;
    jobRoleCode?: string;
    jobRoleName?: string;
    description?: string;
}

/**
 * 職務角色列表回應介面
 */
export interface JobRoleListResponse extends ServiceListResponse<JobRole> { }

/**
 * 職務角色查詢選項介面
 */
export interface JobRoleQueryOptions extends QueryOptions<JobRole, JobRoleFilters> { }

/**
 * 職務角色篩選條件介面
 */
export interface JobRoleFilters {
    isActive?: boolean;
}

// 重新匯出統一介面供其他模組使用
export type {
    ApiResponse,
    PagerDto,
    ServiceListResponse
} from '../../../core/models/common.model';
