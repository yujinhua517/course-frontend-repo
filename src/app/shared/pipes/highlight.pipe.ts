import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'highlight',
    standalone: true
})

//支援多種資料類型
// ✅ 字串：employee.empName
// ✅ 數字：employee.empId, department.deptId
// ✅ 可能為空的值：department.managerId || '未指派'

export class HighlightPipe implements PipeTransform {
    transform(text: any, search: string): string {
        // 安全地轉換輸入為字串
        // 處理 null/undefined
        if (!text && text !== 0) return '';
        // 處理空搜尋
        if (!search) return String(text);

        // 安全字串轉換
        // 將輸入轉為字串
        const str = String(text);

        // Escape special regex characters in search string
        const pattern = search.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');

        return str.replace(new RegExp(pattern, 'gi'), match => `<mark>${match}</mark>`);
    }
}
