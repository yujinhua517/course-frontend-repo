import { Injectable, signal, computed, inject } from '@angular/core';
import { CourseEventService } from '../services/course-event.service';
import { CourseEvent, CourseEventSearchParams } from '../models/course-event.model';

@Injectable({
    providedIn: 'root'
})
export class CourseEventStore {
    private readonly courseEventService = inject(CourseEventService);

    // State signals
    private readonly _courseEvents = signal<CourseEvent[]>([]);
    private readonly _loading = signal<boolean>(false);
    private readonly _error = signal<string | null>(null);
    private readonly _total = signal<number>(0);
    private readonly _currentPage = signal<number>(1);
    private readonly _pageSize = signal<number>(10);
    private readonly _searchParams = signal<CourseEventSearchParams>({});

    // Public readonly signals
    courseEvents = this._courseEvents.asReadonly();
    loading = this._loading.asReadonly();
    error = this._error.asReadonly();
    total = this._total.asReadonly();
    currentPage = this._currentPage.asReadonly();
    pageSize = this._pageSize.asReadonly();
    searchParams = this._searchParams.asReadonly();

    // Computed signals
    readonly totalPages = computed(() => Math.ceil(this._total() / this._pageSize()));
    readonly hasNextPage = computed(() => this._currentPage() < this.totalPages());
    readonly hasPreviousPage = computed(() => this._currentPage() > 1);

    loadCourseEvents(params?: CourseEventSearchParams): void {
        this._loading.set(true);
        this._error.set(null);

        const searchParams = {
            ...this._searchParams(),
            ...params,
            page: params?.page || this._currentPage(),
            pageSize: this._pageSize(),
            pageable: true
        };

        // 只有當明確傳入時才覆蓋，避免清除現有的搜尋條件
        if (params?.keyword !== undefined) {
            searchParams.keyword = params.keyword;
        }
        if (params?.isActive !== undefined) {
            searchParams.isActive = params.isActive;
        }

        this._searchParams.set(searchParams);

        // 使用 BaseQueryService 的統一查詢方法，依賴 interceptor 自動轉換
        this.courseEventService.getPagedData(searchParams).subscribe({
            next: (response) => {
                this._courseEvents.set(response.data.dataList);
                this._total.set(response.data.totalRecords);
                this._currentPage.set(params?.page || this._currentPage());
                this._loading.set(false);
            },
            error: (error) => {
                this._error.set('載入課程活動資料失敗');
                this._loading.set(false);
            }
        });
    }

    searchCourseEvents(keyword: string): void {
        this.loadCourseEvents({
            ...this._searchParams(),
            keyword,
            page: 1
        });
    }

    filterByYear(year?: string): void {
        this.loadCourseEvents({
            ...this._searchParams(),
            year: year,
            page: 1
        });
    }

    filterBySemester(semester?: string): void {
        this.loadCourseEvents({
            ...this._searchParams(),
            semester: semester,
            page: 1
        });
    }

    filterByStatus(isActive?: boolean): void {
        this.loadCourseEvents({
            ...this._searchParams(),
            isActive,
            page: 1
        });
    }

    sortCourseEvents(sortColumn: keyof CourseEvent, sortDirection: 'asc' | 'desc'): void {
        this.loadCourseEvents({
            ...this._searchParams(),
            sortColumn: sortColumn as string,
            sortDirection: sortDirection.toUpperCase()
        });
    }

    goToPage(page: number): void {
        if (page >= 1 && page <= this.totalPages()) {
            this.loadCourseEvents({
                ...this._searchParams(),
                page
            });
        }
    }

    setPageSize(pageSize: number): void {
        this._pageSize.set(pageSize);
        this.loadCourseEvents({
            ...this._searchParams(),
            page: 1,
            pageSize
        });
    }

    addCourseEvent(courseEvent: CourseEvent): void {
        const current = this._courseEvents();
        this._courseEvents.set([courseEvent, ...current]);
        this._total.set(this._total() + 1);
    }

    updateCourseEvent(updatedCourseEvent: CourseEvent): void {
        const courseEvents = this._courseEvents();
        const index = courseEvents.findIndex((e: CourseEvent) => e.courseEventId === updatedCourseEvent.courseEventId);

        if (index !== -1) {
            const updated = [...courseEvents];
            updated[index] = updatedCourseEvent;
            this._courseEvents.set(updated);
        }
    }

    removeCourseEvent(id: number): void {
        const filtered = this._courseEvents().filter((e: CourseEvent) => e.courseEventId !== id);
        this._courseEvents.set(filtered);
        this._total.set(this._total() - 1);
    }

    toggleCourseEventStatus(id: number): void {
        const courseEvents = this._courseEvents();
        const index = courseEvents.findIndex((e: CourseEvent) => e.courseEventId === id);

        if (index !== -1) {
            const updated = [...courseEvents];
            updated[index] = {
                ...updated[index],
                isActive: !updated[index].isActive,
                updateTime: new Date().toISOString(),
                updateUser: 'current_user'
            };
            this._courseEvents.set(updated);
        }
    }

    clearError(): void {
        this._error.set(null);
    }

    reset(): void {
        this._courseEvents.set([]);
        this._total.set(0);
        this._currentPage.set(1);
        this._searchParams.set({});
        this._error.set(null);
        this._loading.set(false);
    }
}
