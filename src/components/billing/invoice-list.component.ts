import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { InvoiceService } from '../../services/invoice.service';
import { Invoice } from '../../models/invoice.model';
import { ConfirmDeleteComponent } from '../shared/confirm-delete.component';
import { InvoiceEditComponent } from './invoice-edit.component';

type ModalState = { type: 'edit' | 'delete' | null, invoice?: Invoice };

@Component({
  selector: 'app-invoice-list',
  templateUrl: './invoice-list.component.html',
  imports: [CommonModule, RouterLink, ConfirmDeleteComponent, InvoiceEditComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InvoiceListComponent {
  private invoiceService = inject(InvoiceService);
  private router = inject(Router);

  invoices = this.invoiceService.invoices;
  activeMenuInvoiceId = signal<string | null>(null);
  modalState = signal<ModalState>({ type: null });

  statusColorMap = computed(() => ({
    Pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    Paid: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    Cancelled: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  }));

  openModal(type: ModalState['type'], invoice: Invoice): void {
    this.modalState.set({ type, invoice });
    this.closeMenu();
  }

  closeModal(): void {
    this.modalState.set({ type: null });
  }

  handleDelete(): void {
    if (this.modalState().invoice) {
      this.invoiceService.deleteInvoice(this.modalState().invoice!.id);
    }
    this.closeModal();
  }

  handleSave(data: { customerName: string; status: Invoice['status'] }): void {
    if (this.modalState().invoice) {
      this.invoiceService.updateInvoice(this.modalState().invoice!.id, data);
    }
    this.closeModal();
  }

  printInvoice(invoiceId: string): void {
    this.router.navigate(['/billing/print', invoiceId]);
    this.closeMenu();
  }

  toggleMenu(invoiceId: string, event: MouseEvent): void {
    event.stopPropagation();
    this.activeMenuInvoiceId.update(currentId => (currentId === invoiceId ? null : invoiceId));
  }

  closeMenu(): void {
    this.activeMenuInvoiceId.set(null);
  }
}