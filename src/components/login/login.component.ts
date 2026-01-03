
import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent {
  private authService = inject(AuthService);
  
  username = signal('storeowner');
  password = signal('password');

  login(): void {
    this.authService.login(this.username(), this.password());
  }
}
