import { Injectable, signal } from '@angular/core';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
  id: number;
  type: ToastType;
  title: string;
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  readonly toasts = signal<ToastMessage[]>([]);
  private nextId = 0;

  success(title: string, message?: string): void {
    this.add('success', title, message);
  }

  error(title: string, message?: string): void {
    this.add('error', title, message);
  }

  warning(title: string, message?: string): void {
    this.add('warning', title, message);
  }

  info(title: string, message?: string): void {
    this.add('info', title, message);
  }

  remove(id: number): void {
    this.toasts.update(toasts => toasts.filter(toast => toast.id !== id));
  }

  private add(type: ToastType, title: string, message?: string): void {
    const toast: ToastMessage = {
      id: this.nextId++,
      type,
      title,
      message
    };

    this.toasts.update(toasts => [...toasts, toast]);
  }
}