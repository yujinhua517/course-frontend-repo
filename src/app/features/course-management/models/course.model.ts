import {
    BaseSearchParams,
    ApiResponse,
    PagerDto,
    ServiceListResponse
} from '../../../models/common.model';

/* =========================================================
 * 1) 前端 View/Domain Model（畫面層：camelCase）
 *    - 後端 BigDecimal → 前端 number
 *    - LocalDateTime → ISO string
 * ========================================================= */

export interface Course {
    courseId: number;
    courseEventId: number;
    courseName: string;
    learningType?: string;
    skillType?: string;
    level?: string;
    hours?: number;
    isActive: boolean;
    remark?: string;

    createTime: string;
    createUser: string;
    updateTime?: string;
    updateUser?: string;
}

/** 建立用（移除 id 與系統欄位） */
export type CourseCreateDto = Omit<
    Course,
    'courseId' | 'createTime' | 'createUser' | 'updateTime' | 'updateUser'
>;

/** 更新用（允許部分更新 + 需要 id） */
export type CourseUpdateDto = Partial<CourseCreateDto> & { courseId: number };

/* =========================================================
 * 2) 查詢參數（對應 POST /api/courses/query 的 CourseVo）
 *    - 直接沿用 VO 支援的欄位（hoursFrom/hoursTo）
 * ========================================================= */

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
    createTime?: string; // 若需要以時間查詢，可與後端確認是否啟用
    updateTime?: string;

    // 區間
    hoursFrom?: number;
    hoursTo?: number;
}

/** 列表回應（/query 回傳 PagerDto<CourseDto>） */
export interface CourseListResponse extends ServiceListResponse<Course> { }

/* =========================================================
 * 3) 與後端交換的 Server 型別（snake_case）
 *    - 這些是你「真的送/收」的 JSON 欄位
 * ========================================================= */

export interface CourseDtoServer {
    course_id: number;
    course_event_id: number;
    course_name: string;
    learning_type?: string;
    skill_type?: string;
    level?: string;
    hours?: number;           // BigDecimal 已序列化為數字
    is_active: boolean;
    remark?: string;
    create_time?: string;     // ISO
    create_user?: string;
    update_time?: string;
    update_user?: string;
}

/** 後端 VO：/create /update /delete /query 都吃 VO 當 body */
export interface CourseVoServer {
    // PageBean 欄位（若需要可補：page, page_size, sort_by, sort_direction ...）
    course_id?: number;
    course_event_id?: number;
    course_name?: string;
    learning_type?: string;
    skill_type?: string;
    level?: string;
    hours?: number;
    is_active?: boolean;
    remark?: string;
    create_user?: string;
    update_user?: string;
    create_time?: string;
    update_time?: string;

    // 區間
    hours_from?: number;
    hours_to?: number;
}

/* =========================================================
 * 4) 重新匯出共用型別
 * ========================================================= */
export type { ApiResponse, PagerDto, ServiceListResponse } from '../../../models/common.model';
