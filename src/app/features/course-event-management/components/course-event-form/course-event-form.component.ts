import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { CourseEventService } from '../../services/course-event.service';
import {
    BaseModalComponent,
    FormModalBaseComponent,
    ErrorAlertComponent,
    FormButtonsComponent,
    FormFieldComponent,
    ModalConfig
} from '../../../../shared/components/modal';
import { CourseEvent, CourseEventCreateDto, CourseEventUpdateDto, SEMESTER_OPTIONS } from '../../models/course-event.model';

@Component({
    selector: 'app-course-event-form',
    templateUrl: './course-event-form.component.html',
    styleUrls: ['./course-event-form.component.scss'],
    imports: [
        CommonModule,
        ReactiveFormsModule,
        BaseModalComponent,
        ErrorAlertComponent,
        FormButtonsComponent,
        FormFieldComponent
    ]
})
export class CourseEventFormComponent extends FormModalBaseComponent<CourseEvent, CourseEventCreateDto, CourseEventUpdateDto> implements OnInit {
    private courseEventService = inject(CourseEventService);

    // Additional state specific to course events
    availableYears = signal<string[]>([]);

    // Options
    semesterOptions = SEMESTER_OPTIONS;
    yearOptions = computed(() => this.availableYears().map(year => ({
        value: year,
        label: year
    })));

    // Modal configuration implementation
    readonly modalConfig = computed<ModalConfig>(() => ({
        title: this.isEditMode() ? '編輯課程活動' : '新增課程活動',
        icon: 'bi bi-calendar-event',
        size: 'lg'
    }));

    // Field labels implementation
    readonly fieldLabels = {
        year: '年度',
        semester: '學期',
        activityTitle: '活動標題',
        description: '活動描述',
        expectedCompletionDate: '預期完成日期',
        submissionDeadline: '提交截止日期',
        activationDate: '啟動日期',
        isActive: '啟用狀態'
    };

    ngOnInit(): void {
        this.loadAvailableYears();
        this.initializeForm();
    }

    protected initializeForm(): void {
        const courseEventData = this.entity();

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
                [Validators.required]
            ],
            submissionDeadline: [
                courseEventData?.submissionDeadline ? this.formatDateForInput(courseEventData.submissionDeadline) : '',
                [Validators.required]
            ],
            activationDate: [
                courseEventData?.activationDate ? this.formatDateForInput(courseEventData.activationDate) : '',
                [Validators.required]
            ],
            isActive: [
                courseEventData?.isActive ?? true,
                [Validators.required]
            ]
        });

        // 編輯模式時年度和學期不可修改
        if (this.isEditMode()) {
            this.form.get('year')?.disable();
            this.form.get('semester')?.disable();
        }
    }

    protected async performSubmit(data: CourseEventCreateDto | CourseEventUpdateDto): Promise<CourseEvent> {
        // Convert date format to backend expected format (yyyy-MM-dd)
        const formattedData = { ...data };
        if (formattedData.expectedCompletionDate) {
            formattedData.expectedCompletionDate = formattedData.expectedCompletionDate;
        }
        if (formattedData.submissionDeadline) {
            formattedData.submissionDeadline = formattedData.submissionDeadline;
        }
        if (formattedData.activationDate) {
            formattedData.activationDate = formattedData.activationDate;
        }

        if (this.isEditMode()) {
            const currentEntity = this.entity();
            if (!currentEntity?.courseEventId) {
                throw new Error('Course event ID is required for update');
            }
            const updateData = {
                ...formattedData,
                courseEventId: currentEntity.courseEventId
            } as CourseEventUpdateDto;
            const result = await firstValueFrom(this.courseEventService.updateCourseEvent(currentEntity.courseEventId, updateData));
            return result!;
        } else {
            const result = await firstValueFrom(this.courseEventService.createCourseEvent(formattedData as CourseEventCreateDto));
            return result!;
        }
    }

    protected getEntityName(): string {
        return '課程活動';
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

    private formatDateForInput(dateString: string): string {
        if (!dateString) return '';
        // 如果已經是 yyyy-MM-dd 格式，直接返回
        if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
            return dateString;
        }
        // 否則轉換為 yyyy-MM-dd 格式
        const date = new Date(dateString);
        return date.toISOString().split('T')[0];
    }
}
