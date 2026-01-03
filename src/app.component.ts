import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NotificationComponent } from './components/shared/notification.component';
import { ThemeService } from './services/theme.service';

@Component({
  selector: 'app-root',
  template: `
    <router-outlet></router-outlet>
    <app-notification></app-notification>
  `,
  imports: [RouterOutlet, NotificationComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  // Inject to initialize the service at app startup
  private themeService = inject(ThemeService);
}
