import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { HttpErrorHandlerService } from '../../../core/services/http-error-handler.service';
import { Observable, of, map, delay, catchError, switchMap, forkJoin } from 'rxjs';
import { ApiResponse } from '../../../models/common.model';
import { BaseQueryService } from '../../../core/services/base-query.service';
import { environment } from '../../../../environments/environment';
import { UserStore } from '../../../core/auth/user.store';
import { MOCK_COURSES } from './mock-courses.data';
import { Course, CourseSearchParams, CourseCreateDto, CourseUpdateDto } from '../models/course.model';

@Injectable({ providedIn: 'root' })
export class CourseService extends BaseQueryService<Course, CourseSearchParams> {
    private userStore = inject(UserStore);

    protected readonly apiUrl = `${environment.apiBaseUrl}/courses`;
    protected readonly useMockData = false;
    protected readonly defaultSortColumn = 'courseId';
    protected readonly mockData: Course[] = MOCK_COURSES;

    protected override readonly http = inject(HttpClient);
    protected override readonly httpErrorHandler = inject(HttpErrorHandlerService);

    // signals 狀態管理
    /**
     * 建立一個 Signal 來存目前的課程清單。
     * 先用 mockData 當初始值（即使 useMockData = false，這裡也只是初始 state）。
     */
    private readonly courseSignal = signal<Course[]>(this.mockData);
    /**
     * 對外只暴露唯讀的 signal，避免外部直接改 state。
     * 其他組件可以 this.courseService.courses() 讀取最新值。
     */
    public readonly courses = this.courseSignal.asReadonly();

    // 覆寫自訂搜尋參數（如有需要）
    protected override buildCustomApiParams(params?: CourseSearchParams): Record<string, any> {
        const customParams: Record<string, any> = {};
        // TODO: 依需求轉換查詢參數
        // if (params?.keyword) {
        //     customParams['courseName'] = params.keyword;
        // }
        return customParams;
    }

    // 取得單筆資料
    // 依 Id 取單筆（回傳乾淨資料）
    getCourseById(id: number): Observable<Course | null> {
        if (this.useMockData) {
            const found = this.mockData.find(c => c.courseId === id) ?? null;
            return of(found).pipe(delay(300));
        }
        return this.http.get<ApiResponse<Course>>(`${this.apiUrl}/find/${id}`).pipe(
            map(res => {
                if (res.code !== 1000) throw new Error(res.message || '查詢課程失敗');
                return res.data ?? null;
            }),
            // ✅ 泛型 + fallback（null）
            catchError(this.httpErrorHandler.handleError<Course | null>('課程詳細資料查詢', null))
        );
    }

    // 建立資料（如有需要）
    createCourse(courseData: Partial<Course>): Observable<ApiResponse<Course>> {
        if (this.useMockData) {
            const created = this.createMockCourse(courseData as any);
            return of({
                code: created ? 1000 : -1,
                message: created ? 'success' : 'mock create failed',
                data: created ?? undefined
            }).pipe(delay(600));
        }
        return this.http.post<ApiResponse<Course>>(
            `${this.apiUrl}/create`,
            courseData
        ).pipe(
            catchError(err => {
                console.error('Create request error:', err);
                return of({
                    code: -1,
                    message: 'API 請求失敗',
                    data: undefined
                });
            })
        );
    }


    // 更新資料（如有需要）
    updateCourse(courseData: Course): Observable<ApiResponse<Course>> {
        if (this.useMockData) {
            const updated = this.updateMockCourse(courseData as any);
            return of({
                code: updated ? 1000 : -1,
                message: updated ? 'success' : 'mock update failed',
                data: updated ?? undefined
            }).pipe(delay(600));
        }
        return this.http.post<ApiResponse<Course>>(
            `${this.apiUrl}/update`,
            courseData
        ).pipe(
            catchError(err => {
                console.error('Update request error:', err);
                return of({
                    code: -1,
                    message: 'API 請求失敗',
                    data: undefined
                });
            })
        );
    }

