import { Component, inject, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';

import {
    BaseModalComponent,
    FormModalBaseComponent,
    ErrorAlertComponent,
    FormButtonsComponent,
    FormFieldComponent,
    ModalConfig
} from '../../../../shared/components';

import { CourseService } from '../../services/course.service';
import { GlobalMessageService } from '../../../../core/message/global-message.service';
import {
    Course,
    CourseCreateDto,
    CourseUpdateDto,
    LEARNING_TYPE_OPTIONS,
    SKILL_TYPE_OPTIONS,
    LEVEL_OPTIONS
} from '../../models/course.model';

@Component({
    selector: 'app-course-form',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        BaseModalComponent,
        ErrorAlertComponent,
        FormButtonsComponent,
        FormFieldComponent
    ],
    templateUrl: './course-form.component.html',
    styleUrl: './course-form.component.scss'
})
export class CourseFormComponent extends FormModalBaseComponent<Course, CourseCreateDto, CourseUpdateDto> {
    private courseService = inject(CourseService);
    private messageService = inject(GlobalMessageService);


    override readonly fieldLabels: Record<string, string> = {
        courseEventId: '課程活動 ID',
        courseName: '課程名稱',
        learningType: '學習類型',
        skillType: '技能類型',
        level: '難易度',
        hours: '時數',
        isActive: '是否啟用',
        remark: '備註'
    };

    // Modal 設定
    override readonly modalConfig = computed<ModalConfig>(() => ({
        title: this.isEditMode() ? '編輯課程' : '新增課程',
        icon: this.isEditMode() ? 'bi bi-pencil-square' : 'bi bi-plus-circle',
        size: 'lg',
        showCloseButton: true,
        closeOnBackdropClick: false
    }));

    // 課程選項
    readonly learningTypeOptions = LEARNING_TYPE_OPTIONS;
    readonly skillTypeOptions = SKILL_TYPE_OPTIONS;
    readonly levelOptions = LEVEL_OPTIONS;

    constructor() {
        super();
        this.initializeForm();

        // 監聽表單變化
        effect(() => {
            const entity = this.entity();
            if (entity && this.isEditMode()) {
                this.populateForm(entity);
            } else if (!this.isEditMode()) {
                this.resetForm();
            }
        });
    }

    protected override initializeForm(): void {
        this.form = this.fb.group({
            courseEventId: [null, [Validators.required, Validators.min(1)]],
            courseName: ['', [Validators.required, Validators.maxLength(200)]],
            learningType: ['', [Validators.required]],
            skillType: ['', [Validators.required]],
            level: ['', [Validators.required]],
            hours: [null, [Validators.min(0.5), Validators.max(999)]],
            isActive: [true, [Validators.required]],
            remark: ['', [Validators.maxLength(500)]]
        });
    }

    protected override async performSubmit(data: CourseCreateDto | CourseUpdateDto): Promise<Course> {
        if (this.isEditMode()) {
            const updateData: CourseUpdateDto = {
                ...data as CourseUpdateDto,
                courseId: this.entity()!.courseId
            };
            const result = await firstValueFrom(this.courseService.updateCourse(updateData));
            if (!result) {
                throw new Error('更新課程失敗：服務返回空值');
            }
            return result;
        } else {
            const result = await firstValueFrom(this.courseService.createCourse(data as CourseCreateDto));
            if (!result) {
                throw new Error('建立課程失敗：服務返回空值');
            }
            return result;
        }
    }

    protected override getEntityName(): string {
        return '課程';
    }

    private populateForm(course: Course): void {
        this.form.patchValue({
            courseEventId: course.courseEventId,
            courseName: course.courseName,
            learningType: course.learningType || '',
            skillType: course.skillType || '',
            level: course.level || '',
            hours: course.hours,
            isActive: course.isActive,
            remark: course.remark || ''
        });
    }

    private resetForm(): void {
        this.form.reset({
            courseEventId: null,
            courseName: '',
            learningType: '',
            skillType: '',
            level: '',
            hours: null,
            isActive: true,
            remark: ''
        });
    }

    // 課程表單錯誤訊息
    override getFieldError(fieldName: string): string | null {
        const field = this.form.get(fieldName);
        if (field?.invalid && (field.dirty || field.touched)) {
            const fieldLabel = this.getFieldLabel(fieldName);

            if (field.errors?.['required']) {
                return `${fieldLabel}是必填欄位`;
            }
            if (field.errors?.['maxlength']) {
                const maxLength = field.errors['maxlength'].requiredLength;
                return `${fieldLabel}不能超過 ${maxLength} 個字元`;
            }
            if (field.errors?.['min']) {
                const min = field.errors['min'].min;
                return `${fieldLabel}不能小於 ${min}`;
            }
            if (field.errors?.['max']) {
                const max = field.errors['max'].max;
                return `${fieldLabel}不能大於 ${max}`;
            }
        }
        return null;
    }

    // 課程表單 CSS 類別
    getInputClass(fieldName: string): string {
        const baseClass = 'form-control';
        const invalidClass = this.isFieldInvalid(fieldName) ? 'is-invalid' : '';
        return `${baseClass} ${invalidClass}`.trim();
    }

    // 課程表單 CSS 類別
    getSelectClass(fieldName: string): string {
        const baseClass = 'form-select';
        const invalidClass = this.isFieldInvalid(fieldName) ? 'is-invalid' : '';
        return `${baseClass} ${invalidClass}`.trim();
    }
}