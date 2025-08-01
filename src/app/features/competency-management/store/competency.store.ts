import { Injectable, signal, computed } from '@angular/core';
import { CompetencyService } from '../services/competency.service';
import { Competency, CompetencySearchParams } from '../models/competency.model';

@Injectable({
    providedIn: 'root'
})
export class CompetencyStore {
    // State signals
    private _competencies = signal<Competency[]>([]);
    private _loading = signal<boolean>(false);
    private _error = signal<string | null>(null);
    private _total = signal<number>(0);
    private _currentPage = signal<number>(1);
    private _pageSize = signal<number>(10);
    private _searchParams = signal<CompetencySearchParams>({});

    // Public readonly signals
    competencies = this._competencies.asReadonly();
    loading = this._loading.asReadonly();
    error = this._error.asReadonly();
    total = this._total.asReadonly();
    currentPage = this._currentPage.asReadonly();
    pageSize = this._pageSize.asReadonly();
    searchParams = this._searchParams.asReadonly();

    // Computed signals
    totalPages = computed(() => Math.ceil(this._total() / this._pageSize()));
    hasNextPage = computed(() => this._currentPage() < this.totalPages());
    hasPreviousPage = computed(() => this._currentPage() > 1);

    constructor(private competencyService: CompetencyService) { }

    loadCompetencies(params?: CompetencySearchParams): void {
        this._loading.set(true);
        this._error.set(null);

        const searchParams = {
            ...this._searchParams(),
            ...params,
            page: (params?.page !== undefined) ? params.page : this._currentPage() - 1, // 轉換為 0-based
            pageSize: params?.pageSize || this._pageSize()
        };

        this._searchParams.set(searchParams);

        this.competencyService.getCompetencies(searchParams).subscribe({
            next: (response) => {
                this._competencies.set(response.data.data_list);
                this._total.set(response.data.total_records);
                this._currentPage.set((response.data.page || 0) + 1); // 轉換回 1-based 顯示
                this._pageSize.set(response.data.size || 10);
                this._loading.set(false);
            },
            error: (error) => {
                this._error.set('載入職能資料失敗');
                this._loading.set(false);
                console.error('Error loading competencies:', error);
            }
        });
    }

    searchCompetencies(keyword: string): void {
        this.loadCompetencies({
            ...this._searchParams(),
            keyword,
            page: 0 // 重設為第一頁 (0-based)
        });
    }

    filterByStatus(is_active?: boolean): void {
        this.loadCompetencies({
            ...this._searchParams(),
            is_active,
            page: 0 // 重設為第一頁 (0-based)
        });
    }

    sortCompetencies(sortBy: keyof Competency, sortDirection: 'asc' | 'desc'): void {
        this.loadCompetencies({
            ...this._searchParams(),
            sortBy,
            sort_direction: sortDirection
        });
    }

    goToPage(page: number): void {
        if (page >= 1 && page <= this.totalPages()) {
            this.loadCompetencies({
                ...this._searchParams(),
                page: page - 1 // 轉換為 0-based
            });
        }
    }

    setPageSize(pageSize: number): void {
        this.loadCompetencies({
            ...this._searchParams(),
            pageSize,
            page: 0 // 重設為第一頁 (0-based)
        });
    }

    addCompetency(competency: Competency): void {
        const current = this._competencies();
        this._competencies.set([competency, ...current]);
        this._total.set(this._total() + 1);
    }

    updateCompetency(updatedCompetency: Competency): void {
        const competencies = this._competencies();
        const index = competencies.findIndex(c => c.job_role_code === updatedCompetency.job_role_code);

        if (index !== -1) {
            const updated = [...competencies];
            updated[index] = updatedCompetency;
            this._competencies.set(updated);
        }
    }

    removeCompetency(code: string): void {
        const filtered = this._competencies().filter(c => c.job_role_code !== code);
        this._competencies.set(filtered);
        this._total.set(this._total() - 1);
    }

    toggleCompetencyStatus(code: string): void {
        const competencies = this._competencies();
        const index = competencies.findIndex(c => c.job_role_code === code);

        if (index !== -1) {
            const updated = [...competencies];
            updated[index] = {
                ...updated[index],
                is_active: !updated[index].is_active,
                update_time: new Date().toISOString(),
                update_user: 'current_user'
            };
            this._competencies.set(updated);
        }
    }

    clearError(): void {
        this._error.set(null);
    }

    reset(): void {
        this._competencies.set([]);
        this._total.set(0);
        this._currentPage.set(1);
        this._searchParams.set({});
        this._error.set(null);
        this._loading.set(false);
    }
}
