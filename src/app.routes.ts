
import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { LoginComponent } from './components/login/login.component';
import { LayoutComponent } from './components/layout/layout.component';
import { InventoryListComponent } from './components/inventory/inventory-list.component';
import { InvoiceCreateComponent } from './components/billing/invoice-create.component';
import { InvoicePrintComponent } from './components/billing/invoice-print.component';

export const APP_ROUTES: Routes = [
  { path: 'login', component: LoginComponent },
  {
    path: '',
    component: LayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'inventory', pathMatch: 'full' },
      { path: 'inventory', component: InventoryListComponent },
      { path: 'billing', component: InvoiceCreateComponent },
      { path: 'billing/print/:id', component: InvoicePrintComponent },
    ],
  },
  { path: '**', redirectTo: '/login' }
];
