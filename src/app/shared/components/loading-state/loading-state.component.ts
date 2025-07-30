import { Component, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface LoadingStateConfig {
    size?: 'sm' | 'md' | 'lg';
    text?: string;
    showText?: boolean;
    variant?: 'primary' | 'secondary' | 'light' | 'dark';
    center?: boolean;
}

@Component({
    selector: 'app-loading-state',
    imports: [CommonModule],
    template: `
        <div [class]="containerClasses()" [attr.role]="center() ? 'status' : null" [attr.aria-live]="center() ? 'polite' : null">
            <div [class]="spinnerClasses()" role="status">
                <span class="visually-hidden">{{ config().text || '載入中...' }}</span>
            </div>
            @if (config().showText !== false) {
                <div [class]="textClasses()">{{ config().text || '載入中...' }}</div>
            }
        </div>
    `,
    styles: [`
        .loading-container {
            display: flex;
            align-items: center;
            gap: 0.75rem;
        }
        
        .loading-container.center {
            flex-direction: column;
            justify-content: center;
            text-align: center;
            padding: 2rem;
            gap: 1rem;
        }
        
        .loading-text {
            color: var(--bs-secondary);
            font-weight: 500;
        }
        
        .loading-text.sm {
            font-size: 0.875rem;
        }
        
        .loading-text.md {
            font-size: 1rem;
        }
        
        .loading-text.lg {
            font-size: 1.125rem;
        }
    `]
})
export class LoadingStateComponent {
    readonly config = input.required<LoadingStateConfig>();

    readonly center = computed(() => this.config().center ?? false);

    readonly containerClasses = computed(() => {
        const center = this.center();
        return `loading-container${center ? ' center' : ''}`;
    });

    readonly spinnerClasses = computed(() => {
        const config = this.config();
        const size = config.size || 'md';
        const variant = config.variant || 'primary';

        const sizeClass = size === 'sm' ? 'spinner-border-sm' : '';
        const variantClass = `text-${variant}`;

        return `spinner-border ${variantClass} ${sizeClass}`.trim();
    });

    readonly textClasses = computed(() => {
        const config = this.config();
        const size = config.size || 'md';
        return `loading-text ${size}`;
    });
}
