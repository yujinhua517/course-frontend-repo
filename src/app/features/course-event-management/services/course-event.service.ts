import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, delay, forkJoin } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { camelToSnake } from '../../../core/utils/object-case.util';
import {
    CourseEvent,
    CourseEventCreateDto,
    CourseEventUpdateDto,
    CourseEventSearchParams,
    CourseEventListResponse
} from '../models/course-event.model';
import { ApiResponse } from '../../../models/common.model';
import { HttpErrorHandlerService } from '../../../core/services/http-error-handler.service';
import { BaseQueryService } from '../../../core/services/base-query.service';
import { MOCK_COURSE_EVENTS } from './mock-course-events.data';
import { PagerDto } from '../../../models/common.model';
import { UserStore } from '../../../core/auth/user.store';

@Injectable({
    providedIn: 'root'
})
export class CourseEventService extends BaseQueryService<CourseEvent, CourseEventSearchParams> {
    protected override readonly http = inject(HttpClient);
    protected override readonly httpErrorHandler = inject(HttpErrorHandlerService);
    protected override readonly apiUrl = `${environment.apiBaseUrl}/course-events`;
    protected override readonly defaultSortColumn = 'courseEventId';
    protected override readonly mockData: CourseEvent[] = MOCK_COURSE_EVENTS;
    protected override readonly useMockData = false; // 暫時使用 mock data，因為後端沒有 /years 端點
    private userStore = inject(UserStore);

    /**
     * 覆寫排序欄位映射：前端 camelCase -> 後端 snake_case
     * 使用自動轉換方式
     */
    protected override mapSortColumn(frontendColumn: string): string {
        if (!frontendColumn) {
            return this.defaultSortColumn;
        }
        return camelToSnake(frontendColumn);
    }

    /**
     * 建構自訂 API 參數 - 將 keyword 轉換為具體欄位搜尋
     */
    protected override buildCustomApiParams(params?: CourseEventSearchParams): Record<string, any> {
        const customParams: Record<string, any> = {};

        // 處理 keyword 搜尋 - 轉換為具體欄位，不傳送 keyword 本身
        if (params?.keyword) {
            const keyword = params.keyword.trim();
            if (keyword) {
                // 根據關鍵字特性決定搜尋策略
                if (/^\d{4}$/i.test(keyword)) {
                    // 如果是4位數字，搜尋年度
                    customParams['year'] = keyword;
                } else if (/^H[12]$/i.test(keyword)) {
                    // 如果是 H1 或 H2，搜尋學期
                    customParams['semester'] = keyword.toUpperCase();
                } else if (/^\d+$/.test(keyword)) {
                    // 如果是純數字，搜尋 courseEventId
                    customParams['courseEventId'] = parseInt(keyword, 10);
                } else if (/^\d{4}-\d{2}-\d{2}$/.test(keyword)) {
                    // 如果是日期格式 yyyy-mm-dd，搜尋 activationDate
                    customParams['activationDate'] = keyword;
                } else {
                    // 否則搜尋活動標題
                    customParams['activityTitle'] = keyword;
                }
            }
        }

        // 處理其他具體搜尋欄位
        if (params?.courseEventId !== undefined) {
            customParams['courseEventId'] = params.courseEventId;
        }

        if (params?.year) {
            customParams['year'] = params.year;
        }

        if (params?.semester) {
            customParams['semester'] = params.semester;
        }

        if (params?.activityTitle) {
            customParams['activityTitle'] = params.activityTitle;
        }

        if (params?.description) {
            customParams['description'] = params.description;
        }

        return customParams;
    }

    protected override applyMockFilters(data: CourseEvent[], params?: CourseEventSearchParams): CourseEvent[] {
        let filtered = [...data];

        if (params?.year) {
            filtered = filtered.filter(e => e.year === params.year);
        }

        if (params?.semester) {
            filtered = filtered.filter(e => e.semester === params.semester);
        }

        if (params?.isActive !== undefined) {
            const targetStatus = Boolean(params.isActive);
            filtered = filtered.filter(e => Boolean(e.isActive) === targetStatus);
        }

        if (params?.activityTitle) {
            filtered = filtered.filter(e => e.activityTitle.includes(params.activityTitle as string));
        }

        if (params?.description) {
            filtered = filtered.filter(e => e.description?.includes(params.description as string));
        }

        if (params?.keyword) {
            const keyword = params.keyword.toLowerCase();
            filtered = filtered.filter(e =>
                e.activityTitle.toLowerCase().includes(keyword) ||
                e.year.toLowerCase().includes(keyword) ||
                e.semester.toLowerCase().includes(keyword) ||
                (e.description && e.description.toLowerCase().includes(keyword))
            );
        }

        return filtered;
    }

