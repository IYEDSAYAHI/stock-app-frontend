import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { CategoryService } from "../../services/category.service";
import { Category } from "../../models/category.model";

@Component({
  selector: "app-category-manager",
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: "./category-manager.component.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategoryManagerComponent {
  private readonly categoryService = inject(CategoryService);

  categories = this.categoryService.categories;

  editingId = signal<string | null>(null);
  editName = signal("");
  newName = signal("");

  constructor() {
    // Make sure categories exist even if parent forgot to load
    this.categoryService.load();
  }

  add() {
    const name = this.newName().trim();
    if (!name) return;

    this.categoryService.create(name).subscribe({
      next: () => this.newName.set(""),
      error: (e) => console.error(e),
    });
  }

  startEdit(c: Category) {
    this.editingId.set(c.id);
    this.editName.set(c.name);
  }

  cancelEdit() {
    this.editingId.set(null);
    this.editName.set("");
  }

  saveEdit(id: string) {
    const name = this.editName().trim();
    if (!name) return;

    this.categoryService.update(id, name).subscribe({
      next: () => this.cancelEdit(),
      error: (e) => console.error(e),
    });
  }

  remove(id: string) {
    const ok = confirm(
      "Delete this category? Products in it will become uncategorized.",
    );
    if (!ok) return;

    this.categoryService.delete(id).subscribe({
      error: (e) => console.error(e),
    });
  }
}
