import { Component, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Competency } from '../../models/competency.model';
import { InfoDisplayComponent, InfoDisplayConfig } from '../../../../shared/components/info-display/info-display.component';

@Component({
    selector: 'app-competency-view',
    templateUrl: './competency-view.component.html',
    styleUrls: ['./competency-view.component.scss'],
    imports: [CommonModule, InfoDisplayComponent]
})
export class CompetencyViewComponent {
    // Inputs
    competency = input.required<Competency>();

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
                value: this.competency().job_role_code,
                icon: 'hash',
                className: 'fw-medium text-primary'
            },
            {
                label: '職務名稱',
                value: this.competency().job_role_name,
                icon: 'briefcase',
                className: 'fw-medium'
            },
            {
                label: '啟用狀態',
                value: this.competency().is_active,
                icon: 'toggle-on',
                type: 'status'
            },
            {
                label: '職務描述',
                value: this.competency().description,
                icon: 'card-text',
                visible: !!this.competency().description
            }
        ]
    }));

    systemInfoConfig = computed<InfoDisplayConfig>(() => ({
        title: '系統資訊',
        columns: 2,
        items: [
            {
                label: '建立時間',
                value: this.competency().create_time,
                icon: 'calendar-plus',
                type: 'date'
            },
            {
                label: '最後更新',
                value: this.competency().update_time,
                icon: 'calendar-check',
                type: 'date'
            },
            {
                label: '建立者',
                value: this.competency().create_user || '系統',
                icon: 'person-plus'
            },
            {
                label: '更新者',
                value: this.competency().update_user || '系統',
                icon: 'person-gear'
            }
        ]
    }));
}