    /**
     * 獲取動態年度列表（從資料庫中實際存在的年度）
     */
    getAvailableYears(): Observable<string[]> {
        // 1. mock 資料
        if (this.useMockData) {
            const uniqueYears = [...new Set(this.mockData.map(event => event.year))];
            return of(uniqueYears.sort()).pipe(delay(200));
        }

        // 2. 真實資料，直接查全部（或適合的頁數），取年度
        return this.getPagedData({ pageSize: 1000 } as CourseEventSearchParams).pipe(
            map(response => {
                if (response.data && response.data.dataList) {
                    const uniqueYears = [
                        ...new Set(response.data.dataList.map((event: CourseEvent) => event.year))
                    ];
                    return uniqueYears.sort();
                }
                return [];
            }),
            catchError(() => of([]))
        );
    }


    /**
     * 根據 ID 取得單一課程活動
     */
    getCourseEventById(id: number): Observable<CourseEvent | null> {
        if (this.useMockData) {
            return of(this.getMockCourseEventById(id)).pipe(delay(300));
        }

        return this.http.get<ApiResponse<CourseEvent>>(`${this.apiUrl}/find/${id}`)
            .pipe(
                map(response => response.data || null),
                catchError(this.httpErrorHandler.handleError('getCourseEventById', null))
            );
    }

    /**
     * 建立新課程活動
     */
    createCourseEvent(courseEventData: CourseEventCreateDto): Observable<CourseEvent | null> {
        console.group('[CourseEventService] createCourseEvent');
        try {
            console.debug('Request payload (original):', courseEventData);
            if (this.useMockData) {
                const mock$ = of(this.createMockCourseEvent(courseEventData)).pipe(delay(600));
                console.debug('Using mock data flow');
                return mock$;
            }

            return this.http.post<ApiResponse<CourseEvent>>(`${this.apiUrl}/create`, courseEventData)
                .pipe(
                    map(response => {
                        console.debug('Create response raw:', response);
                        const data = response.data || null;
                        console.debug('Parsed create data:', data);
                        return data;
                    }),
                    catchError(err => {
                        console.error('Create request error:', err);
                        return this.httpErrorHandler.handleError('createCourseEvent', null)(err);
                    })
                );
        } finally {
            console.groupEnd();
        }
    }

    /**
     * 更新課程活動資料
     */
    updateCourseEvent(id: number, courseEventData: CourseEventUpdateDto): Observable<CourseEvent | null> {
        if (this.useMockData) {
            const mock$ = of(this.updateMockCourseEvent(id, courseEventData)).pipe(delay(600));
            console.debug('Using mock data flow');
            return mock$;
        }

        // 若前端附帶 updateUser，後端可能期望 snake_case: update_user
        const payload: any = {
            ...courseEventData,
            courseEventId: id
        };
        if ((courseEventData as any).updateUser && !(courseEventData as any).update_user) {
            payload.update_user = (courseEventData as any).updateUser;
        }
        // console.debug('Final update payload sent to API:', payload);

        return this.http.post<ApiResponse<CourseEvent>>(`${this.apiUrl}/update`, payload)
            .pipe(
                map(response => {
                    // console.debug('Update response raw:', response);
                    const data = response.data || null;
                    // console.debug('Parsed update data:', data);
                    return data;
                }),
                catchError(err => {
                    console.error('Update request error:', err);
                    return this.httpErrorHandler.handleError('updateCourseEvent', null)(err);
                })
            );
    }

    /**
     * 刪除課程活動
     */
    deleteCourseEvent(id: number): Observable<boolean> {
        if (this.useMockData) {
            return of(true).pipe(delay(400));
        }

        return this.http.post<ApiResponse<void>>(`${this.apiUrl}/delete`, { courseEventId: id })
            .pipe(
                map(response => response.code === 1000),
                catchError(this.httpErrorHandler.handleError('deleteCourseEvent', false))
            );
    }

