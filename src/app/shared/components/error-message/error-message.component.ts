import { Component, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface ErrorMessageConfig {
    message: string;
    type?: 'danger' | 'warning' | 'info';
    title?: string;
    icon?: string;
    dismissible?: boolean;
    actions?: ErrorAction[];
}

export interface ErrorAction {
    label: string;
    action: string;
    variant?: 'primary' | 'secondary' | 'outline-primary' | 'outline-secondary';
}

@Component({
    selector: 'app-error-message',
    imports: [CommonModule],
    template: `
        <div [class]="alertClasses()" role="alert">
            <div class="d-flex align-items-start">
                @if (iconClass()) {
                    <i [class]="iconClass()!" [attr.aria-hidden]="true"></i>
                }
                <div class="flex-grow-1">
                    @if (config().title) {
                        <h6 class="alert-heading mb-1">{{ config().title }}</h6>
                    }
                    <div class="alert-message">{{ config().message }}</div>
                    @if (config().actions && config().actions!.length > 0) {
                        <div class="alert-actions mt-2">
                            @for (action of config().actions; track action.action) {
                                <button 
                                    type="button" 
                                    [class]="getActionClasses(action)"
                                    (click)="onActionClick(action.action)">
                                    {{ action.label }}
                                </button>
                            }
                        </div>
                    }
                </div>
                @if (config().dismissible) {
                    <button 
                        type="button" 
                        class="btn-close ms-auto" 
                        (click)="onDismiss()" 
                        [attr.aria-label]="'關閉' + (config().title || '錯誤訊息')">
                    </button>
                }
            </div>
        </div>
    `,
    styles: [`
        .alert {
            border: none;
            border-radius: 0.75rem;
            font-weight: 500;
        }
        
        .alert i {
            margin-right: 0.75rem;
            margin-top: 0.125rem;
            font-size: 1.125rem;
        }
        
        .alert-heading {
            font-weight: 600;
            font-size: 1rem;
        }
        
        .alert-message {
            margin: 0;
            line-height: 1.5;
        }
        
        .alert-actions {
            display: flex;
            gap: 0.5rem;
            flex-wrap: wrap;
        }
        
        .alert-actions .btn {
            font-size: 0.875rem;
            padding: 0.375rem 0.75rem;
            border-radius: 0.375rem;
        }
    `]
})
export class ErrorMessageComponent {
    readonly config = input.required<ErrorMessageConfig>();

    readonly dismissed = output<void>();
    readonly actionClicked = output<string>();

    readonly alertClasses = computed(() => {
        const type = this.config().type || 'danger';
        return `alert alert-${type} d-flex`;
    });

    readonly iconClass = computed(() => {
        const config = this.config();
        if (config.icon) {
            return `bi bi-${config.icon}`;
        }

        const type = config.type || 'danger';
        const iconMap = {
            danger: 'bi bi-exclamation-triangle-fill',
            warning: 'bi bi-exclamation-triangle-fill',
            info: 'bi bi-info-circle-fill'
        };

        return iconMap[type];
    });

    getActionClasses(action: ErrorAction): string {
        const variant = action.variant || 'outline-primary';
        return `btn btn-${variant}`;
    }

    onDismiss(): void {
        this.dismissed.emit();
    }

    onActionClick(action: string): void {
        this.actionClicked.emit(action);
    }
}
