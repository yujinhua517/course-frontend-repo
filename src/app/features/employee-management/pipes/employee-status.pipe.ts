import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'employeeStatus',
    standalone: true
})
export class EmployeeStatusPipe implements PipeTransform {
    transform(value: boolean): string {
        return value ? '在職' : '離職';
    }
}
