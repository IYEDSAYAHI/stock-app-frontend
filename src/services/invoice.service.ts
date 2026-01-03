
import { Injectable, signal } from '@angular/core';
import { Invoice } from '../models/invoice.model';
import { InventoryService } from './inventory.service';
import { NotificationService } from './notification.service';

@Injectable({ providedIn: 'root' })
export class InvoiceService {
  private readonly _invoices = signal<Invoice[]>([]);
  public readonly invoices = this._invoices.asReadonly();
  
  constructor(
    private inventoryService: InventoryService,
    private notificationService: NotificationService
  ) {}

  createInvoice(invoice: Omit<Invoice, 'id' | 'invoiceNumber' | 'date'>): Invoice | null {
    // Update stock for each item
    for (const item of invoice.items) {
      const success = this.inventoryService.updateStock(item.product.id, item.quantity);
      if (!success) {
        this.notificationService.show(`Not enough stock for ${item.product.name}.`, 'error');
        // In a real app, you'd roll back previous stock updates here.
        return null;
      }
    }

    const newInvoice: Invoice = {
      ...invoice,
      id: `inv-${Date.now()}`,
      invoiceNumber: `INV-${String(this._invoices().length + 1).padStart(5, '0')}`,
      date: new Date(),
    };

    this._invoices.update(invoices => [...invoices, newInvoice]);
    this.notificationService.show(`Invoice ${newInvoice.invoiceNumber} created successfully!`, 'success');
    return newInvoice;
  }
  
  getInvoiceById(id: string): Invoice | undefined {
    return this.invoices().find(inv => inv.id === id);
  }
}
