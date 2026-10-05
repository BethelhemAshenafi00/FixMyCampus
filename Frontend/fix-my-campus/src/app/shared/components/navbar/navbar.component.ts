import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <nav class="navbar glass-card">
      <div class="nav-container">
        <!-- Brand Logo -->
        <a routerLink="/" class="brand-logo">
          <div class="logo-icon">
            <i class="bi bi-buildings"></i>
          </div>
          <div class="brand-text">
            <span class="brand-name">FixMy<span class="text-gradient">Campus</span></span>
            <span class="brand-tag">Maintenance Hub</span>
          </div>
        </a>

        <!-- Desktop Navigation -->
        @if (authService.isAuthenticated()) {
          <div class="nav-links">
            <a routerLink="/dashboard" routerLinkActive="active" class="nav-link">
              <i class="bi bi-grid-1x2-fill"></i>
              <span>Dashboard</span>
            </a>
            
            @if (authService.isAdmin() || authService.isTechnician()) {
              <a routerLink="/issues" [routerLinkActiveOptions]="{ exact: true }" routerLinkActive="active" class="nav-link">
                <i class="bi bi-list-task"></i>
                <span>All Issues</span>
              </a>
            }

            <a routerLink="/issues/my" routerLinkActive="active" class="nav-link">
              <i class="bi bi-person-lines-fill"></i>
              <span>My Reports</span>
            </a>
          </div>

          <!-- Actions & Profile -->
          <div class="nav-actions">
            <a routerLink="/issues/new" class="btn btn-primary btn-sm btn-report">
              <i class="bi bi-plus-circle-fill"></i>
              <span>Report Issue</span>
            </a>

            <!-- User Menu -->
            <div class="user-profile">
              <div class="avatar">
                {{ getUserInitials() }}
              </div>
              <div class="user-meta">
                <div class="user-name">{{ authService.currentUser()?.fullName }}</div>
                <span class="role-pill role-{{ authService.currentUser()?.role?.toLowerCase() }}">
                  {{ authService.currentUser()?.role }}
                </span>
              </div>
              <button (click)="logout()" class="btn-logout" title="Sign Out">
                <i class="bi bi-box-arrow-right"></i>
              </button>
            </div>
          </div>
        } @else {
          <div class="nav-auth-buttons">
            <a routerLink="/login" class="btn btn-secondary btn-sm">Sign In</a>
            <a routerLink="/register" class="btn btn-primary btn-sm">Create Account</a>
          </div>
        }

        <!-- Mobile Menu Toggle Button -->
        <button class="mobile-toggle" (click)="toggleMobileMenu()" aria-label="Toggle navigation">
          <i class="bi" [class.bi-list]="!mobileMenuOpen()" [class.bi-x-lg]="mobileMenuOpen()"></i>
        </button>
      </div>

      <!-- Mobile Dropdown -->
      @if (mobileMenuOpen()) {
        <div class="mobile-menu animate-fade-in">
          @if (authService.isAuthenticated()) {
            <a routerLink="/dashboard" (click)="closeMobileMenu()" routerLinkActive="active" class="mobile-nav-link">
              <i class="bi bi-grid-1x2-fill"></i> Dashboard
            </a>
            @if (authService.isAdmin() || authService.isTechnician()) {
              <a routerLink="/issues" [routerLinkActiveOptions]="{ exact: true }" (click)="closeMobileMenu()" routerLinkActive="active" class="mobile-nav-link">
                <i class="bi bi-list-task"></i> All Issues
              </a>
            }
            <a routerLink="/issues/my" (click)="closeMobileMenu()" routerLinkActive="active" class="mobile-nav-link">
              <i class="bi bi-person-lines-fill"></i> My Reports
            </a>
            <a routerLink="/issues/new" (click)="closeMobileMenu()" class="btn btn-primary w-full mt-2">
              <i class="bi bi-plus-circle-fill"></i> Report Issue
            </a>
            <div class="mobile-user-divider"></div>
            <div class="mobile-user-row">
              <div>
                <div class="font-bold">{{ authService.currentUser()?.fullName }}</div>
                <div class="text-xs text-slate-500">{{ authService.currentUser()?.email }}</div>
              </div>
              <button (click)="logout()" class="btn btn-secondary btn-sm">Logout</button>
            </div>
          } @else {
            <a routerLink="/login" (click)="closeMobileMenu()" class="btn btn-secondary w-full">Sign In</a>
            <a routerLink="/register" (click)="closeMobileMenu()" class="btn btn-primary w-full mt-2">Register</a>
          }
        </div>
      }
    </nav>
  `,
  styles: [`
    .navbar {
      position: sticky;
      top: 1rem;
      z-index: 1000;
      margin: 0 1.5rem 1.5rem 1.5rem;
      padding: 0.75rem 1.5rem;
      border-radius: var(--radius-xl);
    }

    .nav-container {
      display: flex;
      align-items: center;
      justify-content: space-between;
      max-width: 1400px;
      margin: 0 auto;
    }

    .brand-logo {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      text-decoration: none;
    }

    .logo-icon {
      width: 40px;
      height: 40px;
      background: linear-gradient(135deg, var(--primary-600), var(--primary-800));
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 10px;
      font-size: 1.25rem;
      box-shadow: 0 4px 10px rgba(37, 99, 235, 0.3);
    }

    .brand-text {
      display: flex;
      flex-direction: column;
    }

    .brand-name {
      font-size: 1.125rem;
      font-weight: 800;
      color: var(--slate-900);
      line-height: 1.1;
    }

    .text-gradient {
      background: linear-gradient(135deg, var(--primary-600), #8b5cf6);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .brand-tag {
      font-size: 0.6875rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--slate-400);
    }

    .nav-links {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .nav-link {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 0.875rem;
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--slate-600);
      border-radius: var(--radius-md);
      transition: all 0.15s ease-in-out;
    }

    .nav-link:hover {
      color: var(--primary-600);
      background-color: var(--primary-50);
    }

    .nav-link.active {
      color: var(--primary-600);
      background-color: var(--primary-50);
    }

    .nav-actions {
      display: flex;
      align-items: center;
      gap: 1.25rem;
    }

    .user-profile {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding-left: 1rem;
      border-left: 1px solid var(--slate-200);
    }

    .avatar {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: linear-gradient(135deg, #e2e8f0, #cbd5e1);
      color: var(--slate-700);
      font-weight: 700;
      font-size: 0.8125rem;
      display: flex;
      align-items: center;
      justify-content: center;
      text-transform: uppercase;
    }

    .user-meta {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .user-name {
      font-size: 0.8125rem;
      font-weight: 700;
      color: var(--slate-800);
      line-height: 1;
    }

    .role-pill {
      font-size: 0.6875rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .role-admin { color: var(--rose-600); }
    .role-technician { color: var(--purple-500); }
    .role-user { color: var(--emerald-600); }

    .btn-logout {
      background: transparent;
      border: 1px solid var(--slate-200);
      color: var(--slate-500);
      width: 34px;
      height: 34px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      font-size: 1rem;
      transition: all 0.15s;
    }

    .btn-logout:hover {
      background: var(--rose-50);
      color: var(--rose-600);
      border-color: #fecdd3;
    }

    .nav-auth-buttons {
      display: flex;
      gap: 0.75rem;
    }

    .mobile-toggle {
      display: none;
      background: transparent;
      border: none;
      font-size: 1.5rem;
      color: var(--slate-700);
      cursor: pointer;
    }

    .mobile-menu {
      display: none;
      margin-top: 1rem;
      padding-top: 1rem;
      border-top: 1px solid var(--slate-200);
      flex-direction: column;
      gap: 0.5rem;
    }

    .mobile-nav-link {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem 1rem;
      color: var(--slate-700);
      font-weight: 600;
      border-radius: var(--radius-md);
    }
    .mobile-nav-link.active {
      background: var(--primary-50);
      color: var(--primary-600);
    }

    .mobile-user-divider {
      height: 1px;
      background: var(--slate-200);
      margin: 0.75rem 0;
    }
    .mobile-user-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    @media (max-width: 860px) {
      .nav-links, .nav-actions, .nav-auth-buttons {
        display: none;
      }
      .mobile-toggle {
        display: block;
      }
      .mobile-menu {
        display: flex;
      }
    }
  `]
})
export class NavbarComponent {
  readonly authService = inject(AuthService);
  readonly mobileMenuOpen = signal(false);

  toggleMobileMenu(): void {
    this.mobileMenuOpen.update(v => !v);
  }

  closeMobileMenu(): void {
    this.mobileMenuOpen.set(false);
  }

  logout(): void {
    this.closeMobileMenu();
    this.authService.logout();
  }

  getUserInitials(): string {
    const name = this.authService.currentUser()?.fullName ?? 'U';
    return name
      .split(' ')
      .map(part => part[0])
      .slice(0, 2)
      .join('');
  }
}

