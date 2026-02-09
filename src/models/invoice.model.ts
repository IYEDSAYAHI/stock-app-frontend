
import { Product } from './product.model';

export interface InvoiceItem {
  product: Product;
  quantity: number;
  priceHT: number; // Price at the time of sale (Hors Taxe)
  totalHT: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  date: Date;
  customerName: string;
  customerAddress?: string;
  customerTaxId?: string;
  items: InvoiceItem[];
  subtotalHT: number;
  tvaAmount: number;
  totalTTC: number;
  status: 'Pending' | 'Paid' | 'Cancelled';
  discount?: number;
  paymentMethod?: string;
  amountReceived?: number;
  changeDue?: number;
}