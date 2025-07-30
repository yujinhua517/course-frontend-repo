import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface ActionButton {
    type: 'view' | 'edit' | 'delete' | 'custom';
    icon?: string;
    text?: string;
    variant?: 'primary' | 'secondary' | 'danger' | 'warning' | 'info' | 'success';
    visible?: boolean;
    disabled?: boolean;
    customAction?: string;
}

export interface ActionButtonConfig {
    buttons: ActionButton[];
    size?: 'sm' | 'md' | 'lg';
    orientation?: 'horizontal' | 'vertical';
    itemName?: string; // 用於 aria-label
}

@Component({
    selector: 'app-action-button-group',
    imports: [CommonModule],
    templateUrl: './action-button-group.component.html',
    styleUrl: './action-button-group.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ActionButtonGroupComponent {
    // 輸入屬性
    readonly config = input.required<ActionButtonConfig>();

    // 輸出事件
    readonly viewClicked = output<void>();
    readonly editClicked = output<void>();
    readonly deleteClicked = output<void>();
    readonly customAction = output<string>();

    // 預設按鈕配置
    private readonly defaultButtons: Record<string, Partial<ActionButton>> = {
        view: {
            icon: 'bi bi-eye',
            variant: 'primary',
            text: '檢視'
        },
        edit: {
            icon: 'bi bi-pencil',
            variant: 'secondary',
            text: '編輯'
        },
        delete: {
            icon: 'bi bi-trash',
            variant: 'danger',
            text: '刪除'
        }
    };

    getButtonConfig(button: ActionButton): ActionButton {
        const defaults = this.defaultButtons[button.type] || {};
        return { ...defaults, ...button };
    }

    getButtonClasses(button: ActionButton): string {
        const buttonConfig = this.getButtonConfig(button);
        const { size = 'sm' } = this.config();

        return [
            'btn',
            `btn-${size}`,
            `btn-outline-${buttonConfig.variant}`
        ].join(' ');
    }

    getAriaLabel(button: ActionButton): string {
        const buttonConfig = this.getButtonConfig(button);
        const { itemName = '項目' } = this.config();

        if (button.type === 'custom' && button.text) {
            return `${button.text} ${itemName}`;
        }

        return `${buttonConfig.text} ${itemName}`;
    }

    onButtonClick(button: ActionButton): void {
        if (button.disabled) return;

        switch (button.type) {
            case 'view':
                this.viewClicked.emit();
                break;
            case 'edit':
                this.editClicked.emit();
                break;
            case 'delete':
                this.deleteClicked.emit();
                break;
            case 'custom':
                if (button.customAction) {
                    this.customAction.emit(button.customAction);
                }
                break;
        }
    }

    shouldShowButton(button: ActionButton): boolean {
        return button.visible !== false;
    }
}
