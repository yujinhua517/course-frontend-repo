import { Component, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface ConfirmationModalConfig {
    title: string;
    message: string;
    type?: 'danger' | 'warning' | 'info' | 'success';
    icon?: string;
    confirmText?: string;
    cancelText?: string;
    size?: 'sm' | 'md' | 'lg';
    items?: ConfirmationItem[];
    maxItemsToShow?: number;
    showItemIcon?: boolean;
}

export interface ConfirmationItem {
    id: string | number;
    text: string;
    subText?: string;
    icon?: string;
}

@Component({
    selector: 'app-confirmation-modal',
    imports: [CommonModule],
    template: `
        <!-- Modal Backdrop -->
        @if (show()) {
            <div class="modal-backdrop fade show" (click)="onCancel()"></div>
            <div class="modal fade show d-block" tabindex="-1" role="dialog" [attr.aria-labelledby]="modalId + 'Label'">
                <div [class]="modalDialogClasses()" role="document">
                    <div class="modal-content">
                        <!-- Header -->
                        <div class="modal-header">
                            <h5 [class]="modalTitleClasses()" [id]="modalId + 'Label'">
                                @if (iconClass()) {
                                    <i [class]="iconClass()!" [attr.aria-hidden]="true"></i>
                                }
                                {{ config().title }}
                            </h5>
                            <button 
                                type="button" 
                                class="btn-close" 
                                (click)="onCancel()" 
                                [attr.aria-label]="'關閉' + config().title">
                            </button>
                        </div>
                        
                        <!-- Body -->
                        <div class="modal-body">
                            <p class="mb-3">{{ config().message }}</p>
                            
                            @if (config().items && config().items!.length > 0) {
                                <div [class]="itemsContainerClasses()">
                                    @for (item of visibleItems(); track item.id) {
                                        <div class="confirmation-item">
                                            @if (config().showItemIcon !== false && (item.icon || defaultItemIcon())) {
                                                <i [class]="getItemIconClass(item)" [attr.aria-hidden]="true"></i>
                                            }
                                            <div class="confirmation-item-content">
                                                <span class="confirmation-item-text">{{ item.text }}</span>
                                                @if (item.subText) {
                                                    <span class="confirmation-item-subtext">- {{ item.subText }}</span>
                                                }
                                            </div>
                                        </div>
                                    }
                                    @if (hasMoreItems()) {
                                        <div class="confirmation-more-items">
                                            <small class="text-muted">
                                                還有 {{ remainingItemsCount() }} 個項目...
                                            </small>
                                        </div>
                                    }
                                </div>
                            }
                            
                            @if (isWarningType()) {
                                <div [class]="warningAlertClasses()">
                                    <i class="bi bi-exclamation-triangle-fill me-2" [attr.aria-hidden]="true"></i>
                                    <div>
                                        <strong>警告：</strong>此操作無法復原，請確認後再執行。
                                    </div>
                                </div>
                            }
                        </div>
                        
                        <!-- Footer -->
                        <div class="modal-footer">
                            <button 
                                type="button" 
                                class="btn btn-secondary" 
                                (click)="onCancel()"
                                [disabled]="loading()">
                                {{ config().cancelText || '取消' }}
                            </button>
                            <button 
                                type="button" 
                                [class]="confirmButtonClasses()" 
                                (click)="onConfirm()"
                                [disabled]="loading()">
                                @if (loading()) {
                                    <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                    處理中...
                                } @else {
                                    <i [class]="confirmButtonIconClass()" [attr.aria-hidden]="true"></i>
                                    {{ config().confirmText || '確認' }}
                                }
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        }
    `,
    styles: [`
        .modal-backdrop {
            background-color: rgba(0, 0, 0, 0.5);
        }
        
        .modal-content {
            border-radius: 0.75rem;
            border: none;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
        }
        
        .modal-header {
            border-bottom: 1px solid rgba(0, 0, 0, 0.1);
            padding: 1.5rem;
        }
        
        .modal-title {
            font-weight: 600;
            font-size: 1.125rem;
            margin: 0;
            display: flex;
            align-items: center;
        }
        
        .modal-title i {
            margin-right: 0.5rem;
            font-size: 1.25rem;
        }
        
        .modal-title.text-danger i {
            color: #dc3545;
        }
        
        .modal-title.text-warning i {
            color: #ffc107;
        }
        
        .modal-title.text-info i {
            color: #0dcaf0;
        }
        
        .modal-title.text-success i {
            color: #198754;
        }
        
        .modal-body {
            padding: 1.5rem;
        }
        
        .confirmation-items {
            background-color: rgba(248, 249, 250, 0.5);
            border: 1px solid rgba(222, 226, 230, 0.8);
            border-radius: 0.5rem;
            padding: 1rem;
            margin-bottom: 1rem;
            max-height: 200px;
            overflow-y: auto;
        }
        
        .confirmation-item {
            display: flex;
            align-items: center;
            padding: 0.25rem 0;
        }
        
        .confirmation-item:not(:last-child) {
            border-bottom: 1px solid rgba(222, 226, 230, 0.5);
            padding-bottom: 0.5rem;
            margin-bottom: 0.5rem;
        }
        
        .confirmation-item i {
            margin-right: 0.75rem;
            font-size: 1rem;
            color: var(--bs-primary);
            flex-shrink: 0;
        }
        
        .confirmation-item-content {
            flex: 1;
            min-width: 0;
        }
        
        .confirmation-item-text {
            font-weight: 500;
            color: var(--bs-dark);
        }
        
        .confirmation-item-subtext {
            color: var(--bs-secondary);
            margin-left: 0.5rem;
        }
        
        .confirmation-more-items {
            text-align: center;
            padding-top: 0.5rem;
            margin-top: 0.5rem;
            border-top: 1px solid rgba(222, 226, 230, 0.5);
        }
        
        .warning-alert {
            background-color: rgba(255, 193, 7, 0.1);
            border: 1px solid rgba(255, 193, 7, 0.2);
            color: #856404;
            border-radius: 0.5rem;
            padding: 0.75rem;
            display: flex;
            align-items: center;
        }
        
        .modal-footer {
            border-top: 1px solid rgba(0, 0, 0, 0.1);
            padding: 1.5rem;
        }
        
        .modal-footer .btn {
            border-radius: 0.5rem;
            font-weight: 500;
            padding: 0.625rem 1.25rem;
        }
        
        .btn-danger {
            background-color: #dc3545;
            border-color: #dc3545;
        }
        
        .btn-danger:hover:not(:disabled) {
            background-color: #c82333;
            border-color: #bd2130;
        }
        
        .btn-warning {
            background-color: #ffc107;
            border-color: #ffc107;
            color: #000;
        }
        
        .btn-warning:hover:not(:disabled) {
            background-color: #e0a800;
            border-color: #d39e00;
        }
    `]
})
export class ConfirmationModalComponent {
    readonly show = input.required<boolean>();
    readonly config = input.required<ConfirmationModalConfig>();
    readonly loading = input<boolean>(false);

    readonly confirmed = output<void>();
    readonly cancelled = output<void>();

    readonly modalId = 'confirmationModal';

    readonly modalDialogClasses = computed(() => {
        const size = this.config().size || 'md';
        return `modal-dialog modal-dialog-centered${size !== 'md' ? ` modal-${size}` : ''}`;
    });

    readonly modalTitleClasses = computed(() => {
        const type = this.config().type || 'warning';
        const colorMap = {
            danger: 'text-danger',
            warning: 'text-warning',
            info: 'text-info',
            success: 'text-success'
        };
        return `modal-title ${colorMap[type]}`;
    });

    readonly iconClass = computed(() => {
        const config = this.config();
        if (config.icon) {
            return `bi bi-${config.icon}`;
        }

        const type = config.type || 'warning';
        const iconMap = {
            danger: 'bi bi-exclamation-triangle',
            warning: 'bi bi-exclamation-triangle',
            info: 'bi bi-info-circle',
            success: 'bi bi-check-circle'
        };

        return iconMap[type];
    });

    readonly itemsContainerClasses = computed(() => 'confirmation-items alert alert-light border');

    readonly warningAlertClasses = computed(() => 'warning-alert d-flex align-items-center mt-3');

    readonly confirmButtonClasses = computed(() => {
        const type = this.config().type || 'warning';
        const variantMap = {
            danger: 'btn-danger',
            warning: 'btn-warning',
            info: 'btn-primary',
            success: 'btn-success'
        };
        return `btn ${variantMap[type]}`;
    });

    readonly confirmButtonIconClass = computed(() => {
        const type = this.config().type || 'warning';
        const iconMap = {
            danger: 'bi bi-trash me-1',
            warning: 'bi bi-exclamation-triangle me-1',
            info: 'bi bi-info-circle me-1',
            success: 'bi bi-check-circle me-1'
        };
        return iconMap[type];
    });

    readonly visibleItems = computed(() => {
        const items = this.config().items || [];
        const maxItems = this.config().maxItemsToShow || 5;
        return items.slice(0, maxItems);
    });

    readonly hasMoreItems = computed(() => {
        const items = this.config().items || [];
        const maxItems = this.config().maxItemsToShow || 5;
        return items.length > maxItems;
    });

    readonly remainingItemsCount = computed(() => {
        const items = this.config().items || [];
        const maxItems = this.config().maxItemsToShow || 5;
        return Math.max(0, items.length - maxItems);
    });

    readonly isWarningType = computed(() => {
        const type = this.config().type || 'warning';
        return type === 'warning' || type === 'danger';
    });

    defaultItemIcon(): string | null {
        const type = this.config().type || 'warning';
        const iconMap = {
            danger: 'trash',
            warning: 'exclamation-triangle',
            info: 'info-circle',
            success: 'check-circle'
        };
        return iconMap[type] || null;
    }

    getItemIconClass(item: ConfirmationItem): string {
        const icon = item.icon || this.defaultItemIcon();
        return icon ? `bi bi-${icon}` : '';
    }

    onConfirm(): void {
        this.confirmed.emit();
    }

    onCancel(): void {
        this.cancelled.emit();
    }
}
