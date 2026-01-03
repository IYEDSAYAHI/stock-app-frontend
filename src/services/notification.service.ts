
import { Injectable, signal } from '@angular/core';

export interface Notification {
  message: string;
  type: 'info' | 'success' | 'error';
  id: number;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  notifications = signal<Notification[]>([]);

  show(message: string, type: 'info' | 'success' | 'error' = 'info') {
    const newNotification: Notification = {
      message,
      type,
      id: Date.now()
    };

    this.notifications.update(current => [...current, newNotification]);
    
    setTimeout(() => {
      this.remove(newNotification.id);
    }, 5000);
  }

  remove(id: number): void {
    this.notifications.update(current => current.filter(n => n.id !== id));
  }
}
