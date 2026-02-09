import { Component, ChangeDetectionStrategy, input, output, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Invoice } from '../../models/invoice.model';

@Component({
  selector: 'app-invoice-edit',
  templateUrl: './invoice-edit.component.html',
  imports: [CommonModule, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InvoiceEditComponent implements OnInit {
  invoice = input.required<Invoice>();
  save = output<{ customerName: string; status: Invoice['status'] }>();
  cancel = output<void>();

  // FIX: Use inject() function for dependency injection instead of constructor parameters.
  private fb = inject(FormBuilder);
  editForm: FormGroup;
  statuses: Invoice['status'][] = ['Pending', 'Paid', 'Cancelled'];

  constructor() {
    this.editForm = this.fb.group({
      customerName: ['', Validators.required],
      status: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    const inv = this.invoice();
    this.editForm.patchValue({
      customerName: inv.customerName,
      status: inv.status
    });
  }

  onSubmit(): void {
    if (this.editForm.valid) {
      this.save.emit(this.editForm.value);
    }
  }
}
