import { Injectable, signal, inject } from '@angular/core';
import { Invoice } from '../models/invoice.model';
import { InventoryService } from './inventory.service';
import { NotificationService } from './notification.service';
import { StockMovementType } from '../models/stock-movement.model';

@Injectable({ providedIn: 'root' })
export class InvoiceService {
  private inventoryService = inject(InventoryService);
  private notificationService = inject(NotificationService);

  private readonly _invoices = signal<Invoice[]>([]);
  public readonly invoices = this._invoices.asReadonly();

  createInvoice(invoice: Omit<Invoice, 'id' | 'invoiceNumber' | 'date' | 'status'>): Invoice | null {
    const newInvoice: Invoice = {
      ...invoice,
      id: `inv-${Date.now()}`,
      invoiceNumber: `INV-${String(this._invoices().length + 1).padStart(5, '0')}`,
      date: new Date(),
      status: 'Paid',
    };

    // Update stock for each item
    for (const item of newInvoice.items) {
      // Quantity change is negative because it's a sale
      const success = this.inventoryService.adjustStock(item.product.id, -item.quantity, StockMovementType.Sale, newInvoice.invoiceNumber);
      if (!success) {
        this.notificationService.show(`Not enough stock for ${item.product.name}. Transaction rolled back.`, 'error');
        // In a real app, you'd roll back previous stock updates for this transaction here.
        // For this mock, we just stop.
        return null;
      }
    }

    this._invoices.update(invoices => [newInvoice, ...invoices]);
    this.notificationService.show(`Invoice ${newInvoice.invoiceNumber} created successfully!`, 'success');
    return newInvoice;
  }
  
  getInvoiceById(id: string): Invoice | undefined {
    return this.invoices().find(inv => inv.id === id);
  }

  updateInvoice(invoiceId: string, data: { customerName: string; status: Invoice['status'] }): void {
    const originalInvoice = this.invoices().find(inv => inv.id === invoiceId);
    if (!originalInvoice) {
      this.notificationService.show('Invoice not found.', 'error');
      return;
    }

    // Handle restocking if invoice is cancelled
    if (data.status === 'Cancelled' && originalInvoice.status !== 'Cancelled') {
      for (const item of originalInvoice.items) {
        this.inventoryService.adjustStock(item.product.id, item.quantity, StockMovementType.Return, `Cancel:${originalInvoice.invoiceNumber}`);
      }
       this.notificationService.show(`Items for invoice ${originalInvoice.invoiceNumber} have been restocked.`, 'info');
    }

    this._invoices.update(invoices =>
      invoices.map(inv =>
        inv.id === invoiceId
          ? { ...inv, customerName: data.customerName, status: data.status, date: new Date() } // Also update date on edit
          : inv
      )
    );
    this.notificationService.show(`Invoice ${originalInvoice.invoiceNumber} updated.`, 'success');
  }

  deleteInvoice(invoiceId: string): void {
    const invoiceToDelete = this.invoices().find(inv => inv.id === invoiceId);
    if (!invoiceToDelete) {
      this.notificationService.show('Invoice not found.', 'error');
      return;
    }

    // Restock items only if the invoice was not already cancelled
    if (invoiceToDelete.status !== 'Cancelled') {
        for (const item of invoiceToDelete.items) {
        this.inventoryService.adjustStock(item.product.id, item.quantity, StockMovementType.Return, `Del:${invoiceToDelete.invoiceNumber}`);
      }
      this.notificationService.show(`Items for invoice ${invoiceToDelete.invoiceNumber} have been restocked.`, 'info');
    }

    this._invoices.update(invoices => invoices.filter(inv => inv.id !== invoiceId));
    this.notificationService.show(`Invoice ${invoiceToDelete.invoiceNumber} has been deleted.`, 'success');
  }
}