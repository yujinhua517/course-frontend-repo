# InfoDisplay 組件

`InfoDisplay` 是一個通用的資訊顯示組件，用於統一應用程式中的資料展示格式。特別適用於詳細檢視頁面、儀表板卡片、以及任何需要結構化顯示資料的場景。

## 📁 檔案位置
```
src/app/shared/components/info-display/
└── info-display.component.ts
```

## 🎯 功能特色

- 📱 **響應式設計** - 支援 1-4 欄自適應佈局
- 🎨 **多種資料類型** - 文字、徽章、日期、狀態、連結等
- 🎭 **圖示整合** - 完整的 Bootstrap Icons 支援
- 🎛️ **高度可配置** - 樣式、佈局、顯示規則全可控
- ♿ **無障礙設計** - 語義化 HTML 與 ARIA 支援
- 📊 **智能空值處理** - 可選擇顯示或隱藏空項目

## 🔧 使用方式

### 基本使用
```typescript
import { InfoDisplayComponent, InfoDisplayConfig } from './shared/components/info-display/info-display.component';

@Component({
  imports: [InfoDisplayComponent],
  // ...
})
export class YourComponent {
  infoConfig: InfoDisplayConfig = {
    title: '基本資訊',
    columns: 2,
    items: [
      {
        label: '姓名',
        value: '張三',
        icon: 'person'
      },
      {
        label: '狀態',
        value: true,
        icon: 'check-circle',
        type: 'status'
      }
    ]
  };
}
```

```html
<app-info-display [config]="infoConfig"></app-info-display>
```

## 📋 API 參考

### InfoDisplayConfig
```typescript
interface InfoDisplayConfig {
  title?: string;           // 卡片標題
  items: InfoItem[];        // 顯示項目陣列
  columns?: 1 | 2 | 3 | 4; // 欄位數量（預設: 2）
  cardClass?: string;       // 卡片自定義樣式
  titleClass?: string;      // 標題自定義樣式
  itemClass?: string;       // 項目自定義樣式
  showEmptyItems?: boolean; // 是否顯示空值項目（預設: false）
}
```

### InfoItem
```typescript
interface InfoItem {
  label: string;                           // 顯示標籤
  value: string | number | boolean | null | undefined; // 資料值
  type?: 'text' | 'badge' | 'date' | 'status' | 'email' | 'phone' | 'link'; // 顯示類型
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' | 'light' | 'dark'; // 顏色變體
  icon?: string;                           // Bootstrap Icon 名稱
  href?: string;                           // 連結網址（type='link' 時使用）
  className?: string;                      // 自定義樣式
  visible?: boolean;                       // 是否顯示（預設: true）
}
```

## 🎨 資料類型範例

### 文字類型 (text)
```typescript
{
  label: '部門名稱',
  value: '資訊部',
  icon: 'building'
}
```

### 徽章類型 (badge)
```typescript
{
  label: '部門層級',
  value: '第二級',
  type: 'badge',
  variant: 'info',
  icon: 'diagram-3'
}
```

### 狀態類型 (status)
```typescript
{
  label: '啟用狀態',
  value: true, // boolean 會自動顯示為 '啟用' / '停用'
  type: 'status',
  icon: 'toggle-on'
}
```

### 日期類型 (date)
```typescript
{
  label: '建立時間',
  value: '2024-01-15T10:30:00Z',
  type: 'date',
  icon: 'calendar-plus'
}
```

### 郵件類型 (email)
```typescript
{
  label: '聯絡信箱',
  value: 'user@example.com',
  type: 'email',
  icon: 'envelope'
}
```

### 電話類型 (phone)
```typescript
{
  label: '連絡電話',
  value: '02-1234-5678',
  type: 'phone',
  icon: 'telephone'
}
```

### 連結類型 (link)
```typescript
{
  label: '官方網站',
  value: '查看網站',
  type: 'link',
  href: 'https://example.com',
  icon: 'link-45deg'
}
```

## 🎛️ 佈局配置

