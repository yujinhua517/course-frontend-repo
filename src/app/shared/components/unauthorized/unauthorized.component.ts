import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
    selector: 'app-unauthorized',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './unauthorized.component.html',
    styleUrls: ['./unauthorized.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class UnauthorizedComponent {
    private readonly location = inject(Location);

    goBack(): void {
        this.location.back();
    }
}
