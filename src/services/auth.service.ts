
import { Injectable, signal, inject } from '@angular/core';
import { Router } from '@angular/router';
import { NotificationService } from './notification.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private router = inject(Router);
  private notificationService = inject(NotificationService);
  
  // In a real app, this would be determined by a token
  currentUser = signal<string | null>(localStorage.getItem('currentUser'));

  login(username: string, password_unused: string): boolean {
    // Mock login logic
    if (username.trim()) {
      localStorage.setItem('currentUser', username);
      this.currentUser.set(username);
      this.notificationService.show('Welcome back!');
      this.router.navigate(['/inventory']);
      return true;
    }
    this.notificationService.show('Invalid credentials.', 'error');
    return false;
  }

  logout(): void {
    localStorage.removeItem('currentUser');
    this.currentUser.set(null);
    this.router.navigate(['/login']);
    this.notificationService.show('You have been logged out.');
  }

  isAuthenticated(): boolean {
    return !!this.currentUser();
  }
}
