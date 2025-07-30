# 共用元件重構專案

本專案旨在識別並重構 Angular 應用程式中的重複元件，提升程式碼的可維護性和一致性。

## 📊 重構成果總覽

### 已識別的重複模式
1. **Modal 彈窗結構** - 在 Department、Employee、Competency 模組中發現相同的彈窗結構
2. **狀態切換按鈕** - 各模組都有類似的啟用/停用狀態切換功能
3. **操作按鈕組** - 檢視、編輯、刪除按鈕組在各列表頁面重複出現

### 建立的共用元件

#### 1. BaseModalComponent (`shared/components/modal/`)
提供統一的彈窗結構，支援：
- 可配置標題、圖示、大小
- Slot-based 內容投影 (header、body、footer)
- 鍵盤操作支援 (ESC 關閉)
- 無障礙功能支援

#### 2. StatusBadgeComponent (`shared/components/status-badge/`)
統一的狀態顯示和切換元件，支援：
- 多種狀態值類型 (boolean、number、string)
- 可自定義顯示文字和樣式
- 可選的點擊切換功能
- 無障礙功能支援

#### 3. ActionButtonGroupComponent (`shared/components/action-buttons/`)
標準化的操作按鈕組，支援：
- 預設按鈕類型 (檢視、編輯、刪除)
- 可配置按鈕顯示/隱藏
- 權限控制整合
- 響應式設計

## 應用狀況

### ✅ 已完成遷移的模組

#### 1. Department Management 部門管理
- **DepartmentFormComponent** (`features/department-management/components/department-form/`)
  - ✅ 使用 `BaseModalComponent` 取代原有 modal 結構
  - ✅ 配置 `ModalConfig` 設定彈窗屬性
  - ✅ 使用 slot-based 內容投影
  
- **DepartmentListComponent** (`features/department-management/pages/department-list/`)
  - ✅ 使用 `StatusBadgeComponent` 取代狀態按鈕
  - ✅ 使用 `ActionButtonGroupComponent` 取代操作按鈕組
  - ✅ 配置對應的 `StatusConfig` 和 `ActionButtonConfig`

#### 2. Employee Management 員工管理
- **EmployeeFormComponent** (`features/employee-management/components/employee-form/`)
  - ✅ 使用 `BaseModalComponent` 取代原有 modal 結構
  - ✅ 配置 `ModalConfig` 設定彈窗屬性
  - ✅ 使用 slot-based 內容投影
  
- **EmployeeListComponent** (`features/employee-management/pages/employee-list/`)
  - ✅ 使用 `StatusBadgeComponent` 取代狀態按鈕
  - ✅ 使用 `ActionButtonGroupComponent` 取代操作按鈕組
  - ✅ 配置對應的 `StatusConfig` 和 `ActionButtonConfig`

#### 3. Competency Management 職能管理
- **CompetencyFormComponent** (`features/competency-management/components/competency-form/`)
  - ✅ 使用 `BaseModalComponent` 取代原有 modal 結構
  - ✅ 配置 `ModalConfig` 設定彈窗屬性
  - ✅ 使用 slot-based 內容投影
  
- **CompetencyListComponent** (`features/competency-management/pages/competency-list/`)
  - ✅ 使用 `StatusBadgeComponent` 取代狀態按鈕
  - ✅ 使用 `ActionButtonGroupComponent` 取代操作按鈕組
  - ✅ 配置對應的 `StatusConfig` 和 `ActionButtonConfig`

### 📊 遷移成果統計

#### 程式碼重複減少
- **Modal 結構**：從 3 個重複的 modal HTML 結構縮減為 1 個共用元件
- **狀態按鈕**：從 3 個重複的狀態切換邏輯統一為 1 個共用元件  
- **操作按鈕**：從 3 個重複的按鈕組統一為 1 個共用元件

#### 維護性提升
- **一致性**：所有模組使用相同的 UI 元件和互動模式
- **可擴展性**：新功能模組可直接使用現有共用元件
- **可維護性**：元件修改只需在一處進行，影響所有使用處

### 🎯 待處理項目

#### 尚未遷移的元件類型
1. **檢視元件 (View Components)**
   - `DepartmentViewComponent`
   - `EmployeeViewComponent` 
   - `CompetencyViewComponent`
   - 這些元件有相似的結構，可考慮建立 `BaseViewComponent`

2. **確認對話框 (Confirmation Dialogs)**
   - 刪除確認彈窗
   - 狀態變更確認彈窗
   - 可考慮建立 `ConfirmationDialogComponent`

