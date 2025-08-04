import { Pipe, PipeTransform, inject } from '@angular/core';
import { DepartmentService } from '../../features/department-management/services/department.service';
import { Observable, of, map } from 'rxjs';

@Pipe({
    name: 'departmentName',
    pure: false
})
export class DepartmentNamePipe implements PipeTransform {
    private departmentService = inject(DepartmentService);
    private cache = new Map<number, string>();

    transform(deptId: number | null | undefined): Observable<string> {
        if (!deptId) {
            return of('未指定部門');
        }

        // 檢查快取
        if (this.cache.has(deptId)) {
            return of(this.cache.get(deptId)!);
        }

        // 從服務獲取部門資料
        return this.departmentService.getActiveDepartments().pipe(
            map(departments => {
                const department = departments.find(d => d.deptId === deptId);
                const name = department ? department.deptName : `部門 ${deptId}`;
                this.cache.set(deptId, name);
                return name;
            })
        );
    }
}
