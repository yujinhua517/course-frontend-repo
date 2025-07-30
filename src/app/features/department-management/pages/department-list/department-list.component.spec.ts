import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DepartmentListComponent } from './department-list.component';
import { DepartmentService } from '../../services/department.service';
import { DepartmentStore } from '../../store/department.store';
import { of } from 'rxjs';
import { Department } from '../../models/department.model';

describe('DepartmentListComponent', () => {
    let component: DepartmentListComponent;
    let fixture: ComponentFixture<DepartmentListComponent>;
    let mockDepartmentService: jasmine.SpyObj<DepartmentService>;
    let mockDepartmentStore: jasmine.SpyObj<DepartmentStore>;

    const mockDepartments: Department[] = [
        {
            dept_id: 1,
            dept_code: 'IT',
            dept_name: '資訊技術部',
            dept_level: 'BU',
            parent_dept_id: null,
            manager_emp_id: 101,
            is_active: true,
            create_time: new Date('2024-01-15'),
            create_user: 'admin',
            update_time: new Date('2024-06-10'),
            update_user: 'admin'
        },
        {
            dept_id: 2,
            dept_code: 'HR',
            dept_name: '人力資源部',
            dept_level: 'BU',
            parent_dept_id: null,
            manager_emp_id: 102,
            is_active: true,
            create_time: new Date('2024-01-15'),
            create_user: 'admin',
            update_time: new Date('2024-05-20'),
            update_user: 'hr_admin'
        }
    ];

    beforeEach(async () => {
        const departmentServiceSpy = jasmine.createSpyObj('DepartmentService', [
            'getDepartments', 'getDepartmentById', 'createDepartment',
            'updateDepartment', 'deleteDepartment', 'toggleDepartmentStatus'
        ]);

        // signals mock
        const departmentsSignal = () => mockDepartments;
        const loadingSignal = () => false;
        const errorSignal = () => null;
        const totalSignal = () => mockDepartments.length;
        const allTotalSignal = () => mockDepartments.length;
        const currentPageSignal = () => 1;
        const pageSizeSignal = () => 10;
        const totalPagesSignal = () => 1;
        const hasNextPageSignal = () => false;
        const hasPreviousPageSignal = () => false;

        const departmentStoreSpy = jasmine.createSpyObj('DepartmentStore', [
            'loadDepartments', 'setPage', 'setPageSize', 'setFilters',
            'selectDepartment', 'clearSelection'
        ], {
            departments: departmentsSignal,
            loading: loadingSignal,
            error: errorSignal,
            total: totalSignal,
            allTotal: allTotalSignal,
            currentPage: currentPageSignal,
            pageSize: pageSizeSignal,
            totalPages: totalPagesSignal,
            hasNextPage: hasNextPageSignal,
            hasPreviousPage: hasPreviousPageSignal
        });

        await TestBed.configureTestingModule({
            imports: [DepartmentListComponent],
            providers: [
                { provide: DepartmentService, useValue: departmentServiceSpy },
                { provide: DepartmentStore, useValue: departmentStoreSpy }
            ]
        }).compileComponents();

        mockDepartmentService = TestBed.inject(DepartmentService) as jasmine.SpyObj<DepartmentService>;
        mockDepartmentStore = TestBed.inject(DepartmentStore) as jasmine.SpyObj<DepartmentStore>;

        fixture = TestBed.createComponent(DepartmentListComponent);
        component = fixture.componentInstance;
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should initialize with default values', () => {
        expect(component.searchKeyword()).toBe('');
        expect(component.activeFilter()).toBeUndefined();
        expect(component.pageSize()).toBe(10);
    });

    it('should load departments on init', () => {
        component.ngOnInit();
        expect(mockDepartmentStore.loadDepartments).toHaveBeenCalled();
    });

    it('should handle search functionality', () => {
        component.searchKeyword.set('IT');
        component.onSearch();
        expect(mockDepartmentStore.loadDepartments).toHaveBeenCalled();
    });

    it('should clear search', () => {
        component.searchKeyword.set('test');
        component.clearSearch();
        expect(component.searchKeyword()).toBe('');
        expect(mockDepartmentStore.loadDepartments).toHaveBeenCalled();
    });

    it('should filter by active state', () => {
        component.onFilterByActive(true);
        expect(mockDepartmentStore.loadDepartments).toHaveBeenCalled();
    });

    it('should change page size', () => {
        // 模擬 select change 事件
        const event = { target: { value: '20' } } as unknown as Event;
        component.onPageSizeChange(event);
        expect(mockDepartmentStore.loadDepartments).toHaveBeenCalled();
    });

    it('should handle page change', () => {
        component.onPageChange(2);
        expect(mockDepartmentStore.loadDepartments).toHaveBeenCalled();
    });

    // 省略 sortField/sortDirection/showFormModal/editingDepartment 等不存在的屬性測試

    it('should delete department with confirmation', () => {
        const department = mockDepartments[0];
        mockDepartmentService.deleteDepartment.and.returnValue(of(true));
        spyOn(window, 'confirm').and.returnValue(true);

        component.onDelete(department);
        expect(window.confirm).toHaveBeenCalled();
        expect(mockDepartmentService.deleteDepartment).toHaveBeenCalledWith(department.dept_id);
    });

    it('should not delete department when not confirmed', () => {
        const department = mockDepartments[0];
        spyOn(window, 'confirm').and.returnValue(false);

        component.onDelete(department);
        expect(window.confirm).toHaveBeenCalled();
        expect(mockDepartmentService.deleteDepartment).not.toHaveBeenCalled();
    });
});
