import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DashboardService } from '../../core/services/dashboard.service';
import { IssueService } from '../../core/services/issue.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { DashboardResponse } from '../../core/models/dashboard.models';
import { IssueResponse } from '../../core/models/issue.models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="dashboard-page animate-fade-in">
      <!-- Welcome Banner -->
      <div class="welcome-banner glass-card">
        <div class="welcome-content">
          <div class="user-greeting">
            <span class="greeting-badge">
              <i class="bi bi-shield-check"></i> {{ authService.currentUser()?.role }} Portal
            </span>
            <h1 class="greeting-title">Hello, {{ authService.currentUser()?.fullName }} 👋</h1>
            <p class="greeting-subtitle">Here is what is happening with campus maintenance and facility requests today.</p>
          </div>
          <div class="quick-cta">
            <a routerLink="/issues/new" class="btn btn-primary btn-lg shadow-glow">
              <i class="bi bi-plus-lg"></i> Report New Issue
            </a>
          </div>
        </div>
      </div>

      <!-- Admin Only: Create Technician Section -->
      @if (authService.isAdmin()) {
        <div class="admin-section glass-card">
          <div class="admin-header">
            <div class="admin-title-block">
              <h2 class="admin-section-title">
                <i class="bi bi-person-gear"></i> Staff Management
              </h2>
              <p class="admin-section-subtitle">Create and manage technician accounts</p>
            </div>
            <button class="btn btn-secondary" (click)="toggleCreateTechnicianModal()">
              <i class="bi bi-plus-circle"></i> Add Technician
            </button>
          </div>
        </div>
      }

      <!-- Create Technician Modal (moved outside admin-section for proper z-index) -->
      @if (showCreateTechnicianModal()) {
        <div class="modal-overlay" (click)="toggleCreateTechnicianModal()">
          <div class="modal-content" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3>Create New Technician</h3>
              <button class="modal-close" (click)="toggleCreateTechnicianModal()">
                <i class="bi bi-x-lg"></i>
              </button>
            </div>

            @if (technicianErrorMessage()) {
              <div class="alert-error">
                <i class="bi bi-exclamation-circle-fill"></i>
                <span>{{ technicianErrorMessage() }}</span>
              </div>
            }

            <form (ngSubmit)="submitCreateTechnician()" class="modal-form">
              <div class="form-group">
                <label class="form-label" for="techName">Full Name</label>
                <input
                  type="text"
                  id="techName"
                  name="techName"
                  class="form-control"
                  [(ngModel)]="technicianName"
                  required
                  placeholder="e.g. John Smith"
                />
              </div>

              <div class="form-group">
                <label class="form-label" for="techEmail">Email</label>
                <input
                  type="email"
                  id="techEmail"
                  name="techEmail"
                  class="form-control"
                  [(ngModel)]="technicianEmail"
                  required
                  email
                  placeholder="tech@university.edu"
                />
              </div>

              <div class="form-group">
                <label class="form-label" for="techPassword">Password</label>
                <input
                  type="password"
                  id="techPassword"
                  name="techPassword"
                  class="form-control"
                  [(ngModel)]="technicianPassword"
                  required
                  minlength="6"
                  placeholder="At least 6 characters"
                />
              </div>

              <div class="modal-actions">
                <button type="button" class="btn btn-secondary" (click)="toggleCreateTechnicianModal()">
                  Cancel
                </button>
                <button type="submit" class="btn btn-primary" [disabled]="technicianLoading()">
                  @if (technicianLoading()) {
                    <span class="spinner-sm"></span> Creating...
                  } @else {
                    Create Technician
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      }

      <!-- KPI Stat Cards -->
      <div class="stats-grid">
        <!-- Total Issues -->
        <div class="stat-card glass-card glass-card-interactive">
          <div class="stat-icon-wrapper icon-total">
            <i class="bi bi-folder2-open"></i>
          </div>
          <div class="stat-details">
            <div class="stat-value">{{ stats()?.totalIssues ?? 0 }}</div>
            <div class="stat-label">Total Reported</div>
          </div>
          <div class="stat-footer text-primary">All-time campus requests</div>
        </div>

        <!-- New / Pending Issues -->
        <div class="stat-card glass-card glass-card-interactive" routerLink="/issues" [queryParams]="{ status: 'New' }">
          <div class="stat-icon-wrapper icon-new">
            <i class="bi bi-bell-fill"></i>
          </div>
          <div class="stat-details">
            <div class="stat-value">{{ stats()?.newIssues ?? 0 }}</div>
            <div class="stat-label">New Issues</div>
          </div>
          <div class="stat-footer text-indigo">Awaiting review & dispatch</div>
        </div>

        <!-- Assigned Issues -->
        <div class="stat-card glass-card glass-card-interactive" routerLink="/issues" [queryParams]="{ status: 'Assigned' }">
          <div class="stat-icon-wrapper icon-assigned">
            <i class="bi bi-person-gear"></i>
          </div>
          <div class="stat-details">
            <div class="stat-value">{{ stats()?.assignedIssues ?? 0 }}</div>
            <div class="stat-label">Assigned</div>
          </div>
          <div class="stat-footer text-purple">Dispatched to technician</div>
        </div>

        <!-- In Progress Issues -->
        <div class="stat-card glass-card glass-card-interactive" routerLink="/issues" [queryParams]="{ status: 'InProgress' }">
          <div class="stat-icon-wrapper icon-inprogress">
            <i class="bi bi-tools"></i>
          </div>
          <div class="stat-details">
            <div class="stat-value">{{ stats()?.inProgressIssues ?? 0 }}</div>
            <div class="stat-label">In Progress</div>
          </div>
          <div class="stat-footer text-amber">Active repairs ongoing</div>
        </div>

        <!-- Resolved Issues -->
        <div class="stat-card glass-card glass-card-interactive" routerLink="/issues" [queryParams]="{ status: 'Resolved' }">
          <div class="stat-icon-wrapper icon-resolved">
            <i class="bi bi-check-circle-fill"></i>
          </div>
          <div class="stat-details">
            <div class="stat-value">{{ stats()?.resolvedIssues ?? 0 }}</div>
            <div class="stat-label">Resolved</div>
          </div>
          <div class="stat-footer text-emerald">Fixed & closed</div>
        </div>

        <!-- High Priority Issues -->
        <div class="stat-card glass-card glass-card-interactive stat-high-priority">
          <div class="stat-icon-wrapper icon-high">
            <i class="bi bi-exclamation-triangle-fill"></i>
          </div>
          <div class="stat-details">
            <div class="stat-value">{{ stats()?.highPriorityIssues ?? 0 }}</div>
            <div class="stat-label">High Priority</div>
          </div>
          <div class="stat-footer text-rose">Urgent attention required</div>
        </div>
      </div>

      <!-- Recent Issues Section -->
      <div class="section-card glass-card">
        <div class="section-header">
          <div>
            <h2 class="section-title">Recent Campus Issues</h2>
            <p class="section-subtitle">Latest maintenance submissions and progress logs</p>
          </div>
          <a routerLink="/issues" class="btn btn-secondary btn-sm">
            <span>View All Issues</span>
            <i class="bi bi-arrow-right"></i>
          </a>
        </div>

        @if (loading()) {
          <div class="loading-state">
            <div class="spinner-large"></div>
            <p>Loading campus telemetry...</p>
          </div>
        } @else if (recentIssues().length === 0) {
          <div class="empty-state">
            <i class="bi bi-clipboard2-check empty-icon"></i>
            <h3>No issues reported yet!</h3>
            <p>The campus is running smoothly or no tickets have been filed yet.</p>
            <a routerLink="/issues/new" class="btn btn-primary mt-3">
              <i class="bi bi-plus-lg"></i> Create First Issue
            </a>
          </div>
        } @else {
          <div class="table-responsive">
            <table class="custom-table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Location</th>
                  <th>Description</th>
                  <th>Urgency</th>
                  <th>Status</th>
                  <th>Technician</th>
                  <th>Reported</th>
                  <th class="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                @for (issue of recentIssues(); track issue.id) {
                  <tr>
                    <td>
                      <div class="category-tag">
                        <i class="bi" [ngClass]="getCategoryIcon(issue.category)"></i>
                        <span>{{ issue.category }}</span>
                      </div>
                    </td>
                    <td>
                      <div class="location-cell">
                        <span class="font-semibold">{{ issue.building }}</span>
                        <span class="text-xs text-slate-500">Room {{ issue.room }}</span>
                      </div>
                    </td>
                    <td>
                      <div class="desc-cell" [title]="issue.description">
                        {{ issue.description }}
                      </div>
                    </td>
                    <td>
                      <span class="badge" [ngClass]="'priority-' + issue.priority.toLowerCase()">
                        {{ issue.priority }}
                      </span>
                    </td>
                    <td>
                      <span class="badge" [ngClass]="getStatusBadgeClass(issue.status)">
                        {{ issue.status }}
                      </span>
                    </td>
                    <td>
                      @if (issue.technicianName) {
                        <div class="tech-cell">
                          <i class="bi bi-person-check-fill text-purple"></i>
                          <span>{{ issue.technicianName }}</span>
                        </div>
                      } @else {
                        <span class="text-xs text-slate-400">Unassigned</span>
                      }
                    </td>
                    <td>
                      <span class="text-xs text-slate-500">{{ formatDate(issue.createdAt) }}</span>
                    </td>
                    <td class="text-right">
                      <a [routerLink]="['/issues', issue.id]" class="btn btn-secondary btn-sm">
                        Details
                      </a>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .dashboard-page {
      max-width: 1400px;
      margin: 0 auto;
      padding: 0 1.5rem 2.5rem 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .welcome-banner {
      padding: 2rem 2.5rem;
      background: linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(239, 246, 255, 0.85));
      border-left: 4px solid var(--primary-600);
    }

    .welcome-content {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1.5rem;
      flex-wrap: wrap;
    }

    .greeting-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.375rem;
      background: var(--primary-100);
      color: var(--primary-800);
      font-size: 0.75rem;
      font-weight: 700;
      padding: 0.25rem 0.625rem;
      border-radius: 9999px;
      margin-bottom: 0.5rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .greeting-title {
      font-size: 1.75rem;
      font-weight: 800;
      color: var(--slate-900);
      line-height: 1.2;
    }

    .greeting-subtitle {
      font-size: 0.9375rem;
      color: var(--slate-600);
      margin-top: 0.25rem;
    }

    .shadow-glow {
      box-shadow: 0 4px 20px rgba(37, 99, 235, 0.35);
    }

    /* Stats Grid */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1.25rem;
    }

    .stat-card {
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      cursor: pointer;
      position: relative;
      overflow: hidden;
    }

    .stat-icon-wrapper {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.35rem;
      margin-bottom: 1rem;
    }

    .icon-total { background: #e0f2fe; color: #0284c7; }
    .icon-new { background: #e0e7ff; color: #4338ca; }
    .icon-assigned { background: #f3e8ff; color: #7e22ce; }
    .icon-inprogress { background: #fef3c7; color: #b45309; }
    .icon-resolved { background: #d1fae5; color: #047857; }
    .icon-high { background: #ffe4e6; color: #e11d48; }

    .stat-value {
      font-size: 2rem;
      font-weight: 800;
      color: var(--slate-900);
      line-height: 1;
    }

    .stat-label {
      font-size: 0.8125rem;
      font-weight: 600;
      color: var(--slate-500);
      margin-top: 0.25rem;
    }

    .stat-footer {
      font-size: 0.75rem;
      font-weight: 600;
      margin-top: 0.875rem;
      padding-top: 0.75rem;
      border-top: 1px solid var(--slate-100);
    }

    .text-primary { color: var(--primary-600); }
    .text-indigo { color: #4f46e5; }
    .text-purple { color: #7c3aed; }
    .text-amber { color: #d97706; }
    .text-emerald { color: #059669; }
    .text-rose { color: #e11d48; }

    /* Section Card */
    .section-card {
      padding: 1.75rem;
    }

    .section-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1.25rem;
      flex-wrap: wrap;
      gap: 1rem;
    }

    .section-title {
      font-size: 1.25rem;
      font-weight: 800;
      color: var(--slate-900);
    }

    .section-subtitle {
      font-size: 0.875rem;
      color: var(--slate-500);
    }

    /* Table Styles */
    .table-responsive {
      overflow-x: auto;
    }

    .custom-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
    }

    .custom-table th {
      padding: 0.75rem 1rem;
      font-size: 0.75rem;
      font-weight: 700;
      color: var(--slate-500);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      border-bottom: 1px solid var(--slate-200);
    }

    .custom-table td {
      padding: 1rem;
      font-size: 0.875rem;
      color: var(--slate-700);
      border-bottom: 1px solid var(--slate-100);
      vertical-align: middle;
    }

    .custom-table tbody tr:hover {
      background-color: rgba(241, 245, 249, 0.6);
    }

    .category-tag {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      font-weight: 600;
      color: var(--slate-800);
    }

    .location-cell {
      display: flex;
      flex-direction: column;
    }

    .desc-cell {
      max-width: 280px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .tech-cell {
      display: inline-flex;
      align-items: center;
      gap: 0.375rem;
      font-size: 0.8125rem;
      font-weight: 600;
      color: var(--slate-700);
    }

    .text-right {
      text-align: right;
    }

    .loading-state, .empty-state {
      text-align: center;
      padding: 3rem 1.5rem;
      color: var(--slate-500);
    }

    .empty-icon {
      font-size: 3rem;
      color: var(--slate-300);
      display: block;
      margin-bottom: 0.75rem;
    }

    .spinner-large {
      width: 36px;
      height: 36px;
      border: 3px solid var(--slate-200);
      border-top-color: var(--primary-600);
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
      margin: 0 auto 1rem auto;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    /* Admin Section Styles */
    .admin-section {
      padding: 2rem;
      margin-bottom: 1.5rem;
    }

    .admin-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1.5rem;
      flex-wrap: wrap;
      margin-bottom: 1.5rem;
    }

    .admin-section-title {
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--slate-900);
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 0.25rem;
    }

    .admin-section-subtitle {
      font-size: 0.875rem;
      color: var(--slate-500);
    }

    /* Modal Styles */
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 50000;
      padding: 1rem;
    }

    .modal-content {
      background: white;
      border-radius: var(--radius-lg);
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
      max-width: 500px;
      width: 100%;
      max-height: 90vh;
      overflow-y: auto;
      position: relative;
      z-index: 50001;
    }

    .modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1.5rem 2rem;
      border-bottom: 1px solid var(--slate-200);
    }

    .modal-header h3 {
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--slate-900);
      margin: 0;
    }

    .modal-close {
      background: transparent;
      border: none;
      font-size: 1.5rem;
      color: var(--slate-500);
      cursor: pointer;
      padding: 0;
    }

    .modal-close:hover {
      color: var(--slate-700);
    }

    .modal-form {
      padding: 2rem;
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .modal-actions {
      display: flex;
      gap: 1rem;
      justify-content: flex-end;
      border-top: 1px solid var(--slate-200);
      padding: 1.5rem 2rem;
      margin-top: 1rem;
      position: relative;
      z-index: 50002;
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
      margin: 0 2rem 1rem 2rem;
    }

    .spinner-sm {
      display: inline-block;
      width: 14px;
      height: 14px;
      border: 2px solid rgba(255, 255, 255, 0.4);
      border-top-color: #fff;
      border-radius: 50%;
      animation: spin 0.6s linear infinite;
      margin-right: 0.5rem;
    }
  `]
})
export class DashboardComponent implements OnInit {
  readonly authService = inject(AuthService);
  private readonly dashboardService = inject(DashboardService);
  private readonly issueService = inject(IssueService);
  private readonly toast = inject(ToastService);

  stats = signal<DashboardResponse | null>(null);
  recentIssues = signal<IssueResponse[]>([]);
  loading = signal(true);
  
  // Technician creation
  showCreateTechnicianModal = signal(false);
  technicianName = '';
  technicianEmail = '';
  technicianPassword = '';
  technicianLoading = signal(false);
  technicianErrorMessage = signal<string | null>(null);

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading.set(true);

    this.dashboardService.getDashboard().subscribe({
      next: res => {
        this.stats.set(res);
      },
      error: () => {}
    });

    this.issueService.getIssues().subscribe({
      next: res => {
        this.recentIssues.set(res.slice(0, 6)); // First 6 recent issues
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  getCategoryIcon(category: string): string {
    switch (category) {
      case 'Computer': return 'bi-laptop text-primary';
      case 'Network': return 'bi-wifi text-indigo';
      case 'Projector': return 'bi-projector text-purple';
      case 'Plumbing': return 'bi-droplet-fill text-primary';
      case 'Electrical': return 'bi-lightning-charge-fill text-amber';
      case 'Infrastructure': return 'bi-building text-slate-600';
      default: return 'bi-tools text-slate-500';
    }
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'New': return 'badge-new';
      case 'Assigned': return 'badge-assigned';
      case 'InProgress': return 'badge-in-progress';
      case 'Resolved': return 'badge-resolved';
      default: return '';
    }
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }

  toggleCreateTechnicianModal(): void {
    this.showCreateTechnicianModal.update(v => !v);
    if (!this.showCreateTechnicianModal()) {
      this.resetTechnicianForm();
    }
  }

  resetTechnicianForm(): void {
    this.technicianName = '';
    this.technicianEmail = '';
    this.technicianPassword = '';
    this.technicianErrorMessage.set(null);
  }

  submitCreateTechnician(): void {
    if (!this.technicianName || !this.technicianEmail || !this.technicianPassword) {
      this.technicianErrorMessage.set('Please fill in all fields.');
      return;
    }

    this.technicianLoading.set(true);
    this.technicianErrorMessage.set(null);

    // Call the auth service to create technician
    this.authService.createTechnician({
      fullName: this.technicianName,
      email: this.technicianEmail,
      password: this.technicianPassword
    }).subscribe({
      next: res => {
        this.technicianLoading.set(false);
        this.toast.success('Technician created!', `${res.fullName} has been added to the system.`);
        this.toggleCreateTechnicianModal();
      },
      error: err => {
        this.technicianLoading.set(false);
        const message = err?.error?.title || 'Failed to create technician. Email may already exist.';
        this.technicianErrorMessage.set(message);
      }
    });
  }
}

