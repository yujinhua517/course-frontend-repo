import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CompetencyListComponent } from './competency-list.component';
import { CompetencyStore } from '../../store/competency.store';
import { CompetencyService } from '../../services/competency.service';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { of } from 'rxjs';

describe('CompetencyListComponent', () => {
    let component: CompetencyListComponent;
    let fixture: ComponentFixture<CompetencyListComponent>;
    let mockCompetencyStore: jasmine.SpyObj<CompetencyStore>;
    let mockCompetencyService: jasmine.SpyObj<CompetencyService>;

    const mockCompetencies = [
        {
            job_role_code: 'DEV001',
            job_role_name: '前端開發工程師',
            description: '負責前端開發',
            is_active: 1,
            create_time: new Date(),
            create_user: 'admin',
            update_time: new Date(),
            update_user: 'admin'
        }
    ];

    beforeEach(async () => {
        const storeSpy = jasmine.createSpyObj('CompetencyStore', [
            'loadCompetencies',
            'searchCompetencies',
            'filterByStatus',
            'sortCompetencies',
            'goToPage',
            'setPageSize',
            'addCompetency',
            'updateCompetency',
            'removeCompetency'
        ], {
            competencies: signal(mockCompetencies),
            loading: signal(false),
            error: signal(null),
            total: signal(1),
            currentPage: signal(1),
            pageSize: signal(10),
            totalPages: signal(1),
            hasNextPage: signal(false),
            hasPreviousPage: signal(false)
        });

        const serviceSpy = jasmine.createSpyObj('CompetencyService', [
            'deleteCompetency',
            'toggleActiveStatus'
        ]);

        await TestBed.configureTestingModule({
            imports: [CompetencyListComponent],
            providers: [
                { provide: CompetencyStore, useValue: storeSpy },
                { provide: CompetencyService, useValue: serviceSpy },
                provideRouter([])
            ]
        }).compileComponents();

        mockCompetencyStore = TestBed.inject(CompetencyStore) as jasmine.SpyObj<CompetencyStore>;
        mockCompetencyService = TestBed.inject(CompetencyService) as jasmine.SpyObj<CompetencyService>;

        fixture = TestBed.createComponent(CompetencyListComponent);
        component = fixture.componentInstance;
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should load competencies on init', () => {
        component.ngOnInit();
        expect(mockCompetencyStore.loadCompetencies).toHaveBeenCalled();
    });

    it('should search competencies', () => {
        component.searchKeyword.set('前端');
        component.onSearch();
        expect(mockCompetencyStore.searchCompetencies).toHaveBeenCalledWith('前端');
    });

    it('should filter by status', () => {
        component.onFilterByStatus(1);
        expect(component.statusFilter()).toBe(1);
        expect(mockCompetencyStore.filterByStatus).toHaveBeenCalledWith(1);
    });

    it('should sort competencies', () => {
        component.onSort('job_role_name');
        expect(component.sortBy()).toBe('job_role_name');
        expect(component.sortDirection()).toBe('asc');
        expect(mockCompetencyStore.sortCompetencies).toHaveBeenCalledWith('job_role_name', 'asc');
    });

    it('should toggle sort direction when clicking same column', () => {
        component.sortBy.set('job_role_name');
        component.sortDirection.set('asc');

        component.onSort('job_role_name');
        expect(component.sortDirection()).toBe('desc');
    });

    it('should change page', () => {
        component.onPageChange(2);
        expect(mockCompetencyStore.goToPage).toHaveBeenCalledWith(2);
    });

    it('should delete competency when confirmed', () => {
        spyOn(window, 'confirm').and.returnValue(true);
        spyOn(window, 'alert');
        mockCompetencyService.deleteCompetency.and.returnValue(of(true));

        component.onDelete(mockCompetencies[0]);

        expect(window.confirm).toHaveBeenCalled();
        expect(mockCompetencyService.deleteCompetency).toHaveBeenCalledWith('DEV001');
        expect(mockCompetencyStore.removeCompetency).toHaveBeenCalledWith('DEV001');
    });

    it('should toggle status', () => {
        const updatedCompetency = { ...mockCompetencies[0], is_active: 0 };
        mockCompetencyService.toggleActiveStatus.and.returnValue(of(updatedCompetency));

        component.onToggleStatus(mockCompetencies[0]);

        expect(mockCompetencyService.toggleActiveStatus).toHaveBeenCalledWith('DEV001');
        expect(mockCompetencyStore.updateCompetency).toHaveBeenCalledWith(updatedCompetency);
    });

    it('should show form for create', () => {
        component.onCreateNew();
        expect(component.showForm()).toBeTruthy();
        expect(component.formMode()).toBe('create');
        expect(component.selectedCompetency()).toBeNull();
    });

    it('should show form for edit', () => {
        component.onEdit(mockCompetencies[0]);
        expect(component.showForm()).toBeTruthy();
        expect(component.formMode()).toBe('edit');
        expect(component.selectedCompetency()).toBe(mockCompetencies[0]);
    });

    it('should show view dialog', () => {
        component.onView(mockCompetencies[0]);
        expect(component.showView()).toBeTruthy();
        expect(component.selectedCompetency()).toBe(mockCompetencies[0]);
    });
});
