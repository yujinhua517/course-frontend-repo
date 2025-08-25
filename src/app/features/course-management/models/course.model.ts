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
    learningType?: string;
    skillType?: string;
    level?: string;
    hours?: number;       // 後端 BigDecimal → 前端 number
    isActive: boolean;
    remark?: string;

    // 系統欄位改為可選（由後端產生）
    createTime?: string;  // ISO LocalDateTime
    createUser?: string;
    updateTime?: string;
    updateUser?: string;
}

/** 建立用（移除 id 與系統欄位） */
export interface CourseCreateDto {
    courseEventId: number;
    courseName: string;
    learningType?: string;
    skillType?: string;
    level?: string;
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
    learningType?: string;
    skillType?: string;
    level?: string;
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
    learningType?: string;
    skillType?: string;
    level?: string;
    isActive?: boolean;
    hoursFrom?: number;
    hoursTo?: number;
}
export type CourseQueryOptions = QueryOptions<Course, CourseFilters>;

/* ===================== 4) 列舉型欄位：常數 + 型別 ===================== */

/** 上課方式選項（根據 spec 規格） */
export const LEARNING_TYPE_OPTIONS = [
    { value: '實體', label: '實體' },
    { value: '線上', label: '線上' },
    { value: '混合', label: '混合' }
] as const;
export type LearningType = typeof LEARNING_TYPE_OPTIONS[number]['value'];

/** 技術類別選項（根據 spec 規格） */
export const SKILL_TYPE_OPTIONS = [
    { value: '軟體力', label: '軟體力' },
    { value: '數據力', label: '數據力' },
    { value: '雲', label: '雲' }
] as const;
export type SkillType = typeof SKILL_TYPE_OPTIONS[number]['value'];

/** 等級選項（根據 spec 規格） */
export const LEVEL_OPTIONS = [
    { value: '入門', label: '入門' },
    { value: '初級', label: '初級' },
    { value: '中級', label: '中級' },
    { value: '高級', label: '高級' },
    { value: '專家', label: '專家' }
] as const;
export type Level = typeof LEVEL_OPTIONS[number]['value'];