import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter, withHashLocation } from '@angular/router';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

import { AppComponent } from './src/app.component';
import { APP_ROUTES } from './src/app.routes';
import { authInterceptor } from './src/services/auth.interceptor';

bootstrapApplication(AppComponent, {
  providers: [
    provideZonelessChangeDetection(),
    provideRouter(APP_ROUTES, withHashLocation()),
    provideHttpClient(withInterceptors([authInterceptor])),
  ],
}).catch((err) => console.error(err));
