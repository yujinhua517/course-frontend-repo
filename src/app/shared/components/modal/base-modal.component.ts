import { Component, input, output, computed, signal, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup } from '@angular/forms';

export interface ModalConfig {
    title: string;
    icon?: string;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    showCloseButton?: boolean;
    closeOnBackdropClick?: boolean;
}

/**
 * 錯誤提示元件
 */
@Component({
    selector: 'app-error-alert',
    imports: [CommonModule],
    template: `
        @if (error()) {
        <div class="alert alert-danger d-flex align-items-center mb-3" role="alert">
            <i class="bi bi-exclamation-triangle-fill me-2"></i>
            <div>{{ error() }}</div>
            @if (showCloseButton()) {
            <button type="button" class="btn-close ms-auto" (click)="onClearError()" [attr.aria-label]="closeButtonLabel()">
            </button>
            }
        </div>
        }
    `,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ErrorAlertComponent {
    readonly error = input<string | null>(null);
    readonly showCloseButton = input<boolean>(true);
    readonly closeButtonLabel = input<string>('關閉錯誤訊息');
    readonly clearError = output<void>();

    onClearError(): void {
        this.clearError.emit();
    }
}

/**
 * 表單按鈕元件
 */
@Component({
    selector: 'app-form-buttons',
    imports: [CommonModule],
    template: `
        <div class="d-flex justify-content-end gap-2">
  <button 
    type="button" 
    class="btn btn-secondary" 
    [disabled]="loading()" 
    (click)="onCancel()"
    [attr.aria-label]="cancelButtonLabel()">
    <i class="bi bi-x-lg me-1"></i>
    {{ cancelButtonText() }}
  </button>

  <button 
    type="submit" 
    class="btn btn-primary" 
    [disabled]="loading() || submitDisabled()"
    [attr.aria-label]="submitButtonLabel()"
    (click)="onSubmitClick($event)"
    [attr.form]="formId()">
    @if (loading()) {
      <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
    }
    <i class="bi bi-check-lg me-1"></i>
    {{ submitButtonText() }}
  </button>
</div>`,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class FormButtonsComponent {
    readonly loading = input<boolean>(false);
    readonly submitDisabled = input<boolean>(false);
    readonly submitButtonText = input<string>('提交');
    readonly cancelButtonText = input<string>('取消');
    readonly submitButtonLabel = input<string | undefined>(undefined);
    readonly cancelButtonLabel = input<string | undefined>(undefined);
    // 當按鈕置於 form 外部 (例如 modal footer slot)，需指定 formId 以觸發該 form 的提交
    readonly formId = input<string | undefined>(undefined);
    readonly cancelled = output<void>();

    onCancel(): void {
        this.cancelled.emit();
    }
    onSubmitClick(event: Event): void {
        console.log('[FormButtonsComponent] submit button clicked', event);
    }

}

/**
 * 表單欄位元件
 */
@Component({
    selector: 'app-form-field',
    imports: [CommonModule],
    template: `
        <div [class]="containerClass()">
            @if (label()) {
            <label [for]="fieldId()" [class]="labelClass()">
                @if (icon()) {
                <i [class]="icon() + ' me-1'"></i>
                }
                {{ label() }}
            </label>
            }

            <ng-content></ng-content>

            @if (error()) {
            <div [id]="fieldId() + '_error'" class="invalid-feedback">{{ error() }}</div>
            }

            @if (helpText()) {
            <div [id]="fieldId() + '_help'" class="form-text">{{ helpText() }}</div>
            }
        </div>
    `,
    styles: `
        @use "../../../../styles/variables" as *;

        .form-label i {
            color: $brand-primary;
            margin-right: 0.5rem;
        }`,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class FormFieldComponent {
    readonly fieldId = input.required<string>();
    readonly label = input<string>();
    readonly icon = input<string>();
    readonly error = input<string | null>(null);
    readonly helpText = input<string>();
    readonly required = input<boolean>(false);
    readonly containerClass = input<string>('mb-3');

    readonly labelClass = computed(() => {
        const baseClass = 'form-label';
        const requiredClass = this.required() ? 'required' : '';
        return `${baseClass} ${requiredClass}`.trim();
    });
}

/**
 * 表單模態基底元件
 */
@Component({
    selector: 'app-form-modal-base',
    template: '',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export abstract class FormModalBaseComponent<TEntity = any, TCreateDto = any, TUpdateDto = any> {
    protected fb = inject(FormBuilder);

    readonly mode = input.required<'create' | 'edit'>();
    readonly entity = input<TEntity | null>(null);
    readonly saved = output<TEntity>();
    readonly cancelled = output<void>();
    readonly loading = signal(false);
    readonly error = signal<string | null>(null);

    protected form!: FormGroup;

    readonly isEditMode = computed(() => this.mode() === 'edit');
    readonly submitButtonText = computed(() => this.isEditMode() ? '更新' : '建立');

    abstract readonly modalConfig: () => ModalConfig;
    abstract readonly fieldLabels: Record<string, string>;

    protected abstract initializeForm(): void;
    protected abstract performSubmit(data: TCreateDto | TUpdateDto): Promise<TEntity>;
    protected abstract getEntityName(): string;

    getFieldError(fieldName: string): string | null {
        const field = this.form.get(fieldName);
        if (field?.invalid && (field.dirty || field.touched)) {
            if (field.errors?.['required']) {
                return this.getFieldLabel(fieldName) + '為必填欄位';
            }
            if (field.errors?.['maxlength']) {
                const maxLength = field.errors['maxlength'].requiredLength;
                return this.getFieldLabel(fieldName) + `不可超過 ${maxLength} 個字元`;
            }
            if (field.errors?.['minlength']) {
                const minLength = field.errors['minlength'].requiredLength;
                return this.getFieldLabel(fieldName) + `至少需要 ${minLength} 個字元`;
            }
            if (field.errors?.['email']) {
                return this.getFieldLabel(fieldName) + '格式不正確';
            }
            if (field.errors?.['pattern']) {
                return this.getFieldLabel(fieldName) + '格式不正確';
            }
        }
        return null;
    }

    protected getFieldLabel(fieldName: string): string {
        return this.fieldLabels[fieldName] || fieldName;
    }

    isFieldInvalid(fieldName: string): boolean {
        const field = this.form.get(fieldName);
        return !!(field?.invalid && (field.dirty || field.touched));
    }

    protected markAllFieldsAsTouched(): void {
        Object.keys(this.form.controls).forEach(key => {
            this.form.get(key)?.markAsTouched();
        });
    }

    async onSubmit(): Promise<void> {
        if (this.form.invalid) {
            this.markAllFieldsAsTouched();
            return;
        }

        this.loading.set(true);
        this.error.set(null);

        try {
            const formValue = this.form.getRawValue();
            const result = await this.performSubmit(formValue);
            this.saved.emit(result);
        } catch (error: any) {
            const errorMessage = this.isEditMode()
                ? `更新${this.getEntityName()}失敗，請稍後再試`
                : `建立${this.getEntityName()}失敗，請稍後再試`;
            this.error.set(errorMessage);
            console.error('Form submission error:', error);
        } finally {
            this.loading.set(false);
        }
    }

    onCancel(): void {
        this.cancelled.emit();
    }

    clearError(): void {
        this.error.set(null);
    }
}

/**
 * 基本模態元件
 */
@Component({
    selector: 'app-base-modal',
    imports: [CommonModule],
    templateUrl: './base-modal.component.html',
    styleUrl: './base-modal.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class BaseModalComponent {
    readonly config = input.required<ModalConfig>();
    readonly loading = input<boolean>(false);
    readonly show = input<boolean>(true);
    readonly closed = output<void>();
    readonly backdropClicked = output<void>();

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
