export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  costPrice: number;
  quantityInStock: number;
  minStockLevel: number;
  reorderQuantity: number;
  description: string;
  supplier?: string;
}