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
                value: this.employee().empCode,
                icon: 'hash',
                className: 'fw-medium text-primary'
            },
            {
                label: '員工姓名',
                value: this.employee().empName,
                icon: 'person',
                className: 'fw-medium'
            },
            {
                label: '在職狀態',
                value: this.employee().isActive,
                icon: 'toggle-on',
                type: 'status'
            },
            {
                label: '職稱',
                value: this.employee().jobTitle,
                icon: 'person-badge',
                visible: !!this.employee().jobTitle
            }
        ]
    }));

    contactInfoConfig = computed<InfoDisplayConfig>(() => ({
        title: '聯絡資訊',
        columns: 2,
        items: [
            {
                label: '電子郵件',
                value: this.employee().empEmail,
                icon: 'envelope',
                type: 'email',
                visible: !!this.employee().empEmail
            },
            {
                label: '聯絡電話',
                value: this.employee().empPhone,
                icon: 'telephone',
                type: 'phone',
                visible: !!this.employee().empPhone
            },
            {
                label: '所屬部門',
                value: this.employee().deptName || '未指定',
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
                value: this.employee().hireDate,
                icon: 'calendar-plus',
                type: 'date',
                visible: !!this.employee().hireDate
            },
            {
                label: '離職日期',
                value: this.employee().resignDate,
                icon: 'calendar-x',
                type: 'date',
                visible: !!this.employee().resignDate
            }
        ]
    }));

    systemInfoConfig = computed<InfoDisplayConfig>(() => ({
        title: '系統資訊',
        columns: 2,
        items: [
            {
                label: '建立時間',
                value: this.employee().createTime,
                icon: 'calendar-plus',
                type: 'date'
            },
            {
                label: '最後更新',
                value: this.employee().updateTime,
                icon: 'calendar-check',
                type: 'date'
            },
            {
                label: '建立者',
                value: this.employee().createUser || '無',
                icon: 'person-plus'
            },
            {
                label: '更新者',
                value: this.employee().updateUser || '無',
                icon: 'person-gear'
            }
        ]
    }));
}
