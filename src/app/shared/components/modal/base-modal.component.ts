import { Component, input, output, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface ModalConfig {
    title: string;
    icon?: string;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    showCloseButton?: boolean;
    closeOnBackdropClick?: boolean;
}

@Component({
    selector: 'app-base-modal',
    imports: [CommonModule],
    templateUrl: './base-modal.component.html',
    styleUrl: './base-modal.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class BaseModalComponent {
    // 輸入屬性
    readonly config = input.required<ModalConfig>();
    readonly loading = input<boolean>(false);
    readonly show = input<boolean>(true);

    // 輸出事件
    readonly closed = output<void>();
    readonly backdropClicked = output<void>();

    // 計算屬性
    readonly modalSizeClass = computed(() => {
        const size = this.config().size || 'lg';
        return `modal-${size}`;
    });

    readonly shouldShowCloseButton = computed(() =>
        this.config().showCloseButton !== false
    );

    readonly shouldCloseOnBackdrop = computed(() =>
        this.config().closeOnBackdropClick !== false
    );

    onClose(): void {
        this.closed.emit();
    }

    onBackdropClick(): void {
        this.backdropClicked.emit();
        if (this.shouldCloseOnBackdrop()) {
            this.onClose();
        }
    }
}
