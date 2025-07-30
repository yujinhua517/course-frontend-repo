import { Component, OnInit, input, output, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CompetencyService } from '../../services/competency.service';
import { BaseModalComponent, ModalConfig } from '../../../../shared/components/modal/base-modal.component';
import { Competency, CompetencyCreateDto, CompetencyUpdateDto } from '../../models/competency.model';

@Component({
    selector: 'app-competency-form',
    templateUrl: './competency-form.component.html',
    styleUrls: ['./competency-form.component.scss'],
    imports: [CommonModule, ReactiveFormsModule, BaseModalComponent]
})
export class CompetencyFormComponent implements OnInit {
    private fb = inject(FormBuilder);
    private competencyService = inject(CompetencyService);

    // Inputs
    mode = input.required<'create' | 'edit'>();
    competency = input<Competency | null>(null);

    // Outputs
    saved = output<Competency>();
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
        title: this.isEditMode() ? '編輯職能' : '新增職能',
        icon: 'bi bi-person-workspace',
        size: 'lg'
    }));

    ngOnInit(): void {
        this.initializeForm();
    }

    private initializeForm(): void {
        const competencyData = this.competency();

        this.form = this.fb.group({
            job_role_code: [
                competencyData?.job_role_code || '',
                [Validators.required, Validators.maxLength(20)]
            ],
            job_role_name: [
                competencyData?.job_role_name || '',
                [Validators.required, Validators.maxLength(100)]
            ],
            description: [
                competencyData?.description || '',
                [Validators.maxLength(500)]
            ],
            is_active: [
                competencyData?.is_active ?? true,
                [Validators.required]
            ]
        });

        // 編輯模式時職能代碼不可修改
        if (this.isEditMode()) {
            this.form.get('job_role_code')?.disable();
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
            job_role_code: '職能代碼',
            job_role_name: '職能名稱',
            description: '職能描述',
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
            this.updateCompetency(formValue);
        } else {
            this.createCompetency(formValue);
        }
    }

    private createCompetency(formValue: CompetencyCreateDto): void {
        this.competencyService.createCompetency(formValue).subscribe({
            next: (newCompetency) => {
                this.loading.set(false);
                this.saved.emit(newCompetency);
            },
            error: (error) => {
                this.loading.set(false);
                this.error.set('建立職能失敗，請稍後再試');
                console.error('Create competency error:', error);
            }
        });
    }

    private updateCompetency(formValue: CompetencyUpdateDto): void {
        const code = this.competency()!.job_role_code;

        this.competencyService.updateCompetency(code, formValue).subscribe({
            next: (updatedCompetency) => {
                this.loading.set(false);
                this.saved.emit(updatedCompetency);
            },
            error: (error) => {
                this.loading.set(false);
                this.error.set('更新職能失敗，請稍後再試');
                console.error('Update competency error:', error);
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
