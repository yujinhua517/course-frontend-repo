import {
    BaseSearchParams,
    ServiceListResponse,
    QueryOptions // 如果你也想跟其他模組一樣提供 UI QueryOptions
} from '../../../models/common.model';

/* ===================== 1) View/Domain Model ===================== */

export interface Course {
    courseId: number;
    courseEventId: number;
    courseName: string;
    learningType?: LearningType;
    skillType?: SkillType;
    level?: Level;
    hours?: number;       // 後端 BigDecimal → 前端 number
    isActive: boolean;
    remark?: string;

    // 建議與 CourseEvent 一致，系統欄位改為可選（由後端產生）
    createTime?: string;  // ISO LocalDateTime
    createUser?: string;
    updateTime?: string;
    updateUser?: string;
}

/** 建立用（移除 id 與系統欄位） */
export interface CourseCreateDto {
    courseEventId: number;
    courseName: string;
    learningType?: LearningType;
    skillType?: SkillType;
    level?: Level;
    hours?: number;
    isActive: boolean;
    remark?: string;
}

/** 更新用（允許部分更新 + 需要 id） */
export interface CourseUpdateDto extends CourseCreateDto {
    courseId: number;
}

/* ===================== 2) 查詢參數（對應 VO） ===================== */

export interface CourseSearchParams extends BaseSearchParams {
    courseId?: number;
    courseEventId?: number;
    courseName?: string;
    learningType?: LearningType;
    skillType?: SkillType;
    level?: Level;
    hours?: number;
    isActive?: boolean;
    remark?: string;
    createUser?: string;
    updateUser?: string;
    createTime?: string;
    updateTime?: string;

    // 區間
    hoursFrom?: number;
    hoursTo?: number;
}

/** 列表回應（/query 回傳 PagerDto<CourseDto>） */
export type CourseListResponse = ServiceListResponse<Course>;

/* ===================== 3) （可選）UI Filters + QueryOptions ===================== */

export interface CourseFilters {
    courseEventId?: number;
    learningType?: LearningType;
    skillType?: SkillType;
    level?: Level;
    isActive?: boolean;
    hoursFrom?: number;
    hoursTo?: number;
}
export type CourseQueryOptions = QueryOptions<Course, CourseFilters>;

// /* ===================== 4) 列舉型欄位：常數 + 型別 ===================== */

// 靜態常數 (已改為動態載入，但保留型別定義)
export const LEARNING_TYPE_OPTIONS = [
    { value: '實體', label: '實體' },
    { value: '線上', label: '線上' },
    { value: '混合', label: '混合' }
] as const;
export type LearningType = typeof LEARNING_TYPE_OPTIONS[number]['value'];

export const SKILL_TYPE_OPTIONS = [
    { value: '軟體力', label: '軟體力' },
    { value: '數據力', label: '數據力' },
    { value: '雲', label: '雲' }
] as const;
export type SkillType = typeof SKILL_TYPE_OPTIONS[number]['value'];

export const LEVEL_OPTIONS = [
    { value: '初階', label: '初階' },
    { value: '中階', label: '中階' },
    { value: '進階', label: '進階' }
] as const;
export type Level = typeof LEVEL_OPTIONS[number]['value'];