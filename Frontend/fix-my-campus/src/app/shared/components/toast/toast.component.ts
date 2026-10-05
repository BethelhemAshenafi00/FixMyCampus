import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container">
      @for (toast of toastService.toasts(); track toast.id) {
        <div class="toast-item toast-{{ toast.type }} animate-fade-in" role="alert">
          <div class="toast-icon">
            @switch (toast.type) {
              @case ('success') { <i class="bi bi-check-circle-fill"></i> }
              @case ('error') { <i class="bi bi-exclamation-octagon-fill"></i> }
              @case ('warning') { <i class="bi bi-exclamation-triangle-fill"></i> }
              @default { <i class="bi bi-info-circle-fill"></i> }
            }
          </div>
          <div class="toast-content">
            <div class="toast-title">{{ toast.title }}</div>
            @if (toast.message) {
              <div class="toast-msg">{{ toast.message }}</div>
            }
          </div>
          <button class="toast-close" (click)="toastService.remove(toast.id)" aria-label="Close">
            <i class="bi bi-x"></i>
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed;
      top: 1.5rem;
      right: 1.5rem;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      max-width: 380px;
      width: calc(100% - 3rem);
      pointer-events: none;
    }

    .toast-item {
      pointer-events: auto;
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      padding: 0.875rem 1rem;
      background: #ffffff;
      border-radius: 12px;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
      border: 1px solid var(--slate-200);
      overflow: hidden;
    }

    .toast-icon {
      font-size: 1.25rem;
      flex-shrink: 0;
      margin-top: 1px;
    }

    .toast-success .toast-icon { color: var(--emerald-500); }
    .toast-error .toast-icon { color: var(--rose-500); }
    .toast-warning .toast-icon { color: var(--amber-500); }
    .toast-info .toast-icon { color: var(--primary-500); }

    .toast-content {
      flex: 1;
    }

    .toast-title {
      font-weight: 600;
      font-size: 0.875rem;
      color: var(--slate-800);
    }

    .toast-msg {
      font-size: 0.8125rem;
      color: var(--slate-500);
      margin-top: 0.125rem;
    }

    .toast-close {
      background: transparent;
      border: none;
      color: var(--slate-400);
      cursor: pointer;
      font-size: 1.25rem;
      line-height: 1;
      padding: 0;
      transition: color 0.15s;
    }
    .toast-close:hover {
      color: var(--slate-700);
    }
  `]
})
export class ToastComponent {
  readonly toastService = inject(ToastService);
}

