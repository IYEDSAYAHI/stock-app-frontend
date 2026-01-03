
import { Component, ChangeDetectionStrategy, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { InventoryService } from '../../services/inventory.service';
import { InvoiceService } from '../../services/invoice.service';
import { Product } from '../../models/product.model';
import { InvoiceItem } from '../../models/invoice.model';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-invoice-create',
  templateUrl: './invoice-create.component.html',
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InvoiceCreateComponent {
  private inventoryService = inject(InventoryService);
  private invoiceService = inject(InvoiceService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);

  customerName = signal('Walk-in Customer');
  searchTerm = signal('');
  invoiceItems = signal<InvoiceItem[]>([]);
  showSearchResults = signal(false);

  allProducts = this.inventoryService.products;

  searchResults = computed(() => {
    const term = this.searchTerm().toLowerCase();
    if (!term) return [];
    return this.allProducts().filter(p => 
      p.name.toLowerCase().includes(term) && 
      !this.invoiceItems().some(item => item.product.id === p.id) &&
      p.quantityInStock > 0
    );
  });

  subtotal = computed(() => this.invoiceItems().reduce((acc, item) => acc + item.total, 0));
  tax = computed(() => this.subtotal() * 0.08); // 8% tax
  total = computed(() => this.subtotal() + this.tax());

  constructor() {
    effect(() => {
      this.showSearchResults.set(this.searchTerm().length > 0 && this.searchResults().length > 0);
    });
  }

  onSearch(event: Event) {
    this.searchTerm.set((event.target as HTMLInputElement).value);
  }

  addProductToInvoice(product: Product) {
    this.invoiceItems.update(items => [
      ...items,
      { product, quantity: 1, price: product.price, total: product.price }
    ]);
    this.searchTerm.set('');
  }

  updateItemQuantity(productId: string, event: Event) {
    const quantity = parseInt((event.target as HTMLInputElement).value, 10);
    this.invoiceItems.update(items => 
      items.map(item => {
        if (item.product.id === productId) {
          const productInStock = this.allProducts().find(p => p.id === productId)?.quantityInStock || 0;
          const newQuantity = Math.max(1, Math.min(quantity, productInStock));
          if(quantity > productInStock) {
            this.notificationService.show(`Only ${productInStock} units of ${item.product.name} in stock.`, 'error');
          }
          return { ...item, quantity: newQuantity, total: newQuantity * item.price };
        }
        return item;
      })
    );
  }

  removeItem(productId: string) {
    this.invoiceItems.update(items => items.filter(item => item.product.id !== productId));
  }
  
  createInvoice() {
    if (this.invoiceItems().length === 0) {
      this.notificationService.show('Cannot create an empty invoice.', 'error');
      return;
    }
    const newInvoice = this.invoiceService.createInvoice({
      customerName: this.customerName(),
      items: this.invoiceItems(),
      subtotal: this.subtotal(),
      tax: this.tax(),
      total: this.total()
    });

    if (newInvoice) {
      this.invoiceItems.set([]);
      this.customerName.set('Walk-in Customer');
      this.router.navigate(['/billing/print', newInvoice.id]);
    }
  }
}
