import { Component, OnInit, input, output, signal, computed, inject, resource, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
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
    private readonly _submitTrigger = signal<{ action: 'create' | 'update', data: any } | null>(null);
    error = signal<string | null>(null);

    // Resource for departments
    private readonly departmentsResource = resource({
        loader: () => firstValueFrom(this.departmentService.getActiveDepartments())
    });

    // Resource for form submission
    private readonly submitResource = resource({
        request: this._submitTrigger,
        loader: async ({ request }) => {
            if (!request) return null;

            if (request.action === 'create') {
                return firstValueFrom(this.employeeService.createEmployee(request.data));
            } else {
                return firstValueFrom(this.employeeService.updateEmployee(this.employee()!.empId, request.data));
            }
        }
    });

    // Computed properties
    departments = computed(() => this.departmentsResource.value() || []);
    loading = computed(() => this.departmentsResource.isLoading() || this.submitResource.isLoading());
    submitLoading = computed(() => this.submitResource.isLoading());

    // Computed
    isEditMode = computed(() => this.mode() === 'edit');
    submitButtonText = computed(() => this.isEditMode() ? '更新' : '建立');

    // Modal configuration
    modalConfig = computed<ModalConfig>(() => ({
        title: this.isEditMode() ? '編輯員工' : '新增員工',
        icon: 'bi bi-people',
        size: 'lg'
    }));

    // Effects - 在字段初始化中使用 effect()
    private readonly submitEffect = effect(() => {
        const submitResult = this.submitResource.value();
        const submitError = this.submitResource.error();

        if (submitResult) {
            this.saved.emit(submitResult);
            this.error.set(null);
        } else if (submitError) {
            this.error.set(this.isEditMode() ? '更新員工失敗，請稍後再試' : '建立員工失敗，請稍後再試');
        }
    });

    private readonly departmentsEffect = effect(() => {
        const deptError = this.departmentsResource.error();
        if (deptError) {
            this.error.set('載入部門資料失敗，請重新整理頁面');
        }
    });

    ngOnInit(): void {
        this.initializeForm();
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
            this.form.get('empCode')?.disable();
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
            empCode: '員工工號',
            empName: '員工姓名',
            empEmail: '電子郵件',
            empPhone: '聯絡電話',
            deptId: '所屬部門',
            jobTitle: '職稱',
            hireDate: '到職日',
            resignDate: '離職日',
            isActive: '在職狀態'
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

        this.error.set(null);
        const formValue = this.form.getRawValue(); // 使用 getRawValue 來包含 disabled 欄位

        // 轉換日期格式
        if (formValue.hireDate) {
            formValue.hireDate = new Date(formValue.hireDate).toISOString();
        }
        if (formValue.resignDate) {
            formValue.resignDate = new Date(formValue.resignDate).toISOString();
        } else {
            formValue.resignDate = null;
        }

        if (this.isEditMode()) {
            this._submitTrigger.set({
                action: 'update',
                data: { ...formValue, empId: this.employee()!.empId }
            });
        } else {
            this._submitTrigger.set({
                action: 'create',
                data: formValue
            });
        }
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