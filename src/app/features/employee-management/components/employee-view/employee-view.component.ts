import { Component, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Employee } from '../../models/employee.model';
import { InfoDisplayComponent, InfoDisplayConfig } from '../../../../shared/components/info-display/info-display.component';

@Component({
    selector: 'app-employee-view',
    templateUrl: './employee-view.component.html',
    styleUrls: ['./employee-view.component.scss'],
    imports: [CommonModule, InfoDisplayComponent]
})
export class EmployeeViewComponent {
    // Inputs
    employee = input.required<Employee>();

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
                label: '員工工號',
                value: this.employee().emp_code,
                icon: 'hash',
                className: 'fw-medium text-primary'
            },
            {
                label: '員工姓名',
                value: this.employee().emp_name,
                icon: 'person',
                className: 'fw-medium'
            },
            {
                label: '在職狀態',
                value: this.employee().is_active,
                icon: 'toggle-on',
                type: 'status'
            },
            {
                label: '職稱',
                value: this.employee().job_title,
                icon: 'person-badge',
                visible: !!this.employee().job_title
            }
        ]
    }));

    contactInfoConfig = computed<InfoDisplayConfig>(() => ({
        title: '聯絡資訊',
        columns: 2,
        items: [
            {
                label: '電子郵件',
                value: this.employee().emp_email,
                icon: 'envelope',
                type: 'email',
                visible: !!this.employee().emp_email
            },
            {
                label: '聯絡電話',
                value: this.employee().emp_phone,
                icon: 'telephone',
                type: 'phone',
                visible: !!this.employee().emp_phone
            },
            {
                label: '所屬部門',
                value: this.employee().dept_name || '未指定',
                icon: 'building'
            }
        ]
    }));

    workInfoConfig = computed<InfoDisplayConfig>(() => ({
        title: '工作資訊',
        columns: 2,
        items: [
            {
                label: '入職日期',
                value: this.employee().hire_date,
                icon: 'calendar-plus',
                type: 'date',
                visible: !!this.employee().hire_date
            },
            {
                label: '離職日期',
                value: this.employee().resign_date,
                icon: 'calendar-x',
                type: 'date',
                visible: !!this.employee().resign_date
            }
        ]
    }));

    systemInfoConfig = computed<InfoDisplayConfig>(() => ({
        title: '系統資訊',
        columns: 2,
        items: [
            {
                label: '建立時間',
                value: this.employee().create_time,
                icon: 'calendar-plus',
                type: 'date'
            },
            {
                label: '最後更新',
                value: this.employee().update_time,
                icon: 'calendar-check',
                type: 'date'
            },
            {
                label: '建立者',
                value: this.employee().create_user || '系統',
                icon: 'person-plus'
            },
            {
                label: '更新者',
                value: this.employee().update_user || '系統',
                icon: 'person-gear'
            }
        ]
    }));
}