    /**
     * 批量刪除課程活動 (後端目前無此 API，使用逐一刪除方式)
     */
    bulkDeleteCourseEvents(ids: number[]): Observable<boolean> {
        if (this.useMockData) {
            return of(true).pipe(delay(800));
        }

        // 由於後端目前沒有 bulk-delete API，使用逐一刪除方式
        const deleteRequests = ids.map(id =>
            this.http.post<ApiResponse<void>>(`${this.apiUrl}/delete`, { courseEventId: id })
                .pipe(
                    map(response => response.code === 1000),
                    catchError(() => of(false))
                )
        );

        return forkJoin(deleteRequests).pipe(
            map((results: boolean[]) => results.every(result => result === true)),
            catchError(this.httpErrorHandler.handleError('bulkDeleteCourseEvents', false))
        );
    }

    /**
     * 切換課程活動啟用狀態 (後端目前無此 API，使用更新方式)
     */
    toggleActiveStatus(id: number): Observable<CourseEvent | null> {
        if (this.useMockData) {
            return of(this.toggleMockCourseEventStatus(id)).pipe(delay(500));
        }

        // 先獲取當前資料，然後更新狀態
        return this.getCourseEventById(id).pipe(
            switchMap((courseEvent: CourseEvent | null) => {
                if (!courseEvent) {
                    throw new Error('Course event not found');
                }

                const updateDto = {
                    courseEventId: id,
                    year: courseEvent.year,
                    semester: courseEvent.semester,
                    activityTitle: courseEvent.activityTitle,
                    description: courseEvent.description,
                    expectedCompletionDate: courseEvent.expectedCompletionDate,
                    submissionDeadline: courseEvent.submissionDeadline,
                    activationDate: courseEvent.activationDate,
                    isActive: !courseEvent.isActive,
                    updateUser: this.userStore.user()?.username
                };

                return this.http.post<ApiResponse<CourseEvent>>(`${this.apiUrl}/update`, updateDto)
                    .pipe(
                        map(response => response.data || null),
                        catchError(this.httpErrorHandler.handleError('toggleActiveStatus', null))
                    );
            })
        );
    }

    // Mock 資料處理方法
    private getMockCourseEventById(id: number): CourseEvent | null {
        return this.mockData.find((event: CourseEvent) => event.courseEventId === id) || null;
    }

    private createMockCourseEvent(courseEventData: CourseEventCreateDto): CourseEvent {
        const newId = Math.max(...this.mockData.map((e: CourseEvent) => e.courseEventId || 0)) + 1;
        const now = new Date().toISOString();

        return {
            courseEventId: newId,
            year: courseEventData.year,
            semester: courseEventData.semester,
            activityTitle: courseEventData.activityTitle,
            description: courseEventData.description,
            expectedCompletionDate: courseEventData.expectedCompletionDate,
            submissionDeadline: courseEventData.submissionDeadline,
            activationDate: courseEventData.activationDate,
            isActive: courseEventData.isActive ?? true,
            createTime: now,
            createUser: 'current_user',
            updateTime: now,
            updateUser: 'current_user'
        };
    }

    private updateMockCourseEvent(id: number, courseEventData: CourseEventUpdateDto): CourseEvent {
        const existing = this.getMockCourseEventById(id);
        if (!existing) {
            throw new Error('Course event not found');
        }

        return {
            ...existing,
            year: courseEventData.year ?? existing.year,
            semester: courseEventData.semester ?? existing.semester,
            activityTitle: courseEventData.activityTitle ?? existing.activityTitle,
            description: courseEventData.description ?? existing.description,
            expectedCompletionDate: courseEventData.expectedCompletionDate ?? existing.expectedCompletionDate,
            submissionDeadline: courseEventData.submissionDeadline ?? existing.submissionDeadline,
            activationDate: courseEventData.activationDate ?? existing.activationDate,
            isActive: courseEventData.isActive ?? existing.isActive,
            updateTime: new Date().toISOString(),
            updateUser: 'current_user'
        };
    }

    private toggleMockCourseEventStatus(id: number): CourseEvent | null {
        const existing = this.getMockCourseEventById(id);
        if (!existing) {
            return null;
        }

        return {
            ...existing,
            isActive: !existing.isActive,
            updateTime: new Date().toISOString(),
            updateUser: 'current_user'
        };
    }
}
