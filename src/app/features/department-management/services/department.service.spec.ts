import { TestBed } from '@angular/core/testing';
import { DepartmentService } from './department.service';
import { Department, DepartmentSearchFilters } from '../models/department.model';

describe('DepartmentService', () => {
    let service: DepartmentService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(DepartmentService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should get departments with pagination', (done) => {
        service.getDepartments(1, 5).subscribe(response => {
            expect(response.departments).toBeDefined();
            expect(response.departments.length).toBeLessThanOrEqual(5);
            expect(response.total).toBeGreaterThan(0);
            expect(response.page).toBe(1);
            expect(response.pageSize).toBe(5);
            done();
        });
    });

    it('should filter departments by keyword', (done) => {
        const filters: DepartmentSearchFilters = { keyword: '資訊' };
        service.getDepartments(1, 10, '', filters).subscribe(response => {
            expect(response.departments.every(dept =>
                dept.dept_name.includes('資訊') ||
                dept.dept_code.includes('資訊')
            )).toBeTruthy();
            done();
        });
    });

    it('should get department by id', (done) => {
        service.getDepartmentById(1).subscribe(department => {
            expect(department).toBeDefined();
            expect(department?.dept_id).toBe(1);
            done();
        });
    });

    it('should create new department', (done) => {
        const newDept = {
            dept_code: 'TEST',
            dept_name: '測試部門',
            dept_level: 'C' as const,
            is_active: 1 as const
        };

        service.createDepartment(newDept).subscribe(createdDept => {
            expect(createdDept.dept_code).toBe('TEST');
            expect(createdDept.dept_name).toBe('測試部門');
            expect(createdDept.dept_id).toBeGreaterThan(0);
            done();
        });
    });

    it('should toggle department status', (done) => {
        service.getDepartmentById(1).subscribe(originalDept => {
            if (originalDept) {
                const originalStatus = originalDept.is_active;
                service.toggleDepartmentStatus(1).subscribe(updatedDept => {
                    expect(updatedDept.is_active).toBe(originalStatus === 1 ? 0 : 1);
                    done();
                });
            }
        });
    });

    it('should get root departments only', (done) => {
        service.getRootDepartments().subscribe(rootDepts => {
            expect(rootDepts.every(dept => dept.parent_dept_id === null)).toBeTruthy();
            expect(rootDepts.every(dept => dept.is_active === 1)).toBeTruthy();
            done();
        });
    });
});
