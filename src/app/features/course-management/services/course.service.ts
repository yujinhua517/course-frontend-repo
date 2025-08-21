import { Injectable, signal, computed } from '@angular/core';
import { Observable, of, map, delay, catchError } from 'rxjs';
import { BaseQueryService } from '../../../core/services/base-query.service';
import { ApiResponse, ServiceListResponse } from '../../../models/common.model';
import { environment } from '../../../../environments/environment';
import { MOCK_COURSES } from './mock-course.data';
import {
    Course,
    CourseSearchParams,
    CourseCreateDto,
    CourseUpdateDto
} from '../models/course.model';


/**
 * 課程管理服務
 * 
 * 繼承 BaseQueryService 取得統一的分頁、查詢、排序功能
 * 實作課程特有的業務邏輯和 CRUD 操作
 * 
 * 主要功能：
 * 1. 課程列表查詢（支援分頁、排序、篩選）
 * 2. 課程新增、修改、刪除
 * 3. 課程詳細資料查詢
 * 4. 模擬資料支援（開發階段使用）
 */
@Injectable({ providedIn: 'root' })
export class CourseService extends BaseQueryService<Course, CourseSearchParams> {
    // BaseQueryService 要求實作的屬性
    protected readonly apiUrl = `${environment.apiBaseUrl}/courses`;
    protected readonly useMockData = false; // 開發階段使用模擬資料，正式環境改為 false
    protected readonly defaultSortColumn = 'courseId'; // 在沒有傳入 sortColumn 時會自動生效。
    protected readonly mockData = MOCK_COURSES;

    // 本地狀態管理
    /**
     * _currentCourse：目前「選中的課程」。一開始沒有（null）。
     * _operationLoading：現在是不是在忙（例如打 API 中）。一開始不是（false）。
     * asReadonly()：給外面看得到、但改不到（避免被亂改）。
     * computed 兩個：
     *  hasCourseSelected：有沒有選到課程？（有就 true）
     *  selectedCourseId：被選到的課程編號（或沒有）
     */
    private readonly _currentCourse = signal<Course | null>(null);
    private readonly _operationLoading = signal<boolean>(false);

    // 公開的狀態（唯讀）
    readonly currentCourse = this._currentCourse.asReadonly();
    readonly operationLoading = this._operationLoading.asReadonly();

    // 計算屬性
    readonly hasCourseSelected = computed(() => this._currentCourse() !== null);
    readonly selectedCourseId = computed(() => this._currentCourse()?.courseId);

    /**
     * 查詢課程列表
     * 
     * 使用父類別的 getPagedData 方法取得分頁資料
     * 
     * @param params 查詢參數（可選）
     * @returns 課程列表回應的 Observable
     */
    searchCourses(params?: CourseSearchParams): Observable<ServiceListResponse<Course>> {
        return this.getPagedData(params);
    }

    /**
     * 取得單一課程詳細資料
     * 
     * @param courseId 課程編號
     * @returns 課程資料的 Observable，找不到時回傳 null
     */
    getCourse(courseId: number): Observable<Course | null> {
        //→ 舉牌子說「我在忙」。
        this._operationLoading.set(true);
        //使用MockData
        if (this.useMockData) {
            const course = this.mockData.find(c => c.courseId === courseId) || null;
            this._currentCourse.set(course);
            this._operationLoading.set(false);
            return of(course).pipe(delay(300));
        }

        return this.http.get<ApiResponse<Course>>(`${this.apiUrl}/find/${courseId}`).pipe(
            //如果後端回來 code === 1000 就把 data 存進 _currentCourse，並且把「在忙」放下來。
            map(response => {
                const course = response.code === 1000 ? response.data || null : null;
                this._currentCourse.set(course);
                this._operationLoading.set(false);
                return course;
            }),
            //如果失敗了，就把「在忙」放下來、把 _currentCourse 清空成 null，再用共用錯誤處理丟出一個好懂的錯誤。
            catchError(error => {
                this._operationLoading.set(false);
                this._currentCourse.set(null);
                return this.httpErrorHandler.handleError<Course | null>('課程詳細資料查詢', null)(error);
            })
        );
        //這個方法會回傳 Observable<Course | null>，也就是「之後會給你課程，或是給你空的」的承諾。
    }

