import { Component, OnInit, ChangeDetectionStrategy, signal, computed, input, output, inject } from '@angular/core';
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
    private readonly LEVEL_ORDER: Record<string, number> = { 
        'BI': 0,    // 最高層
        'BU': 1,    // 事業群
        'TU': 2,    // 技術單位
        'SU': 2,    // 服務單位（與TU同級）
        'LOB-T': 3, // 技術導向事業線
        'LOB-S': 3  // 服務導向事業線
    };
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

    // Modal configuration
    readonly modalConfig = computed<ModalConfig>(() => ({
        title: this.isEditMode() ? '編輯部門' : '新增部門',
        icon: 'bi bi-building',
        size: 'lg'
    }));

    // ngOnInit(): void {
    //     this.loadParentDepartments();
    //     // this.loadEmployees();
    //     this.setupForm();
    // }

    // ngOnInit(): void {
    //     Promise.all([
    //         this.loadParentDepartments(),
    //         this.loadEmployees()
    //     ]).then(() => {
    //         this.setupForm();
    //     });
    // }
    ngOnInit(): void {
        Promise.all([
            this.loadParentDepartments(),
            this.loadEmployees()
        ]).then(() => {
            this.setupForm();
            // 監聽部門層級變化，更新 signal
            this.departmentForm().get('deptLevel')?.valueChanges.subscribe((level: string) => {
                this.selectedDeptLevel.set(level);
            });
        });
    }

    // filteredParentDepartments 改為依賴 selectedDeptLevel 和新的階層規則
    readonly filteredParentDepartments = computed(() => {
        const selectedLevel = this.selectedDeptLevel();
        const allDepartments = this.parentDepartments();
        if (!selectedLevel) return [];

        // 根據階層關係定義允許的上層部門層級
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

        // 篩選符合階層規則的部門
        return allDepartments
            .filter(d => allowedParentLevels.includes(d.deptLevel))
            .filter(d => d.isActive) // 只顯示啟用的部門
            .sort((a, b) => {
                // 先按層級排序，再按名稱排序
                const levelOrder = (this.LEVEL_ORDER[a.deptLevel] || 99) - (this.LEVEL_ORDER[b.deptLevel] || 99);
                return levelOrder !== 0 ? levelOrder : a.deptName.localeCompare(b.deptName);
            });
    });

    private createForm(): FormGroup {
        return this.formBuilder.group({
            deptCode: ['', [Validators.required, Validators.maxLength(20)]],
            deptName: ['', [Validators.required, Validators.maxLength(100)]],
            deptLevel: ['', [Validators.required]],
            parentDeptId: [null],
            managerEmpId: [null],
            isActive: [true, [Validators.required]]
        });
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
    //         }
    //     });
    // }

    private loadParentDepartments(): Promise<void> {
        return new Promise(resolve => {
            this.departmentService.getDepartmentsAsObservable().subscribe({
                next: (departments: Department[]) => {
                    const currentDeptId = this.department()?.deptId;
                    const filteredDepts = currentDeptId
                        ? departments.filter((d: Department) => d.deptId !== currentDeptId)
                        : departments;
                    this.parentDepartments.set(filteredDepts);
                    resolve();
                },
                error: (error: any) => {
                    console.error('Failed to load parent departments:', error);
                    resolve();
                }
            });
        });
    }

    private loadEmployees(): Promise<void> {
        return new Promise(resolve => {
            this.employeeService.getEmployees().subscribe({
                next: (res) => {
                    this.employees.set(res.dataList ?? res);
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
            'location': '位置',
            'budget': '預算'
        };
        return labels[fieldName] || fieldName;
    }

    readonly employees = signal<any[]>([]);  // Add employee signal
}