
import { Component, ChangeDetectionStrategy, inject, signal, AfterViewInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { InvoiceService } from '../../services/invoice.service';
import { Invoice } from '../../models/invoice.model';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-invoice-print',
  templateUrl: './invoice-print.component.html',
  styleUrls: ['./invoice-print.component.css'],
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InvoicePrintComponent implements AfterViewInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private invoiceService = inject(InvoiceService);

  invoice = signal<Invoice | null>(null);

  constructor() {
    const invoiceId = this.route.snapshot.paramMap.get('id');
    if (invoiceId) {
      const foundInvoice = this.invoiceService.getInvoiceById(invoiceId);
      if (foundInvoice) {
        this.invoice.set(foundInvoice);
      } else {
        this.router.navigate(['/billing']);
      }
    } else {
      this.router.navigate(['/billing']);
    }
  }

  ngAfterViewInit(): void {
    // Automatically trigger print dialog
    setTimeout(() => window.print(), 500);
  }
  print(): void {
    window.print();
  }
  goBack(): void {
    this.router.navigate(['/billing']);
  }
}