    /**
     * 新增課程
     * 
     * @param data 課程建立資料
     * @returns 新增成功的課程資料 Observable，失敗時回傳 null
     */
    createCourse(data: CourseCreateDto): Observable<Course | null> {
        //舉「在忙」的牌子。
        this._operationLoading.set(true);

        if (this.useMockData) {
            const newCourse: Course = {
                ...data,
                courseId: Math.max(...this.mockData.map(c => c.courseId)) + 1,
                createTime: new Date().toISOString(),
                createUser: 'current-user',
                updateTime: new Date().toISOString(),
                updateUser: 'current-user'
            };
            this.mockData.push(newCourse);
            this._currentCourse.set(newCourse);
            this._operationLoading.set(false);
            return of(newCourse).pipe(delay(500));
        }
        //POST /create 帶著 data 去後端。
        return this.http.post<ApiResponse<Course>>(`${this.apiUrl}/create`, data).pipe(
            //回來 code === 1000 就把新課程存到 _currentCourse。
            map(response => {
                const course = response.code === 1000 ? response.data || null : null;
                if (course) {
                    this._currentCourse.set(course);
                }
                this._operationLoading.set(false);
                return course;
            }),
            //失敗就用 catchError 做統一錯誤處理。
            catchError(error => {
                this._operationLoading.set(false);
                return this.httpErrorHandler.handleError<Course | null>('課程新增', null)(error);
            })
        );
    }

    /**
     * 更新課程
     * 
     * @param data 課程更新資料
     * @returns 更新後的課程資料 Observable，失敗時回傳 null
     */
    updateCourse(data: CourseUpdateDto): Observable<Course | null> {
        this._operationLoading.set(true);

        if (this.useMockData) {
            const index = this.mockData.findIndex(c => c.courseId === data.courseId);
            if (index === -1) {
                this._operationLoading.set(false);
                return of(null);
            }

            const updatedCourse: Course = {
                ...this.mockData[index],
                ...data,
                updateTime: new Date().toISOString(),
                updateUser: 'current-user'
            };
            this.mockData[index] = updatedCourse;
            this._currentCourse.set(updatedCourse);
            this._operationLoading.set(false);
            return of(updatedCourse).pipe(delay(500));
        }

        return this.http.post<ApiResponse<Course>>(`${this.apiUrl}/update`, data).pipe(
            map(response => {
                const course = response.code === 1000 ? response.data || null : null;
                if (course) {
                    this._currentCourse.set(course);
                }
                this._operationLoading.set(false);
                return course;
            }),
            catchError(error => {
                this._operationLoading.set(false);
                return this.httpErrorHandler.handleError<Course | null>('課程更新', null)(error);
            })
        );
    }

    /**
     * 刪除課程
     * 
     * @param courseId 課程編號
     * @returns 刪除結果 Observable，成功為 true，失敗為 false
     */
    deleteCourse(courseId: number): Observable<boolean> {
        this._operationLoading.set(true);

        if (this.useMockData) {
            const index = this.mockData.findIndex(c => c.courseId === courseId);
            if (index !== -1) {
                this.mockData.splice(index, 1);
                if (this._currentCourse()?.courseId === courseId) {
                    this._currentCourse.set(null);
                }
            }
            this._operationLoading.set(false);
            return of(index !== -1).pipe(delay(500));
        }

        return this.http.post<ApiResponse<void>>(`${this.apiUrl}/delete`, { courseId }).pipe(
            map(response => {
                const success = response.code === 1000;
                if (success && this._currentCourse()?.courseId === courseId) {
                    this._currentCourse.set(null);
                }
                this._operationLoading.set(false);
                return success;
            }),
            catchError(error => {
                this._operationLoading.set(false);
                return this.httpErrorHandler.handleError<boolean>('課程刪除', false)(error);
            })
        );
    }

