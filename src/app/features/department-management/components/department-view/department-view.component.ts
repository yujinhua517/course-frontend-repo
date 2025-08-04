import { Component, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Department, DEPARTMENT_LEVEL_OPTIONS } from '../../models/department.model';
import { InfoDisplayComponent, InfoDisplayConfig } from '../../../../shared/components/info-display/info-display.component';

@Component({
    selector: 'app-department-view',
    templateUrl: './department-view.component.html',
    styleUrls: ['./department-view.component.scss'],
    imports: [CommonModule, InfoDisplayComponent]
})
export class DepartmentViewComponent {
    // Inputs
    department = input.required<Department>();

    // Outputs
    closed = output<void>();

    onClose(): void {
        this.closed.emit();
    }

    // 日期轉換輔助函數
    private formatDateString(dateString?: string): string | undefined {
        return dateString ? new Date(dateString).toISOString() : undefined;
    }

    // InfoDisplay 配置
    basicInfoConfig = computed<InfoDisplayConfig>(() => ({
        title: '基本資訊',
        columns: 2,
        items: [
            {
                label: '部門代碼',
                value: this.department().deptCode,
                icon: 'hash',
                className: 'fw-medium text-primary'
            },
            {
                label: '部門名稱',
                value: this.department().deptName,
                icon: 'building',
                className: 'fw-medium'
            },
            {
                label: '部門層級',
                value: this.getLevelOption(this.department().deptLevel)?.label,
                icon: 'diagram-3',
                type: 'badge',
                variant: 'info'
            },
            {
                label: '啟用狀態',
                value: this.department().isActive,
                icon: 'toggle-on',
                type: 'status'
            },
            {
                label: '部門描述',
                value: this.department().deptDesc || '無描述',
                icon: 'card-text',
                visible: true
            }
        ]
    }));

    hierarchyInfoConfig = computed<InfoDisplayConfig>(() => ({
        title: '層級結構',
        columns: 2,
        items: [
            {
                label: '上級部門',
                value: this.department().parentDeptName || '無上級部門',
                icon: 'arrow-up-circle',
                className: this.department().parentDeptName ? '' : 'text-muted'
            },
            {
                label: '部門主管',
                value: this.department().managerName || '未指定',
                icon: 'person-badge',
                className: this.department().managerName ? '' : 'text-muted'
            }
        ]
    }));

    systemInfoConfig = computed<InfoDisplayConfig>(() => ({
        title: '系統資訊',
        columns: 2,
        items: [
            {
                label: '建立時間',
                value: this.formatDateString(this.department().createTime),
                icon: 'calendar-plus',
                type: 'date'
            },
            {
                label: '最後更新',
                value: this.formatDateString(this.department().updateTime),
                icon: 'calendar-check',
                type: 'date'
            },
            {
                label: '建立者',
                value: this.department().createUser || '無',
                icon: 'person-plus'
            },
            {
                label: '更新者',
                value: this.department().updateUser || '無',
                icon: 'person-gear'
            }
        ]
    }));

    getLevelOption(level: string) {
        //console.log('Department Data:', this.department());
        return DEPARTMENT_LEVEL_OPTIONS.find(option => option.value === level);
    }
}
