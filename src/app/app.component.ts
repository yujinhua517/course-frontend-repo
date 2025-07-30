import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { GlobalMessageComponent } from './core/message/global-message.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, GlobalMessageComponent],
  // template: `
  //   <h1>Welcome to {{title}}!</h1>

  //   <router-outlet />
  // `,
  // styles: [],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'course-angular-frontend';
}
