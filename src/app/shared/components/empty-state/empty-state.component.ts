import { Component, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface EmptyStateConfig {
    icon: string;
    title: string;
    message: string;
    primaryAction?: EmptyStateAction;
    secondaryAction?: EmptyStateAction;
    showIcon?: boolean;
    size?: 'sm' | 'md' | 'lg';
}

export interface EmptyStateAction {
    label: string;
    action: string;
    icon?: string;
    variant?: 'primary' | 'secondary' | 'outline-primary' | 'outline-secondary';
}

@Component({
    selector: 'app-empty-state',
    imports: [CommonModule],
    template: `
        <div [class]="containerClasses()" role="status" aria-live="polite">
            @if (config().showIcon !== false) {
                <div [class]="iconContainerClasses()">
                    <i [class]="iconClasses()" [attr.aria-hidden]="true"></i>
                </div>
            }
            
            <h4 [class]="titleClasses()">{{ config().title }}</h4>
            
            <p [class]="messageClasses()">{{ config().message }}</p>
            
            @if (config().primaryAction || config().secondaryAction) {
                <div class="empty-state-actions">
                    @if (config().primaryAction) {
                        <button 
                            type="button" 
                            [class]="getActionClasses(config().primaryAction!)"
                            (click)="onActionClick(config().primaryAction!.action)"
                            [attr.aria-label]="config().primaryAction!.label">
                            @if (config().primaryAction!.icon) {
                                <i [class]="'bi bi-' + config().primaryAction!.icon + ' me-1'" [attr.aria-hidden]="true"></i>
                            }
                            {{ config().primaryAction!.label }}
                        </button>
                    }
                    @if (config().secondaryAction) {
                        <button 
                            type="button" 
                            [class]="getActionClasses(config().secondaryAction!)"
                            (click)="onActionClick(config().secondaryAction!.action)"
                            [attr.aria-label]="config().secondaryAction!.label">
                            @if (config().secondaryAction!.icon) {
                                <i [class]="'bi bi-' + config().secondaryAction!.icon + ' me-1'" [attr.aria-hidden]="true"></i>
                            }
                            {{ config().secondaryAction!.label }}
                        </button>
                    }
                </div>
            }
        </div>
    `,
    styles: [`
        .empty-state {
            text-align: center;
            padding: 2rem;
            border-radius: 0.75rem;
            margin: 2rem 0;
        }
        
        .empty-state.sm {
            padding: 1.5rem;
            margin: 1.5rem 0;
        }
        
        .empty-state.lg {
            padding: 3rem;
            margin: 3rem 0;
        }
        
        .empty-state-icon {
            margin-bottom: 1.5rem;
        }
        
        .empty-state-icon.sm {
            margin-bottom: 1rem;
        }
        
        .empty-state-icon.lg {
            margin-bottom: 2rem;
        }
        
        .empty-state-icon i {
            color: rgba(108, 117, 125, 0.4);
            font-size: 4rem;
        }
        
        .empty-state-icon.sm i {
            font-size: 3rem;
        }
        
        .empty-state-icon.lg i {
            font-size: 5rem;
        }
        
        .empty-state-title {
            color: #6c757d;
            font-weight: 500;
            margin-bottom: 0.75rem;
        }
        
        .empty-state-title.sm {
            font-size: 1.125rem;
            margin-bottom: 0.5rem;
        }
        
        .empty-state-title.md {
            font-size: 1.25rem;
        }
        
        .empty-state-title.lg {
            font-size: 1.5rem;
            margin-bottom: 1rem;
        }
        
        .empty-state-message {
            color: rgba(108, 117, 125, 0.8);
            margin: 0 auto 1.5rem;
            line-height: 1.5;
        }
        
        .empty-state-message.sm {
            max-width: 300px;
            font-size: 0.875rem;
            margin-bottom: 1rem;
        }
        
        .empty-state-message.md {
            max-width: 400px;
        }
        
        .empty-state-message.lg {
            max-width: 500px;
            font-size: 1.125rem;
            margin-bottom: 2rem;
        }
        
        .empty-state-actions {
            display: flex;
            gap: 0.75rem;
            justify-content: center;
            flex-wrap: wrap;
        }
        
        .empty-state-actions .btn {
            border-radius: 0.5rem;
            font-weight: 500;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
    `]
})
export class EmptyStateComponent {
    readonly config = input.required<EmptyStateConfig>();

    readonly actionClicked = output<string>();

    readonly containerClasses = computed(() => {
        const size = this.config().size || 'md';
        return `empty-state ${size}`;
    });

    readonly iconContainerClasses = computed(() => {
        const size = this.config().size || 'md';
        return `empty-state-icon ${size}`;
    });

    readonly iconClasses = computed(() => {
        return `bi bi-${this.config().icon}`;
    });

    readonly titleClasses = computed(() => {
        const size = this.config().size || 'md';
        return `empty-state-title ${size}`;
    });

    readonly messageClasses = computed(() => {
        const size = this.config().size || 'md';
        return `empty-state-message ${size}`;
    });

    getActionClasses(action: EmptyStateAction): string {
        const variant = action.variant || 'primary';
        return `btn btn-${variant}`;
    }

    onActionClick(action: string): void {
        this.actionClicked.emit(action);
    }
}
