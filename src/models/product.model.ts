import { Category } from "./category.model";

export interface Product {
  id: string;
  name: string;
  categoryId: string | null;
  description?: string | null;

  price: number;
  costPrice: number;
  quantityInStock: number;
  minStockLevel: number;
  reorderQuantity: number;

  createdAt?: string;
  updatedAt?: string;
}

export type CreateProductDto = Omit<
  Product,
  "id" | "createdAt" | "updatedAt" | "category"
>;
export type UpdateProductDto = Partial<CreateProductDto>;
