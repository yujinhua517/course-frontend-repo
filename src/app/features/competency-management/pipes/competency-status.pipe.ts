import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'competencyStatus',
    standalone: true
})
export class CompetencyStatusPipe implements PipeTransform {
    transform(value: boolean): string {
        return value ? '啟用' : '停用';
    }
}
