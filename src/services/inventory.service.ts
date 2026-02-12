import { Injectable, computed, inject, signal } from "@angular/core";
import { HttpClient, HttpParams } from "@angular/common/http";
import { Product } from "../models/product.model";
import {
  StockMovement,
  StockMovementType,
} from "../models/stock-movement.model";
import { NotificationService } from "./notification.service";
import { Observable, map } from "rxjs";

export type InventoryTab = "all" | "low" | "out" | "highMargin";

interface PaginatedProductsResponse {
  items: any[]; // API returns numeric as string sometimes
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

@Injectable({ providedIn: "root" })
export class InventoryService {
  private http = inject(HttpClient);
  private notification = inject(NotificationService);

  // TODO: move to environment.ts later
  private baseUrl = "http://localhost:3001";

  // state
  private readonly _products = signal<Product[]>([]);
  readonly products = this._products.asReadonly();

  private readonly _loading = signal(false);
  readonly loading = this._loading.asReadonly();

  private readonly _pagination = signal({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
  });
  readonly pagination = this._pagination.asReadonly();

  // optional: cache last query so you can refresh after create/update/delete
  private lastQuery: {
    tab: InventoryTab;
    search: string;
    page: number;
    limit: number;
  } = {
    tab: "all",
    search: "",
    page: 1,
    limit: 20,
  };

  /** Loads products into the signal store */
  loadProducts(query?: Partial<typeof this.lastQuery>) {
    this.lastQuery = { ...this.lastQuery, ...(query ?? {}) };

    const { tab, search, page, limit } = this.lastQuery;

    let params = new HttpParams()
      .set("tab", tab)
      .set("page", page)
      .set("limit", limit);

    if (search) params = params.set("search", search);

    this._loading.set(true);

    this.http
      .get<PaginatedProductsResponse>(`${this.baseUrl}/products`, { params })
      .subscribe({
        next: (res) => {
          const items = res.items.map(this.mapProductFromApi);
          this._products.set(items);
          this._pagination.set({
            page: res.page,
            limit: res.limit,
            total: res.total,
            totalPages: res.totalPages,
          });
        },
        error: (err) => {
          console.error(err);
          this.notification.show("Failed to load products.", "error");
        },
        complete: () => this._loading.set(false),
      });
  }

  getProduct(id: string): Observable<Product> {
    return this.http
      .get<any>(`${this.baseUrl}/products/${id}`)
      .pipe(map(this.mapProductFromApi));
  }

  /** For ProductDetail: fetch one product (no local lookup) */
  getProductById(id: string): Observable<Product> {
    return this.getProduct(id);
  }

  /** Create */
  addProduct(productData: Omit<Product, "id">) {
    return this.http
      .post<any>(`${this.baseUrl}/products`, productData)
      .subscribe({
        next: (created) => {
          this.notification.show(
            `Product "${created.name}" added successfully.`,
            "success",
          );
          this.loadProducts(); // refresh list
        },
        error: (err) => {
          console.error(err);
          this.notification.show("Failed to add product.", "error");
        },
      });
  }

  /** Update */
  updateProduct(updatedProduct: Product) {
    return this.http
      .patch<any>(
        `${this.baseUrl}/products/${updatedProduct.id}`,
        updatedProduct,
      )
      .subscribe({
        next: (saved) => {
          this.notification.show(
            `Product "${saved.name}" updated successfully.`,
            "success",
          );
          this.loadProducts(); // refresh list
        },
        error: (err) => {
          console.error(err);
          this.notification.show("Failed to update product.", "error");
        },
      });
  }

  /** Delete single */
  deleteProduct(productId: string) {
    return this.http
      .delete<void>(`${this.baseUrl}/products/${productId}`)
      .subscribe({
        next: () => {
          this.notification.show(`Product deleted.`, "success");
          this.loadProducts();
        },
        error: (err) => {
          console.error(err);
          this.notification.show("Failed to delete product.", "error");
        },
      });
  }

  /** Delete many */
  deleteMultipleProducts(productIds: string[]) {
    return this.http
      .post<{
        deleted: number;
      }>(`${this.baseUrl}/products/bulk-delete`, { ids: productIds })
      .subscribe({
        next: (res) => {
          this.notification.show(
            `${res.deleted} products have been deleted.`,
            "success",
          );
          this.loadProducts();
        },
        error: (err) => {
          console.error(err);
          this.notification.show("Failed to delete products.", "error");
        },
      });
  }

  /** Stock adjustment (server creates movement + updates product) */
  adjustStock(
    productId: string,
    quantityChange: number,
    type: StockMovementType,
    referenceId?: string,
  ) {
    return this.http
      .post<{ product: any; movement: StockMovement }>(
        `${this.baseUrl}/products/${productId}/adjust-stock`,
        {
          type,
          quantityChange,
          referenceId,
        },
      )
      .subscribe({
        next: (res) => {
          // refresh list so quantities update everywhere
          this.loadProducts();
          this.notification.show("Stock updated.", "success");
        },
        error: (err) => {
          console.error(err);
          this.notification.show(
            err?.error?.message ?? "Failed to adjust stock.",
            "error",
          );
        },
      });
  }

  /** Movements */
  getMovementsForProduct(productId: string, limit = 200) {
    return this.http.get<StockMovement[]>(
      `${this.baseUrl}/products/${productId}/movements`,
      {
        params: new HttpParams().set("limit", limit),
      },
    );
  }

  // ---- helpers ----

  private mapProductFromApi = (p: any): Product => ({
    ...p,
    price: typeof p.price === "string" ? Number(p.price) : p.price,
    costPrice:
      typeof p.costPrice === "string" ? Number(p.costPrice) : p.costPrice,
  });
}
