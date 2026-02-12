import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
} from "@angular/core";
import { AuthService } from "../../services/auth.service";

@Component({
  selector: "app-login",
  templateUrl: "./login.component.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent {
  private authService = inject(AuthService);

  username = signal("storeowner");
  password = signal("password");
  isLampOn = signal(false);

  toggleLamp(): void {
    this.isLampOn.update((v) => !v);
  }

  login(): void {
    if (!this.isLampOn()) return;

    this.authService.login(this.username(), this.password()).subscribe({
      next: () => {},
      error: () => {},
    });
  }
}
