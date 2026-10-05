import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { IssueService } from '../../../core/services/issue.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { IssueResponse, IssueStatus, UpdateIssueStatusRequest } from '../../../core/models/issue.models';

@Component({
  selector: 'app-issue-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="issues-page animate-fade-in">
      <!-- Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Campus Issue Directory</h1>
          <p class="page-subtitle">Track, assign, and update status of facility maintenance requests</p>
        </div>
        <a routerLink="/issues/new" class="btn btn-primary shadow-glow">
          <i class="bi bi-plus-lg"></i> Report Issue
        </a>
      </div>

      <!-- Filters & Controls Bar -->
      <div class="filter-card glass-card">
        <div class="filter-top">
          <!-- Search Input -->
          <div class="search-box">
            <i class="bi bi-search search-icon"></i>
            <input
              type="text"
              class="form-control with-icon"
              placeholder="Search by building, room, description, reporter..."
              [(ngModel)]="searchQuery"
            />
          </div>

          <!-- Building Filter Dropdown -->
          <div class="filter-select-wrapper">
            <select class="form-select" [(ngModel)]="selectedBuilding" (change)="applyFilters()">
              <option value="">All Buildings</option>
              @for (b of buildings; track b) {
                <option [value]="b">{{ b }}</option>
              }
            </select>
          </div>

          <!-- Category Filter Dropdown -->
          <div class="filter-select-wrapper">
            <select class="form-select" [(ngModel)]="selectedCategory">
              <option value="">All Categories</option>
              <option value="Computer">Computer / PC</option>
              <option value="Network">Wi-Fi / Network</option>
              <option value="Projector">Projector / AV</option>
              <option value="Plumbing">Plumbing</option>
              <option value="Electrical">Electrical</option>
              <option value="Infrastructure">Infrastructure</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <!-- Layout Toggle -->
          <div class="view-toggle">
            <button
              class="btn-icon"
              [class.active]="viewMode() === 'grid'"
              (click)="viewMode.set('grid')"
              title="Grid View"
            >
              <i class="bi bi-grid-fill"></i>
            </button>
            <button
              class="btn-icon"
              [class.active]="viewMode() === 'table'"
              (click)="viewMode.set('table')"
              title="Table View"
            >
              <i class="bi bi-list-ul"></i>
            </button>
          </div>
        </div>

        <!-- Status Filter Tabs -->
        <div class="status-tabs">
          <button
            class="status-tab"
            [class.active]="currentStatusTab === 'ALL'"
            (click)="setStatusTab('ALL')"
          >
            All <span class="tab-count">{{ allIssues().length }}</span>
          </button>
          <button
            class="status-tab"
            [class.active]="currentStatusTab === 'New'"
            (click)="setStatusTab('New')"
          >
            <span class="status-dot dot-new"></span> New
            <span class="tab-count">{{ countByStatus('New') }}</span>
          </button>
          <button
            class="status-tab"
            [class.active]="currentStatusTab === 'Assigned'"
            (click)="setStatusTab('Assigned')"
          >
            <span class="status-dot dot-assigned"></span> Assigned
            <span class="tab-count">{{ countByStatus('Assigned') }}</span>
          </button>
          <button
            class="status-tab"
            [class.active]="currentStatusTab === 'InProgress'"
            (click)="setStatusTab('InProgress')"
          >
            <span class="status-dot dot-inprogress"></span> In Progress
            <span class="tab-count">{{ countByStatus('InProgress') }}</span>
          </button>
          <button
            class="status-tab"
            [class.active]="currentStatusTab === 'Resolved'"
            (click)="setStatusTab('Resolved')"
          >
            <span class="status-dot dot-resolved"></span> Resolved
            <span class="tab-count">{{ countByStatus('Resolved') }}</span>
          </button>
        </div>
      </div>

      <!-- Issues Content -->
      @if (loading()) {
        <div class="loading-state">
          <div class="spinner-large"></div>
          <p>Retrieving campus issues...</p>
        </div>
      } @else if (filteredIssues().length === 0) {
        <div class="empty-card glass-card">
          <i class="bi bi-search empty-icon"></i>
          <h3>No matching issues found</h3>
          <p>Try clearing filters or search keywords to view all reports.</p>
          <button class="btn btn-secondary mt-3" (click)="resetFilters()">
            Reset Filters
          </button>
        </div>
      } @else if (viewMode() === 'grid') {
        <!-- Grid Cards View -->
        <div class="issues-grid">
          @for (issue of filteredIssues(); track issue.id) {
            <div class="issue-card glass-card glass-card-interactive">
              <div class="card-header-row">
                <div class="cat-badge">
                  <i class="bi" [ngClass]="getCategoryIcon(issue.category)"></i>
                  <span>{{ issue.category }}</span>
                </div>
                <div class="card-header-right">
                  <span class="badge" [ngClass]="'priority-' + issue.priority.toLowerCase()">
                    {{ issue.priority }}
                  </span>
                  <span class="badge" [ngClass]="getStatusBadgeClass(issue.status)">
                    {{ issue.status }}
                  </span>
                </div>
              </div>

              <div class="card-body-content">
                <div class="location-badge">
                  <i class="bi bi-geo-alt-fill"></i>
                  <span>{{ issue.building }} &bull; {{ issue.room }}</span>
                </div>
                <p class="issue-description" [title]="issue.description">
                  {{ issue.description }}
                </p>
              </div>

              <div class="card-footer-row">
                <div class="meta-col">
                  <div class="reporter-meta">
                    <i class="bi bi-person-circle"></i>
                    <span>{{ issue.reporterName }}</span>
                  </div>
                  <div class="time-meta">
                    <i class="bi bi-clock"></i>
                    <span>{{ formatDate(issue.createdAt) }}</span>
                  </div>
                </div>

                <div class="card-actions">
                  <!-- Quick Admin Assign -->
                  @if (authService.isAdmin() && issue.status === 'New') {
                    <button class="btn btn-secondary btn-sm" (click)="openAssignModal(issue)">
                      <i class="bi bi-person-plus"></i> Assign
                    </button>
                  }

                  <!-- Quick Tech Status Update -->
                  @if ((authService.isTechnician() || authService.isAdmin()) && issue.status !== 'Resolved') {
                    <button class="btn btn-secondary btn-sm" (click)="openStatusModal(issue)">
                      <i class="bi bi-arrow-repeat"></i> Status
                    </button>
                  }

                  <a [routerLink]="['/issues', issue.id]" class="btn btn-primary btn-sm">
                    View
                  </a>
                </div>
              </div>
            </div>
          }
        </div>
      } @else {
        <!-- Table View -->
        <div class="table-card glass-card">
          <div class="table-responsive">
            <table class="custom-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Category</th>
                  <th>Location</th>
                  <th>Description</th>
                  <th>Urgency</th>
                  <th>Status</th>
                  <th>Reporter</th>
                  <th>Technician</th>
                  <th class="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                @for (issue of filteredIssues(); track issue.id) {
                  <tr>
                    <td class="font-bold text-slate-400">#{{ issue.id }}</td>
                    <td>
                      <div class="category-tag">
                        <i class="bi" [ngClass]="getCategoryIcon(issue.category)"></i>
                        <span>{{ issue.category }}</span>
                      </div>
                    </td>
                    <td>
                      <div class="location-cell">
                        <span class="font-semibold">{{ issue.building }}</span>
                        <span class="text-xs text-slate-500">{{ issue.room }}</span>
                      </div>
                    </td>
                    <td>
                      <div class="desc-cell" [title]="issue.description">{{ issue.description }}</div>
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
                      <span class="text-sm">{{ issue.reporterName }}</span>
                    </td>
                    <td>
                      @if (issue.technicianName) {
                        <span class="text-sm font-semibold text-purple">
                          <i class="bi bi-tools"></i> {{ issue.technicianName }}
                        </span>
                      } @else {
                        <span class="text-xs text-slate-400">None</span>
                      }
                    </td>
                    <td class="text-right">
                      <div class="table-action-btns">
                        @if (authService.isAdmin() && issue.status === 'New') {
                          <button class="btn btn-secondary btn-sm" (click)="openAssignModal(issue)">
                            Assign
                          </button>
                        }
                        @if ((authService.isTechnician() || authService.isAdmin()) && issue.status !== 'Resolved') {
                          <button class="btn btn-secondary btn-sm" (click)="openStatusModal(issue)">
                            Status
                          </button>
                        }
                        <a [routerLink]="['/issues', issue.id]" class="btn btn-outline-primary btn-sm">
                          Details
                        </a>
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }

      <!-- Assign Modal -->
      @if (selectedIssueForAssign) {
        <div class="modal-backdrop animate-fade-in" (click)="closeAssignModal()">
          <div class="modal-card glass-card" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3 class="modal-title">
                <i class="bi bi-person-gear text-purple"></i> Assign Technician
              </h3>
              <button class="modal-close" (click)="closeAssignModal()">&times;</button>
            </div>
            <div class="modal-body">
              <p class="modal-desc">
                Dispatch issue #{{ selectedIssueForAssign.id }} ({{ selectedIssueForAssign.building }}, {{ selectedIssueForAssign.room }}) to a maintenance staff technician.
              </p>

              <div class="form-group">
                <label class="form-label" for="techId">Technician ID / Staff</label>
                <select class="form-select" [(ngModel)]="assignTechId">
                  <option [ngValue]="2">Technician #2 (technician&#64;fix.com)</option>
                  <option [ngValue]="1">Admin #1 (admin&#64;fix.com)</option>
                </select>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary" (click)="closeAssignModal()">Cancel</button>
              <button class="btn btn-primary" (click)="submitAssign()" [disabled]="actionLoading()">
                @if (actionLoading()) { <span class="spinner"></span> Assigning... } @else { Assign Issue }
              </button>
            </div>
          </div>
        </div>
      }

      <!-- Update Status Modal -->
      @if (selectedIssueForStatus) {
        <div class="modal-backdrop animate-fade-in" (click)="closeStatusModal()">
          <div class="modal-card glass-card" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3 class="modal-title">
                <i class="bi bi-arrow-repeat text-primary"></i> Update Issue Status
              </h3>
              <button class="modal-close" (click)="closeStatusModal()">&times;</button>
            </div>
            <div class="modal-body">
              <p class="modal-desc">
                Update progress for Issue #{{ selectedIssueForStatus.id }} (Current: <strong>{{ selectedIssueForStatus.status }}</strong>)
              </p>

              <div class="form-group">
                <label class="form-label" for="newStatusSelect">New Status</label>
                <select class="form-select" [(ngModel)]="newStatusValue" id="newStatusSelect">
                  <option value="Assigned">Assigned (Dispatched)</option>
                  <option value="InProgress">InProgress (Active Investigation/Repair)</option>
                  <option value="Resolved">Resolved (Completed)</option>
                </select>
              </div>

              <div class="form-group">
                <label class="form-label" for="statusComment">Technician Comment / Note</label>
                <textarea
                  class="form-control"
                  rows="3"
                  [(ngModel)]="statusComment"
                  id="statusComment"
                  placeholder="e.g. Replaced faulty cable. Testing connection now."
                ></textarea>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary" (click)="closeStatusModal()">Cancel</button>
              <button class="btn btn-primary" (click)="submitStatusUpdate()" [disabled]="actionLoading()">
                @if (actionLoading()) { <span class="spinner"></span> Updating... } @else { Save Status }
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .issues-page {
      max-width: 1400px;
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

    /* Filter Card */
    .filter-card {
      padding: 1.25rem 1.5rem;
    }

    .filter-top {
      display: flex;
      align-items: center;
      gap: 1rem;
      flex-wrap: wrap;
      margin-bottom: 1rem;
    }

    .search-box {
      flex: 1;
      min-width: 260px;
      position: relative;
    }

    .search-icon {
      position: absolute;
      left: 0.875rem;
      top: 50%;
      transform: translateY(-50%);
      color: var(--slate-400);
    }

    .with-icon {
      padding-left: 2.375rem;
    }

    .filter-select-wrapper {
      min-width: 170px;
    }

    .view-toggle {
      display: flex;
      background: var(--slate-100);
      border-radius: var(--radius-sm);
      padding: 2px;
      border: 1px solid var(--slate-200);
    }

    .btn-icon {
      background: transparent;
      border: none;
      color: var(--slate-500);
      padding: 0.375rem 0.625rem;
      border-radius: 6px;
      cursor: pointer;
      font-size: 0.9375rem;
      transition: all 0.15s;
    }

    .btn-icon.active {
      background: #ffffff;
      color: var(--primary-600);
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    /* Status Tabs */
    .status-tabs {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      overflow-x: auto;
      padding-top: 0.5rem;
      border-top: 1px solid var(--slate-200);
    }

    .status-tab {
      background: transparent;
      border: none;
      padding: 0.5rem 0.875rem;
      font-size: 0.8125rem;
      font-weight: 600;
      color: var(--slate-600);
      border-radius: var(--radius-md);
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      transition: all 0.15s;
      white-space: nowrap;
    }

    .status-tab:hover {
      background: var(--slate-100);
      color: var(--slate-900);
    }

    .status-tab.active {
      background: var(--primary-50);
      color: var(--primary-700);
      font-weight: 700;
    }

    .tab-count {
      background: var(--slate-200);
      color: var(--slate-700);
      font-size: 0.6875rem;
      font-weight: 700;
      padding: 0.125rem 0.375rem;
      border-radius: 9999px;
    }

    .status-tab.active .tab-count {
      background: var(--primary-200);
      color: var(--primary-900);
    }

    .status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
    }
    .dot-new { background-color: #6366f1; }
    .dot-assigned { background-color: #8b5cf6; }
    .dot-inprogress { background-color: #f59e0b; }
    .dot-resolved { background-color: #10b981; }

    /* Grid Layout */
    .issues-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 1.25rem;
    }

    .issue-card {
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      gap: 1.25rem;
    }

    .card-header-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.5rem;
    }

    .card-header-right {
      display: flex;
      align-items: center;
      gap: 0.375rem;
    }

    .cat-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.375rem;
      font-weight: 700;
      font-size: 0.8125rem;
      color: var(--slate-800);
    }

    .location-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.375rem;
      font-size: 0.8125rem;
      font-weight: 600;
      color: var(--primary-700);
      background: var(--primary-50);
      padding: 0.25rem 0.625rem;
      border-radius: var(--radius-sm);
      margin-bottom: 0.75rem;
    }

    .issue-description {
      font-size: 0.875rem;
      color: var(--slate-600);
      line-height: 1.5;
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .card-footer-row {
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
      padding-top: 1rem;
      border-top: 1px solid var(--slate-100);
      gap: 0.75rem;
    }

    .meta-col {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      font-size: 0.75rem;
      color: var(--slate-500);
    }

    .reporter-meta, .time-meta {
      display: flex;
      align-items: center;
      gap: 0.375rem;
    }

    .card-actions {
      display: flex;
      align-items: center;
      gap: 0.375rem;
    }

    /* Table Styles */
    .table-card {
      padding: 1rem;
    }
    .table-action-btns {
      display: inline-flex;
      gap: 0.375rem;
    }

    /* Modal Backdrop */
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.5);
      backdrop-filter: blur(4px);
      z-index: 2000;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1.5rem;
    }

    .modal-card {
      width: 100%;
      max-width: 460px;
      padding: 1.75rem;
      background: #ffffff;
      border-radius: var(--radius-lg);
    }

    .modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1rem;
    }

    .modal-title {
      font-size: 1.125rem;
      font-weight: 800;
      color: var(--slate-900);
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .modal-close {
      background: transparent;
      border: none;
      font-size: 1.5rem;
      line-height: 1;
      color: var(--slate-400);
      cursor: pointer;
    }

    .modal-desc {
      font-size: 0.875rem;
      color: var(--slate-600);
      margin-bottom: 1.25rem;
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      margin-top: 1.5rem;
    }

    .empty-card {
      text-align: center;
      padding: 3rem;
      color: var(--slate-500);
    }
    .empty-icon {
      font-size: 2.5rem;
      color: var(--slate-300);
      margin-bottom: 0.75rem;
      display: block;
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
    .spinner {
      width: 14px;
      height: 14px;
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
export class IssueListComponent implements OnInit {
  private readonly issueService = inject(IssueService);
  readonly authService = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  allIssues = signal<IssueResponse[]>([]);
  loading = signal(true);
  actionLoading = signal(false);
  viewMode = signal<'grid' | 'table'>('grid');

  searchQuery = '';
  selectedBuilding = '';
  selectedCategory = '';
  currentStatusTab: string = 'ALL';

  readonly buildings = ['Block A', 'Block B', 'Library', 'Science Complex', 'Engineering Hall', 'Student Center'];

  // Modals
  selectedIssueForAssign: IssueResponse | null = null;
  assignTechId: number = 2;

  selectedIssueForStatus: IssueResponse | null = null;
  newStatusValue: IssueStatus = 'InProgress';
  statusComment: string = '';

  readonly filteredIssues = computed(() => {
    let list = this.allIssues();

    // Tab Status
    if (this.currentStatusTab !== 'ALL') {
      list = list.filter(i => i.status === this.currentStatusTab);
    }

    // Building Filter
    if (this.selectedBuilding) {
      list = list.filter(i => i.building.toLowerCase() === this.selectedBuilding.toLowerCase());
    }

    // Category Filter
    if (this.selectedCategory) {
      list = list.filter(i => i.category === this.selectedCategory);
    }

    // Text Search
    if (this.searchQuery && this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase().trim();
      list = list.filter(i =>
        i.description.toLowerCase().includes(q) ||
        i.building.toLowerCase().includes(q) ||
        i.room.toLowerCase().includes(q) ||
        i.reporterName.toLowerCase().includes(q) ||
        (i.technicianName && i.technicianName.toLowerCase().includes(q))
      );
    }

    return list;
  });

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      if (params['status']) {
        this.currentStatusTab = params['status'];
      }
      if (params['building']) {
        this.selectedBuilding = params['building'];
      }
      this.loadIssues();
    });
  }

  loadIssues(): void {
    // Students are not allowed to view all issues, redirect to My Issues
    if (this.authService.isStudent()) {
      this.router.navigate(['/issues/my']);
      return;
    }

    this.loading.set(true);
    this.issueService.getIssues(this.selectedBuilding || undefined).subscribe({
      next: issues => {
        this.allIssues.set(issues);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  applyFilters(): void {
    this.loadIssues();
  }

  setStatusTab(status: string): void {
    this.currentStatusTab = status;
  }

  countByStatus(status: string): number {
    return this.allIssues().filter(i => i.status === status).length;
  }

  resetFilters(): void {
    this.searchQuery = '';
    this.selectedBuilding = '';
    this.selectedCategory = '';
    this.currentStatusTab = 'ALL';
    this.loadIssues();
  }

  // Assign Modal
  openAssignModal(issue: IssueResponse): void {
    this.selectedIssueForAssign = issue;
    this.assignTechId = issue.technicianId || 2;
  }

  closeAssignModal(): void {
    this.selectedIssueForAssign = null;
  }

  submitAssign(): void {
    if (!this.selectedIssueForAssign) return;

    this.actionLoading.set(true);
    this.issueService.assignIssue(this.selectedIssueForAssign.id, { technicianId: this.assignTechId }).subscribe({
      next: () => {
        this.actionLoading.set(false);
        this.toast.success('Assigned!', `Issue #${this.selectedIssueForAssign?.id} assigned to technician.`);
        this.closeAssignModal();
        this.loadIssues();
      },
      error: err => {
        this.actionLoading.set(false);
        this.toast.error('Assignment failed', err?.error?.title || 'Could not assign issue.');
      }
    });
  }

  // Status Modal
  openStatusModal(issue: IssueResponse): void {
    this.selectedIssueForStatus = issue;
    this.newStatusValue = issue.status === 'New' ? 'Assigned' : issue.status === 'Assigned' ? 'InProgress' : 'Resolved';
    this.statusComment = '';
  }

  closeStatusModal(): void {
    this.selectedIssueForStatus = null;
  }

  submitStatusUpdate(): void {
    if (!this.selectedIssueForStatus) return;

    this.actionLoading.set(true);
    const req: UpdateIssueStatusRequest = {
      newStatus: this.newStatusValue,
      comment: this.statusComment || undefined
    };

    this.issueService.updateStatus(this.selectedIssueForStatus.id, req).subscribe({
      next: () => {
        this.actionLoading.set(false);
        this.toast.success('Status updated', `Issue #${this.selectedIssueForStatus?.id} set to ${this.newStatusValue}.`);
        this.closeStatusModal();
        this.loadIssues();
      },
      error: err => {
        this.actionLoading.set(false);
        this.toast.error('Update failed', err?.error?.title || 'Invalid status transition.');
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
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
}

