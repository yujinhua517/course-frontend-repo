import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'departmentStatus',
    standalone: true
})
export class DepartmentStatusPipe implements PipeTransform {
    transform(value: boolean): string {
        return value ? '啟用' : '停用';
    }
}