    // 刪除資料（如有需要）
    deleteCourse(id: number): Observable<ApiResponse<void>> {
        if (this.useMockData) {
            const deleted = this.deleteMockCourse(id);
            return of({
                code: deleted ? 1000 : -1,
                message: deleted ? 'success' : 'mock delete failed',
                data: undefined
            }).pipe(delay(600));
        }
        return this.http.post<ApiResponse<void>>(
            `${this.apiUrl}/delete`,
            { courseId: id }
        ).pipe(
            catchError(err => {
                console.error('Delete request error:', err);
                return of({
                    code: -1,
                    message: 'API 請求失敗',
                    data: undefined
                });
            })
        );
    }

    // 取得所有課程（不分頁）
    getAllCourses(): Observable<Course[]> {
        if (this.useMockData) {
            return of(this.mockData).pipe(delay(300));
        }
        return this.http.get<ApiResponse<Course[]>>(`${this.apiUrl}`).pipe(
            map(res => {
                if (res.code !== 1000) throw new Error(res.message || '取得課程清單失敗');
                return res.data ?? [];
            }),
            // 泛型 + fallback（空陣列）：不中斷資料流
            catchError(this.httpErrorHandler.handleError<Course[]>('取得課程清單', []))
        );
    }


    /**
     * 實作Mock資料篩選邏輯
    */
    protected override applyMockFilters(data: Course[], params?: CourseSearchParams): Course[] {
        let filtered = [...data];

        // 關鍵字搜尋
        if (params?.keyword) {
            const keyword = params.keyword.toLowerCase();
            filtered = filtered.filter(course =>
                course.courseName.toLowerCase().includes(keyword) ||
                course.courseName.toLowerCase().includes(keyword)
            );
        }

        // 啟用狀態篩選
        if (params?.isActive !== undefined) {
            filtered = filtered.filter(dept => dept.isActive === params.isActive);
        }

        // learningType篩選
        if (params?.learningType) {
            filtered = filtered.filter(course => course.learningType === params.learningType);
        }

        // skillType篩選
        if (params?.skillType !== undefined) {
            filtered = filtered.filter(course => course.skillType === params.skillType);
        }

        // level篩選
        if (params?.level !== undefined) {
            filtered = filtered.filter(course => course.level === params.level);
        }

        return filtered;
    }

    // Mock 資料處理方法
    private getMockCourseById(id: number): Course | null {
        return this.mockData.find((course: Course) => course.courseId === id) || null;
    }

    private createMockCourse(courseData: CourseCreateDto): Course {
        const newId = Math.max(...this.mockData.map((e: Course) => e.courseId || 0)) + 1;
        const now = new Date().toISOString();

        return {
            courseId: newId,
            courseEventId: courseData.courseEventId,
            courseName: courseData.courseName,
            learningType: courseData.learningType,
            skillType: courseData.skillType,
            level: courseData.level,
            hours: courseData.hours,
            isActive: true,
            remark: courseData.remark,
            createTime: now,
            createUser: "admin",
            updateTime: now,
            updateUser: "admin"
        };
    }

    private updateMockCourse(courseData: CourseUpdateDto): Course {
        const existing = this.getMockCourseById(courseData.courseId);
        if (!existing) {
            throw new Error('Course not found');
        }
        return {
            ...existing,
            courseEventId: courseData.courseEventId ?? existing.courseEventId,
            courseName: courseData.courseName ?? existing.courseName,
            learningType: courseData.learningType ?? existing.learningType,
            skillType: courseData.skillType ?? existing.skillType,
            level: courseData.level ?? existing.level,
            hours: courseData.hours ?? existing.hours,
            isActive: courseData.isActive ?? existing.isActive,
            remark: courseData.remark ?? existing.remark,
            updateTime: new Date().toISOString(),
            updateUser: 'current_user',
        };
    }

    private deleteMockCourse(id: number): boolean {
        const index = this.mockData.findIndex(course => course.courseId === id);
        if (index !== -1) {
            this.mockData.splice(index, 1);
            return true;
        }
        return false;
    }
}