
import { Product } from './product.model';

export interface InvoiceItem {
  product: Product;
  quantity: number;
  price: number; // Price at the time of sale
  total: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  date: Date;
  customerName: string;
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  total: number;
}
