import { Component, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CourseEvent } from '../../models/course-event.model';
import { InfoDisplayComponent, InfoDisplayConfig } from '../../../../shared/components/info-display/info-display.component';

@Component({
    selector: 'app-course-event-view',
    templateUrl: './course-event-view.component.html',
    styleUrls: ['./course-event-view.component.scss'],
    imports: [CommonModule, InfoDisplayComponent]
})
export class CourseEventViewComponent {
    // Inputs
    courseEvent = input.required<CourseEvent>();

    // Outputs
    closed = output<void>();

    onClose(): void {
        this.closed.emit();
    }

    // InfoDisplay 配置
    basicInfoConfig = computed<InfoDisplayConfig>(() => ({
        title: '基本資訊',
        columns: 2,
        items: [
            {
                label: '年度',
                value: this.courseEvent().year + '年',
                icon: 'calendar4-range',
                className: 'fw-medium text-primary'
            },
            {
                label: '上半年/下半年',
                value: this.courseEvent().semester === 'H1' ? '上半年 (H1)' : '下半年 (H2)',
                icon: 'calendar3',
                className: 'fw-medium'
            },
            {
                label: '啟用狀態',
                value: this.courseEvent().isActive,
                icon: 'toggle-on',
                type: 'status'
            },
            {
                label: '活動標題',
                value: this.courseEvent().activityTitle,
                icon: 'tag',
                className: 'fw-medium'
            }
        ]
    }));

    descriptionConfig = computed<InfoDisplayConfig>(() => ({
        title: '活動描述',
        columns: 1,
        items: [
            {
                label: '詳細描述',
                value: this.courseEvent().description || '無描述',
                icon: 'file-text',
                visible: true
            }
        ]
    }));

    scheduleInfoConfig = computed<InfoDisplayConfig>(() => ({
        title: '時程資訊',
        columns: 2,
        items: [
            {
                label: '啟動日期',
                value: this.courseEvent().activationDate,
                icon: 'calendar-plus',
                type: 'date',
                visible: !!this.courseEvent().activationDate
            },
            {
                label: '預期完成日期',
                value: this.courseEvent().expectedCompletionDate,
                icon: 'calendar-check',
                type: 'date',
                visible: !!this.courseEvent().expectedCompletionDate
            },
            {
                label: '提交截止日期',
                value: this.courseEvent().submissionDeadline,
                icon: 'calendar-x',
                type: 'date',
                visible: !!this.courseEvent().submissionDeadline
            }
        ]
    }));

    systemInfoConfig = computed<InfoDisplayConfig>(() => ({
        title: '系統資訊',
        columns: 2,
        items: [
            {
                label: '建立時間',
                value: this.courseEvent().createTime,
                icon: 'calendar-plus',
                type: 'date'
            },
            {
                label: '最後更新',
                value: this.courseEvent().updateTime,
                icon: 'calendar-check',
                type: 'date'
            },
            {
                label: '建立者',
                value: this.courseEvent().createUser || '無',
                icon: 'person-plus'
            },
            {
                label: '更新者',
                value: this.courseEvent().updateUser || '無',
                icon: 'person-gear'
            }
        ]
    }));
}
