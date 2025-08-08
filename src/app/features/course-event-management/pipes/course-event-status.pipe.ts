import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'courseEventStatus',
    standalone: true
})
export class CourseEventStatusPipe implements PipeTransform {
    transform(value: boolean): string {
        return value ? '啟用' : '停用';
    }
}
