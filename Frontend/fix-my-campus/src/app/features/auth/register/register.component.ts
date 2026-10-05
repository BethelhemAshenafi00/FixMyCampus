import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="auth-container">
      <div class="auth-card glass-card animate-fade-in">
        <div class="auth-header">
          <div class="auth-icon">
            <i class="bi bi-person-plus-fill"></i>
          </div>
          <h1 class="auth-title">Create Account</h1>
          <p class="auth-subtitle">Join FixMyCampus to report issues across facilities</p>
        </div>

        @if (errorMessage()) {
          <div class="alert-error animate-fade-in">
            <i class="bi bi-exclamation-circle-fill"></i>
            <span>{{ errorMessage() }}</span>
          </div>
        }

        <form (ngSubmit)="onSubmit()" #regForm="ngForm" class="auth-form">
          <div class="form-group">
            <label class="form-label" for="fullName">Full Name</label>
            <div class="input-wrapper">
              <i class="bi bi-person input-icon"></i>
              <input
                type="text"
                id="fullName"
                name="fullName"
                class="form-control with-icon"
                [(ngModel)]="fullName"
                required
                minlength="2"
                placeholder="e.g. Alex Johnson"
              />
            </div>
          </div>

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
            <label class="form-label" for="role">Role</label>
            <div class="input-wrapper">
              <i class="bi bi-badge input-icon"></i>
              <select 
                id="role"
                name="role" 
                class="form-select with-icon" 
                [(ngModel)]="selectedRole"
                required
              >
                <option value="" disabled>Select your role</option>
                <option value="User">Student / Reporter</option>
                <option value="Technician">Staff / Technician</option>
              </select>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label" for="department">Department / Program <span class="text-optional">(Optional)</span></label>
            <div class="input-wrapper">
              <i class="bi bi-building input-icon"></i>
              <input
                type="text"
                id="department"
                name="department"
                class="form-control with-icon"
                [(ngModel)]="department"
                placeholder="e.g. Computer Science, Science Block"
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
                minlength="6"
                placeholder="At least 6 characters"
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
            [disabled]="loading() || !regForm.form.valid"
          >
            @if (loading()) {
              <span class="spinner"></span> Creating Account...
            } @else {
              <span>Sign Up</span>
              <i class="bi bi-arrow-right"></i>
            }
          </button>
        </form>

        <div class="auth-footer">
          <span>Already have an account?</span>
          <a routerLink="/login" class="auth-link">Sign In</a>
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
      max-width: 480px;
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

    .text-optional {
      font-weight: 400;
      color: var(--slate-400);
      font-size: 0.75rem;
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

    .form-select.with-icon {
      padding-left: 2.5rem;
      appearance: none;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%2364748b' d='M6 9L1 4h10z'/%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: right 1rem center;
      padding-right: 2.5rem;
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
export class RegisterComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  fullName = '';
  email = '';
  department = '';
  password = '';
  selectedRole = ''; // New role property
  loading = signal(false);
  showPassword = signal(false);
  errorMessage = signal<string | null>(null);

  togglePasswordVisibility(): void {
    this.showPassword.update(v => !v);
  }

  onSubmit(): void {
    if (!this.fullName || !this.email || !this.password) return;

    this.loading.set(true);
    this.errorMessage.set(null);

    this.authService.register({
      fullName: this.fullName,
      email: this.email,
      password: this.password,
      department: this.department || undefined
    }).subscribe({
      next: res => {
        this.loading.set(false);
        this.toast.success('Account created!', `Welcome to FixMyCampus, ${res.fullName}.`);
        this.router.navigate(['/dashboard']);
      },
      error: err => {
        this.loading.set(false);
        const title = err?.error?.title || 'Registration failed. An account with this email may already exist.';
        this.errorMessage.set(title);
      }
    });
  }
}

