import {
    BaseSearchParams,
    QueryOptions,
    ApiResponse,
    PagerDto,
    ServiceListResponse
} from '../../../core/models/common.model';

// 核心課程活動介面
export interface CourseEvent {
    courseEventId?: number; // 主鍵，自動遞增
    year: string; // 年度
    semester: string; // 學期：H1/2H
    activityTitle: string; // 活動標題
    description?: string; // 活動描述
    expectedCompletionDate?: string; // 預期完成日期
    submissionDeadline?: string; // 提交截止日期
    activationDate?: string; // 啟動日期
    isActive: boolean; // 是否啟用
    createTime: string; // 建立時間
    createUser: string; // 建立者
    updateTime?: string; // 最後更新時間
    updateUser?: string; // 最後更新者
}

// DTO 介面
export interface CourseEventCreateDto {
    year: string;
    semester: string;
    activityTitle: string;
    description?: string;
    expectedCompletionDate?: string;
    submissionDeadline?: string;
    activationDate?: string;
    isActive: boolean;
}

export interface CourseEventUpdateDto {
    courseEventId: number;
    year: string;
    semester: string;
    activityTitle: string;
    description?: string;
    expectedCompletionDate?: string;
    submissionDeadline?: string;
    activationDate?: string;
    isActive: boolean;
}

// 搜尋參數介面 - 繼承統一的基礎查詢參數
export interface CourseEventSearchParams extends BaseSearchParams {
    // 課程活動特有的搜尋欄位
    courseEventId?: number;
    year?: string;
    semester?: string;
    activityTitle?: string;
    description?: string;
    expectedCompletionDate?: string;
    expectedCompletionDateFrom?: string;
    expectedCompletionDateTo?: string;
    submissionDeadline?: string;
    submissionDeadlineFrom?: string;
    submissionDeadlineTo?: string;
    activationDate?: string;
    activationDateFrom?: string;
    activationDateTo?: string;
}

/**
 * 課程活動列表回應介面
 */
export interface CourseEventListResponse extends ServiceListResponse<CourseEvent> { }

/**
 * 課程活動查詢選項介面
 */
export interface CourseEventQueryOptions extends QueryOptions<CourseEvent, CourseEventFilters> { }

/**
 * 課程活動篩選條件介面
 */
export interface CourseEventFilters {
    year?: string;
    semester?: string;
    isActive?: boolean;
    expectedCompletionDateFrom?: string;
    expectedCompletionDateTo?: string;
    submissionDeadlineFrom?: string;
    submissionDeadlineTo?: string;
    activationDateFrom?: string;
    activationDateTo?: string;
}

// 上下半年選項
export const SEMESTER_OPTIONS = [
    { value: 'H1', label: '上半年 (H1)', description: '1月至6月' },
    { value: 'H2', label: '下半年 (H2)', description: '7月至12月' }
] as const;


// 重新匯出統一介面供其他模組使用
export type {
    ApiResponse,
    PagerDto,
    ServiceListResponse
} from '../../../core/models/common.model';
