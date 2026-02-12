import { Injectable, inject, signal } from "@angular/core";
import { Router } from "@angular/router";
import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { catchError, map, tap, throwError } from "rxjs";
import { NotificationService } from "./notification.service";

const API_URL = "http://localhost:3001";
const ACCESS_TOKEN_KEY = "accessToken";
const CURRENT_USER_KEY = "currentUser";

type AuthUser = { id: string; username: string; email: string };
type LoginResponse = { user: AuthUser; accessToken: string };

@Injectable({ providedIn: "root" })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private notificationService = inject(NotificationService);

  accessToken = signal<string | null>(localStorage.getItem(ACCESS_TOKEN_KEY));
  currentUser = signal<AuthUser | null>(this.loadUser());

  login(username: string, password: string) {
    return this.http
      .post<LoginResponse>(`${API_URL}/auth/login`, { username, password })
      .pipe(
        tap((res) => {
          localStorage.setItem(ACCESS_TOKEN_KEY, res.accessToken);
          localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(res.user));
          this.accessToken.set(res.accessToken);
          this.currentUser.set(res.user);

          this.notificationService.show("Welcome back!");
          this.router.navigate(["/dashboard"]);
        }),
        map(() => true),
        catchError((err: HttpErrorResponse) => {
          this.notificationService.show(
            err?.error?.message ?? "Login failed",
            "error",
          );
          return throwError(() => err);
        }),
      );
  }

  logout(): void {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(CURRENT_USER_KEY);
    this.accessToken.set(null);
    this.currentUser.set(null);
    this.router.navigate(["/login"]);
    this.notificationService.show("You have been logged out.");
  }

  isAuthenticated(): boolean {
    return !!this.accessToken();
  }

  private loadUser(): AuthUser | null {
    const raw = localStorage.getItem(CURRENT_USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as AuthUser;
    } catch {
      return null;
    }
  }
}
