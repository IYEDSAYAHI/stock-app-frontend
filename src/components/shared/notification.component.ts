import { Component, ChangeDetectionStrategy, inject, computed } from '@angular/core';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-notification',
  template: `
    <div class="fixed top-5 right-5 z-50 space-y-3">
      @for(notification of notifications(); track notification.id) {
        <div 
          [class]="baseClass() + ' ' + colorClasses()[notification.type]"
          role="alert"
        >
          <span class="font-medium mr-2">{{ typeLabel(notification.type) }}</span> {{ notification.message }}
          <button (click)="removeNotification(notification.id)" class="ml-4 font-bold text-xl hover:opacity-75">&times;</button>
        </div>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationComponent {
  private notificationService = inject(NotificationService);
  notifications = this.notificationService.notifications.asReadonly();

  baseClass = computed(() => 'p-4 rounded-lg shadow-lg flex items-center justify-between transition-all duration-300');
  
  colorClasses = computed(() => ({
    info: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    success: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    error: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  }));

  typeLabel(type: 'info' | 'success' | 'error'): string {
    return type.charAt(0).toUpperCase() + type.slice(1) + '!';
  }

  removeNotification(id: number) {
    this.notificationService.remove(id);
  }
}
