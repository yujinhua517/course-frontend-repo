import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'jobRoleStatus',
    standalone: true
})
export class JobRoleStatusPipe implements PipeTransform {
    transform(value: boolean): string {
        return value ? '啟用' : '停用';
    }
}
