import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { LoginComponent } from './components/login/login.component';
import { LayoutComponent } from './components/layout/layout.component';
import { InventoryListComponent } from './components/inventory/inventory-list.component';
import { InvoiceCreateComponent } from './components/billing/invoice-create.component';
import { InvoicePrintComponent } from './components/billing/invoice-print.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { InvoiceListComponent } from './components/billing/invoice-list.component';
import { ProductDetailComponent } from './components/inventory/product-detail.component';

export const APP_ROUTES: Routes = [
  { path: 'login', component: LoginComponent },
  {
    path: '',
    component: LayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardComponent },
      { path: 'inventory', component: InventoryListComponent },
      { path: 'inventory/:id', component: ProductDetailComponent },
      { path: 'billing', component: InvoiceListComponent },
      { path: 'billing/create', component: InvoiceCreateComponent },
      { path: 'billing/print/:id', component: InvoicePrintComponent },
    ],
  },
  { path: '**', redirectTo: '/login' }
];