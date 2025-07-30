import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'highlight',
    standalone: true
})
export class HighlightPipe implements PipeTransform {
    transform(text: string, search: string): string {
        if (!search) return text;
        // Escape special regex characters in search string
        const pattern = search.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
        return text.replace(new RegExp(pattern, 'gi'), match => `<mark>${match}</mark>`);
    }
}
