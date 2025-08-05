import { Component, OnInit, ChangeDetectionStrategy, signal, computed, input, output, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DepartmentService } from '../../services/department.service';
import { EmployeeService } from '../../../employee-management/services/employee.service';
import { BaseModalComponent, ModalConfig } from '../../../../shared/components/modal/base-modal.component';
import {
    Department,
    CreateDepartmentRequest,
    UpdateDepartmentRequest,
    DEPARTMENT_LEVEL_OPTIONS,
    DEPARTMENT_HIERARCHY_RULES
} from '../../models/department.model';
import { DEPARTMENT_LEVEL_ORDER, DEPARTMENT_HIERARCHY_MAP } from '../../models/department.constants';

@Component({
    selector: 'app-department-form',
    imports: [CommonModule, ReactiveFormsModule, BaseModalComponent],
    templateUrl: './department-form.component.html',
    styleUrl: './department-form.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class DepartmentFormComponent implements OnInit {
    private readonly formBuilder = inject(FormBuilder);
    private readonly departmentService: DepartmentService = inject(DepartmentService);
    private readonly employeeService = inject(EmployeeService);
    // Inputs
    mode = input.required<'create' | 'edit'>();
    department = input<Department | null>(null);

    // Outputs
    saved = output<Department>();
    cancelled = output<void>();

    // Form state
    readonly departmentForm = signal<FormGroup>(this.createForm());
    readonly loading = signal(false);
    readonly error = signal<string | null>(null);
    readonly parentDepartments = signal<Department[]>([]);
    readonly selectedDeptLevel = signal<string | null>(null);

    // Computed
    readonly isEditMode = computed(() => this.mode() === 'edit');
    readonly submitButtonText = computed(() => this.isEditMode() ? '更新' : '建立');


    // Constants
    readonly levelOptions = DEPARTMENT_LEVEL_OPTIONS;

    // 欄位初始化階段使用 effect() - 符合注入上下文要求
    private readonly formLevelEffect = effect(() => {
        const form = this.departmentForm();
        const level = form.get('deptLevel')?.value;
        // 檢查是否為有效的層級值（不是空字串和 null/undefined）
        if (level && level.trim() !== '') {
            this.selectedDeptLevel.set(level);
        } else {
            // 清空選擇的層級
            this.selectedDeptLevel.set(null);
        }
    });

    // Modal configuration
    readonly modalConfig = computed<ModalConfig>(() => ({
        title: this.isEditMode() ? '編輯部門' : '新增部門',
        icon: 'bi bi-building',
        size: 'lg'
    }));

    ngOnInit(): void {
        Promise.all([
            this.loadParentDepartments(),
            this.loadEmployees()
        ]).then(() => {
            this.setupForm();
        }).catch(error => {
            console.error('❌ 初始化過程中發生錯誤:', error);
        });
    }

    // filteredParentDepartments 改為依賴 selectedDeptLevel 和新的階層規則
    readonly filteredParentDepartments = computed(() => {
        const selectedLevel = this.selectedDeptLevel();
        const allDepartments = this.parentDepartments();


        if (!selectedLevel) {
            return [];
        }

        let allowedParentLevels: string[] = [];
        switch (selectedLevel) {
            case 'BU':
                allowedParentLevels = ['BI'];
                break;
            case 'TU':
            case 'SU':
                allowedParentLevels = ['BU'];
                break;
            case 'LOB-T':
                allowedParentLevels = ['TU'];
                break;
            case 'LOB-S':
                allowedParentLevels = ['SU'];
                break;
            case 'BI':
            default:
                // BI 是最高層級，沒有上層部門
                return [];
        }

        // 根據 instructions，前端 interface 使用 camelCase
        const filtered = allDepartments
            .filter(d => allowedParentLevels.includes(d.deptLevel))
            .filter(d => d.isActive) // 只顯示啟用的部門
            .sort((a, b) => {
                const aLevel = a.deptLevel as keyof typeof DEPARTMENT_LEVEL_ORDER;
                const bLevel = b.deptLevel as keyof typeof DEPARTMENT_LEVEL_ORDER;
                const levelOrder = (DEPARTMENT_LEVEL_ORDER[aLevel] || 99) - (DEPARTMENT_LEVEL_ORDER[bLevel] || 99);
                return levelOrder !== 0 ? levelOrder : a.deptName.localeCompare(b.deptName);
            });

        return filtered;
    });

    private createForm(): FormGroup {
        const form = this.formBuilder.group({
            deptCode: ['', [Validators.required, Validators.maxLength(20)]],
            deptName: ['', [Validators.required, Validators.maxLength(100)]],
            deptLevel: ['', [Validators.required]], // 確保初始值是空字串
            parentDeptId: [null],
            managerEmpId: [null],
            isActive: [true, [Validators.required]]
        });
        return form;
    }

    private setupForm(): void {
        const dept = this.department();

        if (dept) {
            const form = this.departmentForm();
            form.patchValue({
                deptCode: dept.deptCode,
                deptName: dept.deptName,
                deptLevel: dept.deptLevel,
                parentDeptId: dept.parentDeptId,
                managerEmpId: dept.managerEmpId,
                isActive: dept.isActive
            });
            // 同步 signal，確保 filteredParentDepartments 正確
            this.selectedDeptLevel.set(dept.deptLevel);
        } else {
            this.departmentForm.set(this.createForm());
            this.selectedDeptLevel.set(null);
        }
    }

    // private loadParentDepartments(): void {
    //     this.departmentService.getRootDepartments().subscribe({
    //         next: (departments: Department[]) => {
    //             // Filter out current department if editing to prevent self-reference
    //             const currentDeptId = this.department()?.dept_id;
    //             const filteredDepts = currentDeptId
    //                 ? departments.filter((d: Department) => d.dept_id !== currentDeptId)
    //                 : departments;
    //             this.parentDepartments.set(filteredDepts);
    //         },
    //         error: (error: any) => {
    //             console.error('Failed to load parent departments:', error);
    private loadParentDepartments(): Promise<void> {
        return new Promise(resolve => {
            this.departmentService.getActiveDepartments().subscribe({
                next: (departments: Department[]) => {

                    const currentDeptId = this.department()?.deptId;
                    const filteredDepts = currentDeptId
                        ? departments.filter((d: Department) => d.deptId !== currentDeptId)
                        : departments;

                    this.parentDepartments.set(filteredDepts);
                    resolve();
                },
                error: (error: any) => {
                    console.error('❌ Failed to load parent departments:', error);
                    this.parentDepartments.set([]); // 設置空陣列而不是不設置
                    resolve();
                }
            });
        });
    }

    private loadEmployees(): Promise<void> {
        return new Promise(resolve => {
            this.employeeService.getEmployees().subscribe({
                next: (res) => {
                    const employees = res.dataList ?? res;
                    this.employees.set(employees);
                    resolve();
                },
                error: (err) => {
                    console.error('Failed to load employees:', err);
                    this.employees.set([]);
                    resolve();
                }
            });
        });
    }

    onSubmit(): void {
        const form = this.departmentForm();
        if (form.invalid) {
            this.markFormGroupTouched(form);
            return;
        }

        this.loading.set(true);
        this.error.set(null);

        const formValue = form.value;

        if (this.isEditMode()) {
            const request: UpdateDepartmentRequest = {
                deptId: this.department()!.deptId,
                ...formValue
            };

            this.departmentService.updateDepartment(this.department()!.deptId, request).subscribe({
                next: (updatedDepartment: Department) => {
                    this.handleSuccess(updatedDepartment);
                },
                error: (error: any) => {
                    this.handleError(error);
                }
            });
        } else {
            const request: CreateDepartmentRequest = formValue;

            this.departmentService.createDepartment(request).subscribe({
                next: (newDepartment: Department) => {
                    this.handleSuccess(newDepartment);
                },
                error: (error: any) => {
                    this.handleError(error);
                }
            });
        }
    }

    private handleSuccess(department: Department): void {
        this.loading.set(false);
        this.saved.emit(department);
    }

    private handleError(error: any): void {
        this.loading.set(false);
        this.error.set(error.message || '操作失敗，請重試');
    }

    private markFormGroupTouched(formGroup: FormGroup): void {
        Object.keys(formGroup.controls).forEach(key => {
            const control = formGroup.get(key);
            control?.markAsTouched();
        });
    }

    onCancel(): void {
        this.cancelled.emit();
    }

    /**
     * 處理部門層級變更事件
     */
    onDeptLevelChange(event: Event): void {
        const select = event.target as HTMLSelectElement;
        const selectedLevel = select.value;

        // 手動觸發 selectedDeptLevel 更新，確保 computed 重新計算
        if (selectedLevel && selectedLevel.trim() !== '') {
            this.selectedDeptLevel.set(selectedLevel);
        } else {
            this.selectedDeptLevel.set(null);
        }

        // 同時清空上級部門選擇，因為階層規則可能改變
        const form = this.departmentForm();
        form.get('parentDeptId')?.setValue(null);
    }

    private reset(): void {
        this.departmentForm.set(this.createForm());
        this.loading.set(false);
        this.error.set(null);
    }

    // Validation helpers for template
    isFieldInvalid(fieldName: string): boolean {
        const field = this.departmentForm().get(fieldName);
        return !!(field && field.invalid && field.touched);
    }

    getFieldError(fieldName: string): string {
        const field = this.departmentForm().get(fieldName);
        if (!field || !field.errors || !field.touched) return '';

        const errors = field.errors;

        if (errors['required']) return `此為必填欄位`;
        if (errors['maxlength']) return `${this.getFieldLabel(fieldName)}長度不能超過 ${errors['maxlength'].requiredLength} 個字元`;
        if (errors['min']) return `${this.getFieldLabel(fieldName)}不能小於 ${errors['min'].min}`;

        return '格式不正確';
    }

    private getFieldLabel(fieldName: string): string {
        const labels: Record<string, string> = {
            'department_code': '部門代碼',
            'department_name': '部門名稱',
            'description': '描述',
            'parent_department_id': '上層部門',
            'manager_id': '部門主管',
            'status': '狀態',
            'is_active': '啟用狀態',
        };
        return labels[fieldName] || fieldName;
    }

    readonly employees = signal<any[]>([]);  // Add employee signal
}