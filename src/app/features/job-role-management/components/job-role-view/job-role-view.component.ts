import { Component, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { JobRole } from '../../models/job-role.model';
import { InfoDisplayComponent, InfoDisplayConfig } from '../../../../shared/components/info-display/info-display.component';

@Component({
    selector: 'app-job-role-view',
    templateUrl: './job-role-view.component.html',
    styleUrls: ['./job-role-view.component.scss'],
    imports: [CommonModule, InfoDisplayComponent]
})
export class JobRoleViewComponent {
    // Inputs
    jobRole = input.required<JobRole>();

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
                label: '職務代碼',
                value: this.jobRole().jobRoleCode,
                icon: 'hash',
                className: 'fw-medium text-primary'
            },
            {
                label: '職務名稱',
                value: this.jobRole().jobRoleName,
                icon: 'briefcase',
                className: 'fw-medium'
            },
            {
                label: '啟用狀態',
                value: this.jobRole().isActive,
                icon: 'toggle-on',
                type: 'status'
            },
            {
                label: '職務描述',
                value: this.jobRole().description,
                icon: 'card-text',
                visible: !!this.jobRole().description
            }
        ]
    }));

    systemInfoConfig = computed<InfoDisplayConfig>(() => ({
        title: '系統資訊',
        columns: 2,
        items: [
            {
                label: '建立時間',
                value: this.jobRole().createTime,
                icon: 'calendar-plus',
                type: 'date'
            },
            {
                label: '最後更新',
                value: this.jobRole().updateTime,
                icon: 'calendar-check',
                type: 'date'
            },
            {
                label: '建立者',
                value: this.jobRole().createUser || '系統',
                icon: 'person-plus'
            },
            {
                label: '更新者',
                value: this.jobRole().updateUser || '系統',
                icon: 'person-gear'
            }
        ]
    }));
}
