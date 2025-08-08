import { Component, OnInit, input, output, signal, computed, inject, resource, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { CourseEventService } from '../../services/course-event.service';
import { BaseModalComponent, ModalConfig } from '../../../../shared/components/modal/base-modal.component';
import { CourseEvent, CourseEventCreateDto, CourseEventUpdateDto, SEMESTER_OPTIONS } from '../../models/course-event.model';

@Component({
    selector: 'app-course-event-form',
    templateUrl: './course-event-form.component.html',
    styleUrls: ['./course-event-form.component.scss'],
    imports: [CommonModule, ReactiveFormsModule, BaseModalComponent]
})
export class CourseEventFormComponent implements OnInit {
    private fb = inject(FormBuilder);
    private courseEventService = inject(CourseEventService);

    // Inputs
    mode = input.required<'create' | 'edit'>();
    courseEvent = input<CourseEvent | null>(null);

    // Outputs
    saved = output<CourseEvent>();
    cancelled = output<void>();

    // State
    form!: FormGroup;
    private readonly _submitTrigger = signal<{ action: 'create' | 'update', data: any } | null>(null);
    error = signal<string | null>(null);
    availableYears = signal<string[]>([]);

    // Resource for form submission
    private readonly submitResource = resource({
        request: this._submitTrigger,
        loader: async ({ request }) => {
            if (!request) return null;

            if (request.action === 'create') {
                return firstValueFrom(this.courseEventService.createCourseEvent(request.data));
            } else {
                return firstValueFrom(this.courseEventService.updateCourseEvent(this.courseEvent()!.courseEventId!, request.data));
            }
        }
    });

    // Computed properties
    loading = computed(() => this.submitResource.isLoading());
    submitLoading = computed(() => this.submitResource.isLoading());

    // Computed
    isEditMode = computed(() => this.mode() === 'edit');
    submitButtonText = computed(() => this.isEditMode() ? '更新' : '建立');

    // Options
    semesterOptions = SEMESTER_OPTIONS;
    yearOptions = computed(() => this.availableYears().map(year => ({
        value: year,
        label: year
    })));

    // Modal configuration
    modalConfig = computed<ModalConfig>(() => ({
        title: this.isEditMode() ? '編輯課程活動' : '新增課程活動',
        icon: 'bi bi-calendar-event',
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
            this.error.set(this.isEditMode() ? '更新課程活動失敗，請稍後再試' : '建立課程活動失敗，請稍後再試');
        }
    });

    ngOnInit(): void {
        this.loadAvailableYears();
        this.initializeForm();
    }

    private loadAvailableYears(): void {
        this.courseEventService.getAvailableYears().subscribe({
            next: (years) => {
                this.availableYears.set(years);
            },
            error: (error) => {
                console.error('Failed to load available years:', error);
                // 回退到靜態年度
                const fallbackYears = Array.from({ length: 6 }, (_, i) =>
                    (new Date().getFullYear() - 2 + i).toString()
                );
                this.availableYears.set(fallbackYears);
            }
        });
    }

    private initializeForm(): void {
        const courseEventData = this.courseEvent();

        this.form = this.fb.group({
            year: [
                courseEventData?.year || '',
                [Validators.required]
            ],
            semester: [
                courseEventData?.semester || '',
                [Validators.required]
            ],
            activityTitle: [
                courseEventData?.activityTitle || '',
                [Validators.required, Validators.maxLength(200)]
            ],
            description: [
                courseEventData?.description || '',
                [Validators.maxLength(1000)]
            ],
            expectedCompletionDate: [
                courseEventData?.expectedCompletionDate ? this.formatDateForInput(courseEventData.expectedCompletionDate) : '',
                []
            ],
            submissionDeadline: [
                courseEventData?.submissionDeadline ? this.formatDateForInput(courseEventData.submissionDeadline) : '',
                []
            ],
            activationDate: [
                courseEventData?.activationDate ? this.formatDateForInput(courseEventData.activationDate) : '',
                []
            ],
            isActive: [
                courseEventData?.isActive ?? true,
                [Validators.required]
            ]
        });
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
        }
        return null;
    }

    private getFieldLabel(fieldName: string): string {
        const labels: Record<string, string> = {
            year: '年度',
            semester: '學期',
            activityTitle: '活動標題',
            description: '活動描述',
            expectedCompletionDate: '預期完成日期',
            submissionDeadline: '提交截止日期',
            activationDate: '啟動日期',
            isActive: '啟用狀態'
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

        // 轉換日期格式為後端期望的格式 (yyyy-MM-dd)
        if (formValue.expectedCompletionDate) {
            formValue.expectedCompletionDate = formValue.expectedCompletionDate; // 保持 yyyy-MM-dd 格式
        }
        if (formValue.submissionDeadline) {
            formValue.submissionDeadline = formValue.submissionDeadline; // 保持 yyyy-MM-dd 格式
        }
        if (formValue.activationDate) {
            formValue.activationDate = formValue.activationDate; // 保持 yyyy-MM-dd 格式
        }

        if (this.isEditMode()) {
            this._submitTrigger.set({
                action: 'update',
                data: { ...formValue, courseEventId: this.courseEvent()!.courseEventId! }
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
