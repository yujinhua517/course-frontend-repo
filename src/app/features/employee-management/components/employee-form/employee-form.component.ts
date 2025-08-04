import { Component, OnInit, input, output, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { EmployeeService } from '../../services/employee.service';
import { BaseModalComponent, ModalConfig } from '../../../../shared/components/modal/base-modal.component';
import { Employee, EmployeeCreateDto, EmployeeUpdateDto } from '../../models/employee.model';
import { DepartmentService } from '../../../department-management/services/department.service';
import { Department } from '../../../department-management/models/department.model';

@Component({
    selector: 'app-employee-form',
    templateUrl: './employee-form.component.html',
    styleUrls: ['./employee-form.component.scss'],
    imports: [CommonModule, ReactiveFormsModule, BaseModalComponent]
})
export class EmployeeFormComponent implements OnInit {
    private fb = inject(FormBuilder);
    private employeeService = inject(EmployeeService);
    private departmentService = inject(DepartmentService);

    // Inputs
    mode = input.required<'create' | 'edit'>();
    employee = input<Employee | null>(null);

    // Outputs
    saved = output<Employee>();
    cancelled = output<void>();

    // State
    form!: FormGroup;
    loading = signal(false);
    error = signal<string | null>(null);
    departments = signal<Department[]>([]);

    // Computed
    isEditMode = computed(() => this.mode() === 'edit');
    submitButtonText = computed(() => this.isEditMode() ? '更新' : '建立');

    // Modal configuration
    modalConfig = computed<ModalConfig>(() => ({
        title: this.isEditMode() ? '編輯員工' : '新增員工',
        icon: 'bi bi-people',
        size: 'lg'
    }));

    ngOnInit(): void {
        this.initializeForm();
        this.loadDepartments();
    }

    private loadDepartments(): void {
        this.departmentService.getActiveDepartments().subscribe({
            next: (departments) => {
                this.departments.set(departments);
            },
            error: (error) => {
                console.error('載入部門資料失敗:', error);
                this.error.set('載入部門資料失敗，請重新整理頁面');
            }
        });
    }

    private initializeForm(): void {
        const employeeData = this.employee();

        this.form = this.fb.group({
            empCode: [
                employeeData?.empCode || '',
                [Validators.required, Validators.maxLength(20)]
            ],
            empName: [
                employeeData?.empName || '',
                [Validators.required, Validators.maxLength(50)]
            ],
            empEmail: [
                employeeData?.empEmail || '',
                [Validators.email, Validators.maxLength(100)]
            ],
            empPhone: [
                employeeData?.empPhone || '',
                [Validators.pattern(/^[0-9\-\+\(\)\s]{8,20}$/), Validators.maxLength(20)]
            ],
            deptId: [
                employeeData?.deptId || '',
                [Validators.required]
            ],
            jobTitle: [
                employeeData?.jobTitle || '',
                [Validators.maxLength(50)]
            ],
            hireDate: [
                employeeData?.hireDate ? this.formatDateForInput(employeeData.hireDate) : '',
                []
            ],
            resignDate: [
                employeeData?.resignDate ? this.formatDateForInput(employeeData.resignDate) : '',
                []
            ],
            isActive: [
                employeeData?.isActive ?? true,
                [Validators.required]
            ]
        });

        // 編輯模式時員工工號不可修改
        if (this.isEditMode()) {
            this.form.get('emp_code')?.disable();
        }
    }

    private formatDateForInput(date: Date | string): string {
        if (!date) return '';
        const d = new Date(date);
        return d.toISOString().split('T')[0];
    }

    getFieldError(fieldName: string): string | null {
        const field = this.form.get(fieldName);
        if (field?.invalid && (field.dirty || field.touched)) {
            if (field.errors?.['required']) {
                return this.getFieldLabel(fieldName) + '為必填欄位';
            }
            if (field.errors?.['maxlength']) {
                const maxLength = field.errors['maxlength'].requiredLength;
                return this.getFieldLabel(fieldName) + `不可超過 ${maxLength} 個字元`;
            }
            if (field.errors?.['email']) {
                return '請輸入有效的電子郵件格式';
            }
            if (field.errors?.['pattern']) {
                return '請輸入有效的電話號碼格式';
            }
        }
        return null;
    }

    private getFieldLabel(fieldName: string): string {
        const labels: Record<string, string> = {
            emp_code: '員工工號',
            emp_name: '員工姓名',
            emp_email: '電子郵件',
            emp_phone: '聯絡電話',
            dept_id: '所屬部門',
            job_title: '職稱',
            hire_date: '到職日',
            resign_date: '離職日',
            is_active: '在職狀態'
        };
        return labels[fieldName] || fieldName;
    }

    isFieldInvalid(fieldName: string): boolean {
        const field = this.form.get(fieldName);
        return !!(field?.invalid && (field.dirty || field.touched));
    }

    onSubmit(): void {
        if (this.form.invalid) {
            this.markAllFieldsAsTouched();
            return;
        }

        this.loading.set(true);
        this.error.set(null);

        const formValue = this.form.getRawValue(); // 使用 getRawValue 來包含 disabled 欄位

        // 轉換日期格式
        if (formValue.hire_date) {
            formValue.hire_date = new Date(formValue.hire_date);
        }
        if (formValue.resign_date) {
            formValue.resign_date = new Date(formValue.resign_date);
        } else {
            formValue.resign_date = null;
        }

        if (this.isEditMode()) {
            this.updateEmployee({ ...formValue, empId: this.employee()!.empId });
        } else {
            this.createEmployee(formValue);
        }
    }

    private createEmployee(formValue: EmployeeCreateDto): void {
        this.employeeService.createEmployee(formValue).subscribe({
            next: (newEmployee) => {
                this.loading.set(false);
                this.saved.emit(newEmployee);
            },
            error: (error) => {
                this.loading.set(false);
                this.error.set('建立員工失敗，請稍後再試');
                console.error('Create employee error:', error);
            }
        });
    }

    private updateEmployee(formValue: EmployeeUpdateDto): void {
        const id = this.employee()!.empId;

        this.employeeService.updateEmployee(id, formValue).subscribe({
            next: (updatedEmployee) => {
                this.loading.set(false);
                this.saved.emit(updatedEmployee);
            },
            error: (error) => {
                this.loading.set(false);
                this.error.set('更新員工失敗，請稍後再試');
                console.error('Update employee error:', error);
            }
        });
    }

    private markAllFieldsAsTouched(): void {
        Object.keys(this.form.controls).forEach(key => {
            this.form.get(key)?.markAsTouched();
        });
    }

    onCancel(): void {
        this.cancelled.emit();
    }

    clearError(): void {
        this.error.set(null);
    }
}