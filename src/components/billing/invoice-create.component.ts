
import { Component, ChangeDetectionStrategy, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { InventoryService } from '../../services/inventory.service';
import { InvoiceService } from '../../services/invoice.service';
import { Product } from '../../models/product.model';
import { InvoiceItem } from '../../models/invoice.model';
import { NotificationService } from '../../services/notification.service';

type PaymentMethod = 'Cash' | 'Card' | 'Transfer';
type DiscountMode = 'fixed' | 'percentage';

@Component({
  selector: 'app-invoice-create',
  templateUrl: './invoice-create.component.html',
  imports: [CommonModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InvoiceCreateComponent {
  private inventoryService = inject(InventoryService);
  private invoiceService = inject(InvoiceService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);

  customerName = signal('Walk-in Customer');
  customerAddress = signal('');
  customerTaxId = signal('');
  searchTerm = signal('');
  invoiceItems = signal<InvoiceItem[]>([]);
  showSearchResults = signal(false);

  // --- Payment Signals ---
  discountValue = signal(0);
  discountMode = signal<DiscountMode>('fixed');
  paymentMethod = signal<PaymentMethod>('Cash');
  amountReceived = signal(0);
  
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

  subtotalHT = computed(() => this.invoiceItems().reduce((acc, item) => acc + item.totalHT, 0));
  
  discountAmount = computed(() => {
    const mode = this.discountMode();
    const value = this.discountValue();
    const subtotal = this.subtotalHT();
    if (mode === 'percentage') {
      return subtotal * (value / 100);
    }
    return value > subtotal ? subtotal : value;
  });

  tvaAmount = computed(() => (this.subtotalHT() - this.discountAmount()) * 0.08); // 8% tax on discounted subtotal
  
  totalTTC = computed(() => {
    const calculatedTotal = this.subtotalHT() + this.tvaAmount() - this.discountAmount();
    return Math.max(0, calculatedTotal);
  });

  changeDue = computed(() => {
    if (this.paymentMethod() !== 'Cash') return 0;
    const change = this.amountReceived() - this.totalTTC();
    return change > 0 ? change : 0;
  });

  isChargeDisabled = computed(() => {
    if (this.invoiceItems().length === 0) return true;
    if (this.paymentMethod() === 'Cash') {
      return this.amountReceived() < this.totalTTC();
    }
    return false; // For Card/Transfer, payment is assumed to be exact
  });

  quickCashOptions = computed(() => {
    const total = this.totalTTC();
    if (total <= 0) return [];
    
    const options = new Set<number>();
    options.add(total); // Exact amount

    const bills = [5, 10, 20, 50, 100, 200];
    const nextBill = bills.find(b => b > total);
    if (nextBill) {
      options.add(nextBill);
    }
    
    // Add a few higher common bills
    bills.forEach(bill => {
      if (bill > total && options.size < 4) {
        options.add(bill);
      }
    });
    
    return Array.from(options).sort((a,b) => a - b).slice(0, 4);
  });

  constructor() {
    effect(() => {
      this.showSearchResults.set(this.searchTerm().length > 0 && this.searchResults().length > 0);
    });

    effect(() => {
      const method = this.paymentMethod();
      if (method === 'Card' || method === 'Transfer') {
        this.amountReceived.set(this.totalTTC());
      } else {
        // If switching back to cash, reset amount received if it was auto-set
        if(this.amountReceived() === this.totalTTC()) {
           this.amountReceived.set(0);
        }
      }
    });
  }

  onSearch(event: Event) {
    this.searchTerm.set((event.target as HTMLInputElement).value);
  }

  addProductToInvoice(product: Product) {
    this.invoiceItems.update(items => [
      ...items,
      { product, quantity: 1, priceHT: product.price, totalHT: product.price }
    ]);
    this.searchTerm.set('');
  }

  updateItemQuantityFromInput(productId: string, event: Event) {
    const quantity = parseInt((event.target as HTMLInputElement).value, 10);
    this.invoiceItems.update(items => 
      items.map(item => {
        if (item.product.id === productId) {
          const productInStock = this.allProducts().find(p => p.id === productId)?.quantityInStock || 0;
          const newQuantity = Math.max(1, Math.min(quantity, productInStock));
          if(quantity > productInStock) {
            this.notificationService.show(`Only ${productInStock} units of ${item.product.name} in stock.`, 'error');
          }
          return { ...item, quantity: newQuantity, totalHT: newQuantity * item.priceHT };
        }
        return item;
      })
    );
  }
  
  adjustItemQuantity(productId: string, adjustment: number) {
    this.invoiceItems.update(items => 
      items.map(item => {
        if (item.product.id === productId) {
          const productInStock = this.allProducts().find(p => p.id === productId)?.quantityInStock || 0;
          const newQuantity = item.quantity + adjustment;

          if (newQuantity > productInStock) {
            this.notificationService.show(`Only ${productInStock} units of ${item.product.name} in stock.`, 'error');
            return { ...item, quantity: productInStock, totalHT: productInStock * item.priceHT };
          }
          if (newQuantity < 1) {
            return item; // Don't go below 1 with +/- buttons
          }
          return { ...item, quantity: newQuantity, totalHT: newQuantity * item.priceHT };
        }
        return item;
      })
    );
  }

  removeItem(productId: string) {
    this.invoiceItems.update(items => items.filter(item => item.product.id !== productId));
  }
  
  onDiscountChange(event: Event) {
    let value = parseFloat((event.target as HTMLInputElement).value);
    value = isNaN(value) ? 0 : Math.max(0, value);

    if (this.discountMode() === 'percentage' && value > 100) {
      value = 100;
    }
    this.discountValue.set(value);
  }

  setDiscountMode(mode: DiscountMode) {
    this.discountMode.set(mode);
    this.discountValue.set(0); // Reset on mode change
  }

  onAmountReceivedChange(event: Event) {
    const value = parseFloat((event.target as HTMLInputElement).value);
    this.amountReceived.set(isNaN(value) ? 0 : Math.max(0, value));
  }

  onPaymentMethodChange(event: Event) {
    this.paymentMethod.set((event.target as HTMLSelectElement).value as PaymentMethod);
  }

  createInvoice() {
    if (this.isChargeDisabled()) {
      this.notificationService.show('Amount received must be greater than or equal to the total.', 'error');
      return;
    }

    const newInvoice = this.invoiceService.createInvoice({
      customerName: this.customerName(),
      customerAddress: this.customerAddress(),
      customerTaxId: this.customerTaxId(),
      items: this.invoiceItems(),
      subtotalHT: this.subtotalHT(),
      tvaAmount: this.tvaAmount(),
      totalTTC: this.totalTTC(),
      discount: this.discountAmount(),
      paymentMethod: this.paymentMethod(),
      amountReceived: this.amountReceived(),
      changeDue: this.changeDue(),
    });

    if (newInvoice) {
      // Reset state for next transaction
      this.invoiceItems.set([]);
      this.customerName.set('Walk-in Customer');
      this.customerAddress.set('');
      this.customerTaxId.set('');
      this.searchTerm.set('');
      this.discountValue.set(0);
      this.discountMode.set('fixed');
      this.paymentMethod.set('Cash');
      this.amountReceived.set(0);

      this.router.navigate(['/billing/print', newInvoice.id]);
    }
  }
}