import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-confirm-delete',
  templateUrl: './confirm-delete.component.html',
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmDeleteComponent {
  itemType = input<string>('item');
  itemName = input.required<string>();
  confirm = output<void>();
  cancel = output<void>();
}