    /**
     * 清空當前選中的課程
     */
    clearCurrentCourse(): void {
        this._currentCourse.set(null);
    }

    /**
     * 實作 BaseQueryService 要求的模擬資料篩選邏輯
     * 
     * 根據查詢參數篩選模擬資料
     * 
     * @param data 原始資料陣列
     * @param params 查詢參數
     * @returns 篩選後的資料陣列
     */
    protected override applyMockFilters(data: Course[], params?: CourseSearchParams): Course[] {
        if (!params) return data;

        return data.filter(course => {
            // 關鍵字搜尋（課程名稱、備註）
            if (params.keyword) {
                const keyword = params.keyword.toLowerCase();
                const matchName = course.courseName.toLowerCase().includes(keyword);
                const matchRemark = course.remark?.toLowerCase().includes(keyword) || false;
                if (!matchName && !matchRemark) return false;
            }

            // 課程編號
            if (params.courseId && course.courseId !== params.courseId) {
                return false;
            }

            // 課程活動編號
            if (params.courseEventId && course.courseEventId !== params.courseEventId) {
                return false;
            }

            // 課程名稱（精確比對）
            if (params.courseName && course.courseName !== params.courseName) {
                return false;
            }

            // 學習方式
            if (params.learningType && course.learningType !== params.learningType) {
                return false;
            }

            // 技能類型
            if (params.skillType && course.skillType !== params.skillType) {
                return false;
            }

            // 課程等級
            if (params.level && course.level !== params.level) {
                return false;
            }

            // 時數範圍
            if (params.hoursFrom && (course.hours || 0) < params.hoursFrom) {
                return false;
            }
            if (params.hoursTo && (course.hours || 0) > params.hoursTo) {
                return false;
            }

            // 啟用狀態
            if (params.isActive !== undefined && course.isActive !== params.isActive) {
                return false;
            }

            // 建立者
            if (params.createUser && course.createUser !== params.createUser) {
                return false;
            }

            // 更新者
            if (params.updateUser && course.updateUser !== params.updateUser) {
                return false;
            }

            return true;
        });
    }

    /**
     * 實作 BaseQueryService 的自訂 API 參數建構
     * 
     * 將前端參數轉換為後端 API 需要的格式
     * 
     * @param params 前端查詢參數
     * @returns 後端 API 參數物件
     */
    protected override buildCustomApiParams(params?: CourseSearchParams): Record<string, any> {
        if (!params) return {};

        const apiParams: Record<string, any> = {};

        // 課程特有的篩選條件
        if (params.courseId) apiParams['courseId'] = params.courseId;
        if (params.courseEventId) apiParams['courseEventId'] = params.courseEventId;
        if (params.courseName) apiParams['courseName'] = params.courseName;
        if (params.learningType) apiParams['learningType'] = params.learningType;
        if (params.skillType) apiParams['skillType'] = params.skillType;
        if (params.level) apiParams['level'] = params.level;
        if (params.hours) apiParams['hours'] = params.hours;
        if (params.remark) apiParams['remark'] = params.remark;
        if (params.createUser) apiParams['createUser'] = params.createUser;
        if (params.updateUser) apiParams['updateUser'] = params.updateUser;
        if (params.createTime) apiParams['createTime'] = params.createTime;
        if (params.updateTime) apiParams['updateTime'] = params.updateTime;

        // 時數範圍
        if (params.hoursFrom) apiParams['hoursFrom'] = params.hoursFrom;
        if (params.hoursTo) apiParams['hoursTo'] = params.hoursTo;

        return apiParams;
    }
}
