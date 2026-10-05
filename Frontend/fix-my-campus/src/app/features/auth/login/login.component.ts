import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="auth-container">
      <div class="auth-card glass-card animate-fade-in">
        <div class="auth-header">
          <div class="auth-icon">
            <i class="bi bi-shield-lock-fill"></i>
          </div>
          <h1 class="auth-title">Welcome Back</h1>
          <p class="auth-subtitle">Sign in to report or manage campus maintenance</p>
        </div>

        <!-- Quick Demo Account Chips -->
        <div class="demo-section">
          <span class="demo-label"><i class="bi bi-stars"></i> Quick Demo Login:</span>
          <div class="demo-chips">
            <button type="button" class="demo-chip" (click)="fillDemo('admin@fix.com', 'admin123')">
              <i class="bi bi-person-badge"></i> Admin
            </button>
            <button type="button" class="demo-chip" (click)="fillDemo('technician@fix.com', 'technician123')">
              <i class="bi bi-tools"></i> Tech
            </button>
            <button type="button" class="demo-chip" (click)="fillDemo('student@fix.com', 'student123')">
              <i class="bi bi-mortarboard"></i> Student
            </button>
          </div>
        </div>

        @if (errorMessage()) {
          <div class="alert-error animate-fade-in">
            <i class="bi bi-exclamation-circle-fill"></i>
            <span>{{ errorMessage() }}</span>
          </div>
        }

        <form (ngSubmit)="onSubmit()" #loginForm="ngForm" class="auth-form">
          <div class="form-group">
            <label class="form-label" for="email">Campus Email</label>
            <div class="input-wrapper">
              <i class="bi bi-envelope input-icon"></i>
              <input
                type="email"
                id="email"
                name="email"
                class="form-control with-icon"
                [(ngModel)]="email"
                required
                email
                placeholder="name@university.edu"
              />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label" for="password">Password</label>
            <div class="input-wrapper">
              <i class="bi bi-lock input-icon"></i>
              <input
                [type]="showPassword() ? 'text' : 'password'"
                id="password"
                name="password"
                class="form-control with-icon with-action"
                [(ngModel)]="password"
                required
                placeholder="••••••••"
              />
              <button
                type="button"
                class="input-action-btn"
                (click)="togglePasswordVisibility()"
                tabindex="-1"
              >
                <i class="bi" [class.bi-eye]="!showPassword()" [class.bi-eye-slash]="showPassword()"></i>
              </button>
            </div>
          </div>

          <button
            type="submit"
            class="btn btn-primary btn-lg w-full submit-btn"
            [disabled]="loading() || !loginForm.form.valid"
          >
            @if (loading()) {
              <span class="spinner"></span> Signing in...
            } @else {
              <span>Sign In</span>
              <i class="bi bi-arrow-right"></i>
            }
          </button>
        </form>

        <div class="auth-footer">
          <span>Don't have an account?</span>
          <a routerLink="/register" class="auth-link">Create Account</a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auth-container {
      min-height: calc(100vh - 120px);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1.5rem;
    }

    .auth-card {
      width: 100%;
      max-width: 440px;
      padding: 2.5rem 2rem;
      border-radius: var(--radius-xl);
    }

    .auth-header {
      text-align: center;
      margin-bottom: 1.5rem;
    }

    .auth-icon {
      width: 56px;
      height: 56px;
      background: linear-gradient(135deg, var(--primary-100), var(--primary-200));
      color: var(--primary-600);
      font-size: 1.75rem;
      border-radius: 16px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 1rem;
    }

    .auth-title {
      font-size: 1.5rem;
      font-weight: 800;
      color: var(--slate-900);
      margin-bottom: 0.25rem;
    }

    .auth-subtitle {
      font-size: 0.875rem;
      color: var(--slate-500);
    }

    .demo-section {
      background: var(--slate-50);
      border: 1px dashed var(--slate-300);
      border-radius: var(--radius-md);
      padding: 0.75rem;
      margin-bottom: 1.5rem;
    }

    .demo-label {
      display: block;
      font-size: 0.75rem;
      font-weight: 700;
      color: var(--slate-500);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 0.5rem;
    }

    .demo-chips {
      display: flex;
      gap: 0.5rem;
    }

    .demo-chip {
      flex: 1;
      padding: 0.375rem 0.5rem;
      background: #ffffff;
      border: 1px solid var(--slate-200);
      border-radius: var(--radius-sm);
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--slate-700);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.25rem;
      transition: all 0.15s;
    }

    .demo-chip:hover {
      background: var(--primary-50);
      border-color: var(--primary-300);
      color: var(--primary-700);
    }

    .alert-error {
      background: var(--rose-50);
      color: var(--rose-600);
      border: 1px solid #fecdd3;
      padding: 0.75rem 1rem;
      border-radius: var(--radius-md);
      font-size: 0.875rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 1.25rem;
    }

    .input-wrapper {
      position: relative;
      display: flex;
      align-items: center;
    }

    .input-icon {
      position: absolute;
      left: 1rem;
      color: var(--slate-400);
      font-size: 1rem;
      pointer-events: none;
    }

    .form-control.with-icon {
      padding-left: 2.5rem;
    }

    .form-control.with-action {
      padding-right: 2.75rem;
    }

    .input-action-btn {
      position: absolute;
      right: 0.75rem;
      background: transparent;
      border: none;
      color: var(--slate-400);
      cursor: pointer;
      padding: 0.25rem;
    }
    .input-action-btn:hover {
      color: var(--slate-600);
    }

    .submit-btn {
      width: 100%;
      margin-top: 0.5rem;
    }

    .auth-footer {
      text-align: center;
      margin-top: 1.75rem;
      font-size: 0.875rem;
      color: var(--slate-500);
      display: flex;
      justify-content: center;
      gap: 0.375rem;
    }

    .auth-link {
      font-weight: 700;
      color: var(--primary-600);
    }

    .spinner {
      width: 16px;
      height: 16px;
      border: 2px solid rgba(255, 255, 255, 0.4);
      border-top-color: #fff;
      border-radius: 50%;
      animation: spin 0.6s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `]
})
export class LoginComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  email = '';
  password = '';
  loading = signal(false);
  showPassword = signal(false);
  errorMessage = signal<string | null>(null);

  fillDemo(email: string, pass: string): void {
    this.email = email;
    this.password = pass;
    this.errorMessage.set(null);
  }

  togglePasswordVisibility(): void {
    this.showPassword.update(v => !v);
  }

  onSubmit(): void {
    if (!this.email || !this.password) return;

    this.loading.set(true);
    this.errorMessage.set(null);

    this.authService.login({ email: this.email, password: this.password }).subscribe({
      next: res => {
        this.loading.set(false);
        this.toast.success(`Welcome back, ${res.fullName}!`, 'Logged in successfully.');
        this.router.navigate(['/dashboard']);
      },
      error: err => {
        this.loading.set(false);
        const title = err?.error?.title || 'Invalid email or password. Please try again.';
        this.errorMessage.set(title);
      }
    });
  }
}

