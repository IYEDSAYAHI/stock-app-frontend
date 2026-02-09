import { Injectable, signal } from '@angular/core';

const MOCK_CATEGORIES = [
  'Produce',
  'Dairy',
  'Bakery',
  'Pantry',
  'Meat & Seafood',
  'Beverages',
];

@Injectable({ providedIn: 'root' })
export class CategoryService {
  private readonly _categories = signal<string[]>(MOCK_CATEGORIES.sort());
  public readonly categories = this._categories.asReadonly();

  addCategory(categoryName: string): void {
    const trimmedName = categoryName.trim();
    if (trimmedName && !this._categories().some(c => c.toLowerCase() === trimmedName.toLowerCase())) {
      this._categories.update(categories => [...categories, trimmedName].sort());
    }
  }
}
