import { Component, OnInit, input, output, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { JobRoleService } from '../../services/job-role.service';
import { BaseModalComponent, ModalConfig } from '../../../../shared/components/modal/base-modal.component';
import { JobRole, JobRoleCreateDto, JobRoleUpdateDto } from '../../models/job-role.model';

@Component({
    selector: 'app-job-role-form',
    templateUrl: './job-role-form.component.html',
    styleUrls: ['./job-role-form.component.scss'],
    imports: [CommonModule, ReactiveFormsModule, BaseModalComponent]
})
export class JobRoleFormComponent implements OnInit {
    private fb = inject(FormBuilder);
    private jobRoleService = inject(JobRoleService);

    // Inputs
    mode = input.required<'create' | 'edit'>();
    jobRole = input<JobRole | null>(null);

    // Outputs
    saved = output<JobRole>();
    cancelled = output<void>();

    // State
    form!: FormGroup;
    loading = signal(false);
    error = signal<string | null>(null);

    // Computed
    isEditMode = computed(() => this.mode() === 'edit');
    submitButtonText = computed(() => this.isEditMode() ? '更新' : '建立');

    // Modal configuration
    modalConfig = computed<ModalConfig>(() => ({
        title: this.isEditMode() ? '編輯職務' : '新增職務',
        icon: 'bi bi-person-workspace',
        size: 'lg'
    }));

    ngOnInit(): void {
        this.initializeForm();
    }

    private initializeForm(): void {
        const jobRoleData = this.jobRole();

        this.form = this.fb.group({
            jobRoleCode: [
                jobRoleData?.jobRoleCode || '',
                [Validators.required, Validators.maxLength(20)]
            ],
            jobRoleName: [
                jobRoleData?.jobRoleName || '',
                [Validators.required, Validators.maxLength(100)]
            ],
            description: [
                jobRoleData?.description || '',
                [Validators.maxLength(500)]
            ],
            isActive: [
                jobRoleData?.isActive ?? true,
                [Validators.required]
            ]
        });

        // 編輯模式時職務代碼不可修改
        if (this.isEditMode()) {
            this.form.get('jobRoleCode')?.disable();
        }
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
        }
        return null;
    }

    private getFieldLabel(fieldName: string): string {
        const labels: Record<string, string> = {
            job_role_code: '職務代碼',
            job_role_name: '職務名稱',
            description: '職務描述',
            is_active: '狀態'
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

        if (this.isEditMode()) {
            this.updateJobRole(formValue);
        } else {
            this.createJobRole(formValue);
        }
    }

    private createJobRole(formValue: JobRoleCreateDto): void {
        this.jobRoleService.createJobRole(formValue).subscribe({
            next: (response) => {
                this.loading.set(false);
                if (response.code === 200) {
                    this.saved.emit(response.data);
                } else {
                    this.error.set(response.message || '建立職務失敗');
                }
            },
            error: (error) => {
                this.loading.set(false);
                this.error.set('建立職務失敗，請稍後再試');
                console.error('Create job role error:', error);
            }
        });
    }

    private updateJobRole(formValue: any): void {
        const jobRoleData = this.jobRole()!;
        const updateDto: JobRoleUpdateDto = {
            jobRoleId: jobRoleData.jobRoleId!,
            jobRoleCode: formValue.jobRoleCode,
            jobRoleName: formValue.jobRoleName,
            description: formValue.description,
            isActive: formValue.isActive
        };

        this.jobRoleService.updateJobRole(updateDto).subscribe({
            next: (response) => {
                this.loading.set(false);
                if (response.code === 200) {
                    this.saved.emit(response.data);
                } else {
                    this.error.set(response.message || '更新職務失敗');
                }
            },
            error: (error) => {
                this.loading.set(false);
                this.error.set('更新職務失敗，請稍後再試');
                console.error('Update job role error:', error);
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