3. **表格元件 (Table Components)** ✅ **已完成**
   - ✅ **DataTableComponent** - 新建立的通用表格元件
   - ✅ 統一的分頁邏輯整合
   - ✅ 統一的排序功能
   - ✅ 統一的選擇功能
   - ✅ 狀態與操作按鈕整合

## 🔧 使用指南

### BaseModalComponent 使用範例

```typescript
// Component
modalConfig = signal<ModalConfig>({
    title: '新增部門',
    icon: 'bi-building',
    size: 'lg'
});

// Template
<app-base-modal [config]="modalConfig()" (closed)="onModalClosed()">
    <div slot="body">
        <!-- 表單內容 -->
    </div>
    <div slot="footer">
        <button type="submit" form="departmentForm">儲存</button>
    </div>
</app-base-modal>
```

### StatusBadgeComponent 使用範例

```typescript
// Component
getStatusConfig(item: Department): StatusConfig {
    return {
        value: item.is_active,
        activeValue: 1,
        inactiveValue: 0,
        activeText: '啟用',
        inactiveText: '停用',
        clickable: this.hasUpdatePermission()
    };
}

// Template
<app-status-badge 
    [config]="getStatusConfig(department)"
    (statusToggled)="onStatusToggled(department, $event)">
</app-status-badge>
```

### ActionButtonGroupComponent 使用範例

```typescript
// Component
getActionConfig(item: Department): ActionButtonConfig {
    return {
        buttons: [
            { type: 'view', visible: this.hasReadPermission() },
            { type: 'edit', visible: this.hasUpdatePermission() },
            { type: 'delete', visible: this.hasDeletePermission() }
        ]
    };
}

// Template
<app-action-button-group
    [config]="getActionConfig(department)"
    (viewClicked)="onActionView(department)"
    (editClicked)="onActionEdit(department)"
    (deleteClicked)="onActionDelete(department)">
</app-action-button-group>
```

### DataTableComponent 使用範例

```typescript
// Component
readonly tableConfig = computed<DataTableConfig<Employee>>(() => ({
    columns: [
        {
            key: 'emp_code',
            label: '員工工號',
            sortable: true,
            primary: true,
            align: 'left'
        },
        {
            key: 'emp_name',
            label: '員工姓名',
            sortable: true,
            primary: true
        },
        {
            key: 'emp_email',
            label: '電子郵件',
            secondary: true
        },
        {
            key: 'hire_date',
            label: '到職日',
            type: 'date',
            sortable: true,
            dateFormat: 'yyyy/MM/dd',
            secondary: true
        },
        {
            key: 'create_time',
            label: '建立時間',
            type: 'date',
            sortable: true,
            dateFormat: 'yyyy/MM/dd HH:mm',
            secondary: true
        }
    ],
    showSelection: true,
    showStatus: true,
    showActions: true,
    statusConfig: {
        field: 'is_active',
        activeValue: true,
        inactiveValue: false,
        activeLabel: '在職',
        inactiveLabel: '離職'
    },
    actionConfig: {
        showView: true,
        showEdit: true,
        showDelete: true
    },
    trackBy: (index, item) => item.emp_id,
    emptyText: '暫無員工資料'
}));

// Template
<app-data-table 
    [config]="tableConfig()"
    [data]="employees()"
    [selectedItems]="selectedEmployees()"
    [sortConfig]="sortConfig()"
    [loading]="loading()"
    (sorted)="onSort($event)"
    (selectionChanged)="onSelectionChange($event)"
    (itemViewed)="onView($event)"
    (itemEdited)="onEdit($event)"
    (itemDeleted)="onDelete($event)"
    (statusToggled)="onToggleStatus($event)">
</app-data-table>
```

## 📝 最佳實踐

1. **配置方法命名**：使用 `getXxxConfig()` 模式命名配置方法
2. **事件處理**：使用 `onActionXxx()` 模式命名共用元件事件處理方法
3. **權限檢查**：在配置中整合權限檢查邏輯
4. **無障礙功能**：確保所有共用元件都包含適當的 ARIA 屬性
5. **DataTable 欄位配置**：
   - 使用 `primary: true` 標記主要欄位 (如 ID、名稱)
   - 使用 `secondary: true` 標記次要欄位 (如建立時間、備註)
   - 合理設定 `sortable` 屬性，避免對所有欄位開啟排序
   - 使用 `trackBy` 提升大數據集的渲染效能

## 🏆 專案效益

- **程式碼減少**：移除了大量重複的 HTML 和 TypeScript 程式碼
- **維護效率**：UI 變更只需修改共用元件
- **開發速度**：新功能可快速複用現有元件
- **使用者體驗**：確保整個應用程式的一致性
- **程式碼品質**：提升可讀性和可測試性
- **🆕 表格統一化**：所有列表頁面現在使用相同的表格結構和互動模式
