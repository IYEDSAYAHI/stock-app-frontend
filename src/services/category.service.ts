import { Injectable, inject, signal } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { tap, map } from "rxjs/operators";
import { Category } from "../models/category.model";

interface CategoriesResponse {
  items: Category[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable({ providedIn: "root" })
export class CategoryService {
  private readonly http = inject(HttpClient);

  private readonly _categories = signal<Category[]>([]);
  public readonly categories = this._categories.asReadonly();

  private readonly baseUrl = "http://localhost:3001/categories";

  load(): void {
    this.http
      .get<CategoriesResponse | Category[]>(this.baseUrl)
      .pipe(
        map((res) => (Array.isArray(res) ? res : (res.items ?? []))),
        tap((items) =>
          this._categories.set(
            [...items].sort((a, b) => a.name.localeCompare(b.name)),
          ),
        ),
      )
      .subscribe({
        error: (err) => {
          // helps debugging if HTML comes back again
          console.error("Failed to load categories", err);
        },
      });
  }

  create(name: string): Observable<Category> {
    const trimmed = name.trim();
    if (!trimmed) throw new Error("Category name cannot be empty");

    return this.http.post<Category>(this.baseUrl, { name: trimmed }).pipe(
      tap((created) => {
        this._categories.update((cur) =>
          [...cur, created].sort((a, b) => a.name.localeCompare(b.name)),
        );
      }),
    );
  }

  update(id: string, name: string): Observable<Category> {
    const trimmed = name.trim();
    if (!trimmed) throw new Error("Category name cannot be empty");

    return this.http
      .patch<Category>(`${this.baseUrl}/${id}`, { name: trimmed })
      .pipe(
        tap((updated) => {
          this._categories.update((cur) =>
            cur
              .map((c) => (c.id === id ? updated : c))
              .sort((a, b) => a.name.localeCompare(b.name)),
          );
        }),
      );
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`).pipe(
      tap(() => {
        this._categories.update((cur) => cur.filter((c) => c.id !== id));
      }),
    );
  }

  getById(id: string | null | undefined): Category | undefined {
    if (!id) return undefined;
    return this._categories().find((c) => c.id === id);
  }
}
