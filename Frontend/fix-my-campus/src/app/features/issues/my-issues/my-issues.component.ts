import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { IssueService } from '../../../core/services/issue.service';
import { AuthService } from '../../../core/services/auth.service';
import { IssueResponse } from '../../../core/models/issue.models';

@Component({
  selector: 'app-my-issues',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="my-issues-page animate-fade-in">
      <div class="page-header">
        <div>
          <h1 class="page-title">My Reported Issues</h1>
          <p class="page-subtitle">Track the real-time resolution progress of issues you have submitted.</p>
        </div>
        <a routerLink="/issues/new" class="btn btn-primary shadow-glow">
          <i class="bi bi-plus-lg"></i> Report Another Issue
        </a>
      </div>

      <!-- Quick Status Filter -->
      <div class="filter-strip">
        <button
          class="pill-filter"
          [class.active]="filterStatus() === 'ALL'"
          (click)="filterStatus.set('ALL')"
        >
          All ({{ myIssues().length }})
        </button>
        <button
          class="pill-filter"
          [class.active]="filterStatus() === 'ACTIVE'"
          (click)="filterStatus.set('ACTIVE')"
        >
          Active ({{ activeCount() }})
        </button>
        <button
          class="pill-filter"
          [class.active]="filterStatus() === 'RESOLVED'"
          (click)="filterStatus.set('RESOLVED')"
        >
          Resolved ({{ resolvedCount() }})
        </button>
      </div>

      @if (loading()) {
        <div class="loading-state">
          <div class="spinner-large"></div>
          <p>Loading your campus reports...</p>
        </div>
      } @else if (displayedIssues().length === 0) {
        <div class="empty-card glass-card">
          <div class="empty-icon-wrap">
            <i class="bi bi-patch-check"></i>
          </div>
          <h2>No issues reported here</h2>
          <p>You currently don't have any matching reported issues in the campus tracker.</p>
          <a routerLink="/issues/new" class="btn btn-primary mt-3">
            <i class="bi bi-plus-lg"></i> Report an Issue
          </a>
        </div>
      } @else {
        <div class="issues-stack">
          @for (issue of displayedIssues(); track issue.id) {
            <div class="report-card glass-card">
              <!-- Top Row -->
              <div class="report-top">
                <div class="report-info">
                  <span class="report-id">#{{ issue.id }}</span>
                  <div class="report-title-row">
                    <div class="cat-pill">
                      <i class="bi" [ngClass]="getCategoryIcon(issue.category)"></i>
                      {{ issue.category }}
                    </div>
                    <span class="badge" [ngClass]="'priority-' + issue.priority.toLowerCase()">
                      {{ issue.priority }} Priority
                    </span>
                  </div>
                </div>
                <div class="report-status-badge">
                  <span class="badge" [ngClass]="getStatusBadgeClass(issue.status)">
                    {{ issue.status }}
                  </span>
                </div>
              </div>

              <!-- Location & Description -->
              <div class="report-body">
                <div class="report-location">
                  <i class="bi bi-geo-alt-fill text-primary"></i>
                  <strong>{{ issue.building }}</strong> &bull; Room {{ issue.room }}
                </div>
                <p class="report-desc">{{ issue.description }}</p>
              </div>

              <!-- Progress Timeline Stepper -->
              <div class="stepper-wrap">
                <div class="stepper-track">
                  <!-- Step 1: New / Reported -->
                  <div class="step-item" [class.completed]="getStepIndex(issue.status) >= 1" [class.current]="getStepIndex(issue.status) === 1">
                    <div class="step-circle"><i class="bi bi-send-check"></i></div>
                    <div class="step-label">Reported</div>
                  </div>

                  <!-- Step 2: Assigned -->
                  <div class="step-line" [class.completed]="getStepIndex(issue.status) >= 2"></div>
                  <div class="step-item" [class.completed]="getStepIndex(issue.status) >= 2" [class.current]="getStepIndex(issue.status) === 2">
                    <div class="step-circle"><i class="bi bi-person-gear"></i></div>
                    <div class="step-label">Assigned</div>
                  </div>

                  <!-- Step 3: In Progress -->
                  <div class="step-line" [class.completed]="getStepIndex(issue.status) >= 3"></div>
                  <div class="step-item" [class.completed]="getStepIndex(issue.status) >= 3" [class.current]="getStepIndex(issue.status) === 3">
                    <div class="step-circle"><i class="bi bi-tools"></i></div>
                    <div class="step-label">In Progress</div>
                  </div>

                  <!-- Step 4: Resolved -->
                  <div class="step-line" [class.completed]="getStepIndex(issue.status) >= 4"></div>
                  <div class="step-item" [class.completed]="getStepIndex(issue.status) >= 4" [class.current]="getStepIndex(issue.status) === 4">
                    <div class="step-circle"><i class="bi bi-check-lg"></i></div>
                    <div class="step-label">Resolved</div>
                  </div>
                </div>
              </div>

              <!-- Footer info -->
              <div class="report-footer">
                <div class="report-dates">
                  <span><i class="bi bi-calendar3"></i> Submitted {{ formatDate(issue.createdAt) }}</span>
                  @if (issue.technicianName) {
                    <span>&bull; Handled by <strong>{{ issue.technicianName }}</strong></span>
                  }
                  @if (issue.resolvedAt) {
                    <span class="text-emerald font-semibold">&bull; Resolved on {{ formatDate(issue.resolvedAt) }}</span>
                  }
                </div>
                <a [routerLink]="['/issues', issue.id]" class="btn btn-secondary btn-sm">
                  View Full Details <i class="bi bi-chevron-right"></i>
                </a>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .my-issues-page {
      max-width: 1000px;
      margin: 0 auto;
      padding: 0 1.5rem 3rem 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .page-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .page-title {
      font-size: 1.75rem;
      font-weight: 800;
      color: var(--slate-900);
    }

    .page-subtitle {
      font-size: 0.9375rem;
      color: var(--slate-500);
    }

    .filter-strip {
      display: flex;
      gap: 0.5rem;
    }

    .pill-filter {
      background: #ffffff;
      border: 1px solid var(--slate-200);
      padding: 0.4rem 0.875rem;
      border-radius: 9999px;
      font-size: 0.8125rem;
      font-weight: 600;
      color: var(--slate-600);
      cursor: pointer;
      transition: all 0.15s;
    }

    .pill-filter:hover {
      border-color: var(--slate-300);
    }

    .pill-filter.active {
      background: var(--primary-600);
      color: #fff;
      border-color: var(--primary-600);
    }

    .issues-stack {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    .report-card {
      padding: 1.75rem;
    }

    .report-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1rem;
    }

    .report-info {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .report-id {
      font-weight: 800;
      color: var(--slate-400);
      font-size: 1.125rem;
    }

    .report-title-row {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .cat-pill {
      display: inline-flex;
      align-items: center;
      gap: 0.375rem;
      background: var(--slate-100);
      color: var(--slate-800);
      padding: 0.25rem 0.625rem;
      border-radius: var(--radius-sm);
      font-size: 0.8125rem;
      font-weight: 700;
    }

    .report-body {
      margin-bottom: 1.5rem;
    }

    .report-location {
      display: inline-flex;
      align-items: center;
      gap: 0.375rem;
      font-size: 0.875rem;
      color: var(--slate-700);
      margin-bottom: 0.5rem;
    }

    .report-desc {
      font-size: 0.9375rem;
      color: var(--slate-700);
      line-height: 1.6;
    }

    /* Stepper */
    .stepper-wrap {
      background: var(--slate-50);
      border: 1px solid var(--slate-200);
      border-radius: var(--radius-md);
      padding: 1.25rem 1.5rem;
      margin-bottom: 1.25rem;
    }

    .stepper-track {
      display: flex;
      align-items: center;
      justify-content: space-between;
      position: relative;
    }

    .step-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.375rem;
      z-index: 2;
    }

    .step-circle {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: #ffffff;
      border: 2px solid var(--slate-300);
      color: var(--slate-400);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.875rem;
      transition: all 0.2s;
    }

    .step-label {
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--slate-500);
    }

    .step-item.completed .step-circle {
      background: var(--emerald-500);
      border-color: var(--emerald-500);
      color: #fff;
    }

    .step-item.completed .step-label {
      color: var(--emerald-600);
      font-weight: 700;
    }

    .step-item.current .step-circle {
      background: var(--primary-600);
      border-color: var(--primary-600);
      color: #fff;
      box-shadow: 0 0 0 4px var(--primary-100);
    }

    .step-item.current .step-label {
      color: var(--primary-700);
      font-weight: 800;
    }

    .step-line {
      flex: 1;
      height: 3px;
      background: var(--slate-200);
      margin: -1.25rem 0.5rem 0 0.5rem;
      z-index: 1;
      transition: background 0.2s;
    }

    .step-line.completed {
      background: var(--emerald-500);
    }

    /* Footer */
    .report-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      padding-top: 1rem;
      border-top: 1px solid var(--slate-100);
      flex-wrap: wrap;
    }

    .report-dates {
      font-size: 0.8125rem;
      color: var(--slate-500);
      display: flex;
      gap: 0.375rem;
      flex-wrap: wrap;
    }

    .empty-card {
      text-align: center;
      padding: 4rem 2rem;
    }

    .empty-icon-wrap {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      background: var(--emerald-50);
      color: var(--emerald-500);
      font-size: 2rem;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 1rem;
    }

    .loading-state {
      text-align: center;
      padding: 3rem;
      color: var(--slate-500);
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
  `]
})
export class MyIssuesComponent implements OnInit {
  private readonly issueService = inject(IssueService);
  readonly authService = inject(AuthService);

  myIssues = signal<IssueResponse[]>([]);
  loading = signal(true);
  filterStatus = signal<'ALL' | 'ACTIVE' | 'RESOLVED'>('ALL');

  readonly activeCount = computed(() => this.myIssues().filter(i => i.status !== 'Resolved').length);
  readonly resolvedCount = computed(() => this.myIssues().filter(i => i.status === 'Resolved').length);

  readonly displayedIssues = computed(() => {
    const list = this.myIssues();
    const filter = this.filterStatus();
    if (filter === 'ACTIVE') return list.filter(i => i.status !== 'Resolved');
    if (filter === 'RESOLVED') return list.filter(i => i.status === 'Resolved');
    return list;
  });

  ngOnInit(): void {
    this.loadMyIssues();
  }

  loadMyIssues(): void {
    this.loading.set(true);
    this.issueService.getMyIssues().subscribe({
      next: issues => {
        this.myIssues.set(issues);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  getStepIndex(status: string): number {
    switch (status) {
      case 'New': return 1;
      case 'Assigned': return 2;
      case 'InProgress': return 3;
      case 'Resolved': return 4;
      default: return 1;
    }
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
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
}