### 單欄佈局
```typescript
{
  title: '詳細描述',
  columns: 1,
  items: [
    {
      label: '描述',
      value: '這是一段較長的描述文字...'
    }
  ]
}
```

### 四欄佈局
```typescript
{
  title: '統計資訊',
  columns: 4,
  items: [
    { label: '總數', value: 100 },
    { label: '啟用', value: 85 },
    { label: '停用', value: 15 },
    { label: '比例', value: '85%' }
  ]
}
```

### 響應式行為
- **桌面** (≥992px): 按設定欄數顯示
- **平板** (768px-991px): 3-4欄自動降為2欄
- **手機** (≤767px): 強制單欄顯示

## 🎨 樣式自定義

### 自定義卡片樣式
```typescript
{
  title: '重要資訊',
  cardClass: 'border-primary shadow-sm',
  titleClass: 'bg-primary text-white',
  items: [...]
}
```

### 自定義項目樣式
```typescript
{
  label: '重要數值',
  value: '999',
  className: 'text-danger fw-bold fs-5'
}
```

## 📱 實際應用範例

以部門管理為例：

```typescript
// department-view.component.ts
export class DepartmentViewComponent {
  department = input<Department | null>(null);

  basicInfoConfig = computed<InfoDisplayConfig>(() => ({
    title: '基本資訊',
    columns: 2,
    items: [
      {
        label: '部門代碼',
        value: this.department()?.dept_code,
        icon: 'hash',
        className: 'fw-medium text-primary'
      },
      {
        label: '部門名稱',
        value: this.department()?.dept_name,
        icon: 'building',
        className: 'fw-medium'
      },
      {
        label: '部門層級',
        value: this.department()?.dept_level_label,
        icon: 'diagram-3',
        type: 'badge',
        variant: 'info'
      },
      {
        label: '狀態',
        value: this.department()?.is_active,
        icon: 'toggle-on',
        type: 'status'
      }
    ]
  }));

  systemInfoConfig = computed<InfoDisplayConfig>(() => ({
    title: '系統資訊',
    columns: 2,
    items: [
      {
        label: '建立時間',
        value: this.department()?.create_time?.toISOString(),
        icon: 'calendar-plus',
        type: 'date'
      },
      {
        label: '最後更新',
        value: this.department()?.update_time?.toISOString(),
        icon: 'calendar-check',
        type: 'date'
      },
      {
        label: '建立者',
        value: this.department()?.create_user || '系統',
        icon: 'person-plus'
      },
      {
        label: '更新者',
        value: this.department()?.update_user || '系統',
        icon: 'person-gear'
      }
    ]
  }));
}
```

```html
<!-- department-view.component.html -->
<div class="modal-body">
  <div class="department-details">
    <!-- 基本資訊 -->
    <app-info-display [config]="basicInfoConfig()" class="mb-4"></app-info-display>
    
    <!-- 系統資訊 -->
    <app-info-display [config]="systemInfoConfig()"></app-info-display>
  </div>
</div>
```

## 🔄 與其他組件的整合

InfoDisplay 組件可以與以下組件搭配使用：

- **Modal 組件** - 在彈窗中顯示詳細資訊
- **Card 組件** - 作為卡片內容
- **Tab 組件** - 分頁顯示不同類別的資訊
- **Accordion 組件** - 摺疊式資訊展示

## 🎯 最佳實踐

1. **合理分組** - 將相關資訊歸類到同一個 InfoDisplay
2. **適當欄數** - 根據資訊複雜度選擇合適的欄數
3. **圖示使用** - 為每個項目添加語義化的圖示
4. **空值處理** - 設定 `showEmptyItems: false` 隱藏空值項目
5. **響應式考量** - 在手機裝置上避免使用過多欄位
6. **樣式一致** - 在同一應用中保持 InfoDisplay 的樣式一致性

## 🔧 擴展性

組件設計為高度可擴展，如需新增資料類型，只需：

1. 在 `InfoItem.type` 中新增類型
2. 在模板的 `@switch` 中新增對應的 case
3. 實作相應的格式化邏輯

這種設計確保了組件的可維護性和可擴展性。
