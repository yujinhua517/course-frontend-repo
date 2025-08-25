import { Component, inject, computed, effect, resource, ChangeDetectionStrategy } from '@angular/core';
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
import { CourseEventService } from '../../../course-event-management/services/course-event.service';
import { CourseEvent } from '../../../course-event-management/models/course-event.model';
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
    changeDetection: ChangeDetectionStrategy.OnPush,
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
    private courseEventService = inject(CourseEventService);
    private messageService = inject(GlobalMessageService);

    override readonly fieldLabels: Record<string, string> = {
        courseEventId: '課程活動',
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

    // 靜態選項資料（符合 spec 規格）

    readonly learningTypeOptions = LEARNING_TYPE_OPTIONS;

    readonly skillTypeOptions = SKILL_TYPE_OPTIONS;

    readonly levelOptions = LEVEL_OPTIONS;


    // 課程活動選項 - 使用 resource 動態載入
    private readonly courseEventsResource = resource({
        loader: () => firstValueFrom(this.courseEventService.getPagedData({
            pageable: true,
            firstIndexInPage: 1,
            lastIndexInPage: 1000,
            isActive: true // 只載入啟用的課程活動
        }))
    });

    // 轉換為下拉選項格式
    readonly courseEventOptions = computed(() => {
        const response = this.courseEventsResource.value();
        if (!response?.data?.dataList) {
            // 資料載入中時，返回空陣列讓 HTML 中的預設 option 顯示
            return [];
        }

        return response.data.dataList.map((event: CourseEvent) => ({
            value: event.courseEventId || 0,
            label: `${event.year} ${event.semester} - ${event.activityTitle}`
        }));
    });

    constructor() {
        super(); //先執行父類別的建構子
        this.initializeForm();

        // 監聽表單變化
        effect(() => {
            const entity = this.entity(); // 檢查：「現在有資料要處理嗎？」
            /**
             * 有資料 (entity)
             * 在編輯模式 (this.isEditMode())
             * 行動：把資料填入表單 (this.populateForm(entity))
             */
            if (entity && this.isEditMode()) {
                this.populateForm(entity);
            } else if (!this.isEditMode()) {
                // 在新增模式時，重設表單
                this.resetForm();
            }
        });
    }

    protected override initializeForm(): void {
        this.form = this.fb.group({
            courseEventId: ['', [Validators.required]],
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
        // 開發用：當 courseName 被設定為特定值時，模擬伺服器錯誤以測試 UI 的錯誤顯示
        if ((data as any).courseName === 'trigger-error') {
            throw new Error('模擬錯誤：測試用，伺服器返回失敗');
        }
        // 根據模式呼叫相應的服務方法
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

    //把舊資料填進表單
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
            courseEventId: '',
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
                return `這是必填欄位`;
            }
            if (field.errors?.['maxlength']) {
                const maxLength = field.errors['maxlength'].requiredLength;
                return `不能超過 ${maxLength} 個字元`;
            }
            if (field.errors?.['min']) {
                const min = field.errors['min'].min;
                return `不能小於 ${min}`;
            }
            if (field.errors?.['max']) {
                const max = field.errors['max'].max;
                return `不能大於 ${max}`;
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

    /**
     * 對外公開的提交方法，可由父元件或測試呼叫以觸發建立/更新流程。
     * 例如父元件可透過 @ViewChild 調用：this.courseForm.submit();
     */
    async submit(): Promise<void> {
        await this.onSubmit();
    }
}