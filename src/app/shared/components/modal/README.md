# 統一模態元件使用指南

## 元件概述

所有模態相關元件已整合到 `base-modal.component.ts` 中，包含：

1. **BaseModalComponent** - 基本模態框架
2. **ErrorAlertComponent** - 錯誤訊息顯示
3. **FormButtonsComponent** - 表單按鈕
4. **FormFieldComponent** - 表單欄位包裝
5. **FormModalBaseComponent** - 表單模態基底類別

## 重構後的優勢

### ✅ 程式碼簡化
- 繼承 `FormModalBaseComponent` 減少 50-70% 樣板代碼
- 統一的輸入/輸出屬性和狀態管理
- 自動的表單驗證和錯誤處理

### ✅ 一致性保證
- 所有表單模態具有相同的外觀和行為
- 統一的錯誤訊息格式和按鈕佈局
- 標準化的無障礙支援

### ✅ 維護性提升
- 集中管理共同功能
- 修改一處即可影響所有表單
- 更容易添加新功能

## 使用範例

### TypeScript 組件
```typescript
export class YourFormComponent extends FormModalBaseComponent<Entity, CreateDto, UpdateDto> {
    private yourService = inject(YourService);

    // 必須實現的屬性
    readonly modalConfig = computed<ModalConfig>(() => ({
        title: this.isEditMode() ? '編輯項目' : '新增項目',
        icon: 'bi bi-your-icon',
        size: 'lg'
    }));

    readonly fieldLabels = {
        field1: '欄位1',
        field2: '欄位2'
        // ... 其他欄位標籤
    };

    // 必須實現的方法
    protected initializeForm(): void {
        this.form = this.fb.group({
            field1: ['', [Validators.required]],
            field2: ['', [Validators.maxLength(100)]]
        });
    }

    protected async performSubmit(data: CreateDto | UpdateDto): Promise<Entity> {
        if (this.isEditMode()) {
            return firstValueFrom(this.yourService.update(this.entity()!.id, data));
        } else {
            return firstValueFrom(this.yourService.create(data));
        }
    }

    protected getEntityName(): string {
        return '您的實體名稱';
    }
}
```

### HTML 模板
```html
<app-base-modal [config]="modalConfig()" [loading]="loading()" [show]="true" 
                (closed)="onCancel()" (backdropClicked)="onCancel()">

    <form [formGroup]="form" (ngSubmit)="onSubmit()" novalidate slot="body">
        <app-error-alert [error]="error()" (clearError)="clearError()"></app-error-alert>

        <div class="row g-3">
            <div class="col-12">
                <app-form-field fieldId="field1" label="欄位1" icon="bi bi-icon" 
                               [required]="true" [error]="getFieldError('field1')">
                    <input id="field1" type="text" class="form-control" 
                           [class.is-invalid]="isFieldInvalid('field1')"
                           formControlName="field1">
                </app-form-field>
            </div>
        </div>
    </form>

    <div slot="footer">
        <app-form-buttons [loading]="loading()" 
                         [submitDisabled]="form.invalid"
                         [submitButtonText]="submitButtonText()"
                         (cancelled)="onCancel()">
        </app-form-buttons>
    </div>
</app-base-modal>
```

## 導入語句
```typescript
import { 
    BaseModalComponent, 
    FormModalBaseComponent, 
    ErrorAlertComponent,
    FormButtonsComponent,
    FormFieldComponent,
    ModalConfig 
} from '../../../../shared/components/modal';
```

## 重構檢查清單

- [ ] 繼承 `FormModalBaseComponent`
- [ ] 實現必要的抽象方法和屬性
- [ ] 使用 `app-error-alert` 替換自定義錯誤顯示
- [ ] 使用 `app-form-buttons` 替換自定義按鈕
- [ ] 使用 `app-form-field` 包裝表單欄位
- [ ] 移除重複的驗證邏輯
- [ ] 更新 imports 陣列
