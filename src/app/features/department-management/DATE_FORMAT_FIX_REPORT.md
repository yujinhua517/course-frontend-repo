# Department 日期格式修正報告

## 🚨 **問題描述**

Department 組件出現錯誤：
```
ERROR TypeError: this.department(...).createTime?.toISOString is not a function
```

**根本原因**：Department model 中的 `createTime` 和 `updateTime` 型別不一致

## 📊 **問題分析**

### 1. **Model 定義 vs 實際資料**
```typescript
// Model 定義 (目前已修正)
interface Department {
    createTime: string;  // ✅ 現在是 string
    updateTime?: string; // ✅ 現在是 string
}

// API 回傳資料 (正確)
{
    "create_time": "2024-01-10T08:00:00",  // 字串格式
    "update_time": "2024-06-01T08:30:00"   // 字串格式
}
```

### 2. **Service Mock Data 問題**
```typescript
// ❌ 錯誤：使用 Date 物件
createTime: new Date('2024-01-10T08:00:00'),
updateTime: new Date('2024-06-01T08:30:00'),

// ✅ 正確：使用 ISO 字串
createTime: '2024-01-10T08:00:00',
updateTime: '2024-06-01T08:30:00',
```

## ✅ **已完成的修正**

### 1. **Department Model** ✅
- 已將 `createTime` 和 `updateTime` 改為 `string` 類型

### 2. **Department View Component** ✅
- 已修正日期格式化邏輯
- 新增 `formatDateString()` 輔助函數

```typescript
// 修正後的處理方式
private formatDateString(dateString?: string): string | undefined {
    return dateString ? new Date(dateString).toISOString() : undefined;
}

// 使用方式
value: this.formatDateString(this.department().createTime),
```

## ❌ **待修正問題**

### 1. **Service Mock Data**
所有 mock data 中的日期還在使用 `new Date()` 需要改為字串：

```typescript
// 需要修正的位置（約40個錯誤）
createTime: new Date('2024-01-10T08:00:00'),  // ❌
updateTime: new Date('2024-06-01T08:30:00'),  // ❌

// 應該改為
createTime: '2024-01-10T08:00:00',  // ✅
updateTime: '2024-06-01T08:30:00',  // ✅
```

### 2. **Service 其他方法**
- `createDepartment()` 方法中的日期處理
- `updateDepartment()` 方法中的日期處理
- `getMockDepartments()` 中的日期轉換邏輯

## 🛠️ **修正策略**

### 方案 1：批量替換 Mock Data （推薦）
使用編輯器的查找替換功能：
- 查找：`createTime: new Date\\('([^']*)'\\),`
- 替換：`createTime: '$1',`
- 查找：`updateTime: new Date\\('([^']*)'\\),`
- 替換：`updateTime: '$1',`

### 方案 2：轉換函數
在 service 中加入轉換函數：
```typescript
private toISOString(date: Date | string): string {
    return typeof date === 'string' ? date : date.toISOString();
}
```

## 🎯 **預期效果**

修正後將解決：
1. ✅ `toISOString is not a function` 錯誤
2. ✅ TypeScript 編譯錯誤
3. ✅ 統一的日期格式處理
4. ✅ 正確的日期顯示

## 📝 **建議下一步**

1. **立即修正**：批量替換所有 mock data 中的 `new Date()` 為字串
2. **測試確認**：確保 department view 正常顯示日期
3. **全面檢查**：確認其他 department 相關功能正常

是否要我現在批量修正這些 mock data 中的日期格式？
