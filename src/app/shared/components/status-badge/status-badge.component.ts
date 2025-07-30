import { Component, input, output, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface StatusConfig {
    value: any;
    activeValue?: any;
    inactiveValue?: any;
    activeText?: string;
    inactiveText?: string;
    clickable?: boolean;
    size?: 'sm' | 'md' | 'lg';
}

@Component({
    selector: 'app-status-badge',
    imports: [CommonModule],
    templateUrl: './status-badge.component.html',
    styleUrl: './status-badge.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class StatusBadgeComponent {
    // 輸入屬性
    readonly config = input.required<StatusConfig>();
    readonly ariaLabel = input<string>('');

    // 輸出事件
    readonly statusToggled = output<any>();

    // 計算屬性
    readonly isActive = computed(() => {
        const { value, activeValue = true } = this.config();
        return value === activeValue || value === 1;
    });

    readonly displayText = computed(() => {
        const { activeText = '啟用', inactiveText = '停用' } = this.config();
        return this.isActive() ? activeText : inactiveText;
    });

    readonly badgeClasses = computed(() => {
        const { size = 'md', clickable = true } = this.config();
        return {
            'status-badge': true,
            'btn': clickable,
            'btn-sm': size === 'sm',
            'btn-lg': size === 'lg',
            'btn-success': this.isActive(),
            'btn-secondary': !this.isActive(),
            'clickable': clickable,
            'non-clickable': !clickable
        };
    });

    readonly computedAriaLabel = computed(() => {
        if (this.ariaLabel()) return this.ariaLabel();
        const { clickable = true } = this.config();
        if (!clickable) return this.displayText();
        return `切換狀態至${this.isActive() ? '停用' : '啟用'}`;
    });

    onToggle(): void {
        const { clickable = true } = this.config();
        if (clickable) {
            this.statusToggled.emit(this.config().value);
        }
    }
}
