import { TestBed } from '@angular/core/testing';
import { EmployeeService } from './employee.service';
import { Employee, EmployeeCreateDto, EmployeeUpdateDto } from '../models/employee.model';

describe('EmployeeService', () => {
    let service: EmployeeService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(EmployeeService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should return employees list', (done) => {
        service.getEmployees().subscribe(response => {
            expect(response).toBeTruthy();
            expect(response.data).toBeInstanceOf(Array);
            expect(response.data.length).toBeGreaterThan(0);
            expect(response.total).toBeGreaterThan(0);
            done();
        });
    });

    it('should filter employees by keyword', (done) => {
        const params = { keyword: '王小明' };
        service.getEmployees(params).subscribe(response => {
            expect(response.data.length).toBeGreaterThan(0);
            const foundEmployee = response.data.find(emp => emp.emp_name.includes('王小明'));
            expect(foundEmployee).toBeTruthy();
            done();
        });
    });

    it('should filter employees by active status', (done) => {
        const params = { is_active: 1 as const };
        service.getEmployees(params).subscribe(response => {
            const allActive = response.data.every(emp => emp.is_active === 1);
            expect(allActive).toBeTruthy();
            done();
        });
    });

    it('should get employee by id', (done) => {
        service.getEmployeeById(1).subscribe(employee => {
            expect(employee).toBeTruthy();
            expect(employee?.emp_id).toBe(1);
            done();
        });
    });

    it('should create new employee', (done) => {
        const newEmployee: EmployeeCreateDto = {
            emp_code: 'EMP999',
            emp_name: '測試員工',
            emp_email: 'test@company.com',
            dept_id: 1,
            is_active: 1
        };

        service.createEmployee(newEmployee).subscribe(created => {
            expect(created).toBeTruthy();
            expect(created.emp_code).toBe('EMP999');
            expect(created.emp_name).toBe('測試員工');
            done();
        });
    });

    it('should update employee', (done) => {
        const updateData: EmployeeUpdateDto = {
            emp_id: 1,
            emp_code: 'EMP001',
            emp_name: '王小明（更新）',
            emp_email: 'updated@company.com',
            dept_id: 1,
            is_active: 1
        };

        service.updateEmployee(1, updateData).subscribe(updated => {
            expect(updated).toBeTruthy();
            expect(updated.emp_name).toBe('王小明（更新）');
            done();
        });
    });

    it('should delete employee', (done) => {
        service.deleteEmployee(1).subscribe(result => {
            expect(result).toBeTruthy();
            done();
        });
    });

    it('should toggle employee active status', (done) => {
        service.getEmployeeById(1).subscribe(originalEmployee => {
            if (originalEmployee) {
                const originalStatus = originalEmployee.is_active;
                service.toggleActiveStatus(1).subscribe(toggledEmployee => {
                    expect(toggledEmployee).toBeTruthy();
                    expect(toggledEmployee?.is_active).toBe(originalStatus === 1 ? 0 : 1);
                    done();
                });
            }
        });
    });
});
