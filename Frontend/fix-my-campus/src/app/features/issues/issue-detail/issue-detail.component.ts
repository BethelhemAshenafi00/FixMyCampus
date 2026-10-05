import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { IssueService } from '../../../core/services/issue.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { IssueResponse, IssueStatus, UpdateIssueStatusRequest } from '../../../core/models/issue.models';

@Component({
  selector: 'app-issue-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="detail-page animate-fade-in">
      <div class="detail-header">
        <a routerLink="/issues" class="back-link">
          <i class="bi bi-arrow-left"></i> Back to Issues Directory
        </a>
      </div>

      @if (loading()) {
        <div class="loading-state">
          <div class="spinner-large"></div>
          <p>Loading issue details...</p>
        </div>
      } @else if (!issue()) {
        <div class="empty-card glass-card">
          <i class="bi bi-exclamation-triangle-fill empty-icon text-rose"></i>
          <h2>Issue Not Found</h2>
          <p>The requested campus issue record does not exist or has been removed.</p>
          <a routerLink="/issues" class="btn btn-secondary mt-3">Return to Issues</a>
        </div>
      } @else {
        <div class="detail-grid">
          <!-- Left Main Column -->
          <div class="main-column">
            <div class="issue-main-card glass-card">
              <!-- Top Metadata -->
              <div class="issue-badge-row">
                <div class="flex items-center gap-2">
                  <span class="issue-number">#{{ issue()?.id }}</span>
                  <div class="cat-pill">
                    <i class="bi" [ngClass]="getCategoryIcon(issue()?.category || '')"></i>
                    {{ issue()?.category }}
                  </div>
                </div>

                <div class="badge-group">
                  <span class="badge" [ngClass]="'priority-' + issue()?.priority?.toLowerCase()">
                    {{ issue()?.priority }} Priority
                  </span>
                  <span class="badge" [ngClass]="getStatusBadgeClass(issue()?.status || '')">
                    {{ issue()?.status }}
                  </span>
                </div>
              </div>

              <!-- Location Banner -->
              <div class="location-banner">
                <div class="loc-item">
                  <span class="loc-label"><i class="bi bi-building"></i> Building</span>
                  <span class="loc-val">{{ issue()?.building }}</span>
                </div>
                <div class="loc-divider"></div>
                <div class="loc-item">
                  <span class="loc-label"><i class="bi bi-geo-alt"></i> Room / Area</span>
                  <span class="loc-val">{{ issue()?.room }}</span>
                </div>
                <div class="loc-divider"></div>
                <div class="loc-item">
                  <span class="loc-label"><i class="bi bi-calendar-event"></i> Reported Date</span>
                  <span class="loc-val">{{ formatDate(issue()?.createdAt || '') }}</span>
                </div>
              </div>

              <!-- Description -->
              <div class="desc-section">
                <h3 class="section-title">Issue Description</h3>
                <div class="desc-box">
                  {{ issue()?.description }}
                </div>
              </div>

              <!-- Resolution Tracker Stepper -->
              <div class="resolution-section">
                <h3 class="section-title">Resolution Workflow</h3>
                <div class="stepper-wrap">
                  <div class="stepper-track">
                    <div class="step-item" [class.completed]="getStepIndex(issue()?.status || '') >= 1" [class.current]="getStepIndex(issue()?.status || '') === 1">
                      <div class="step-circle"><i class="bi bi-send-check"></i></div>
                      <div class="step-label">Reported</div>
                    </div>
                    <div class="step-line" [class.completed]="getStepIndex(issue()?.status || '') >= 2"></div>
                    <div class="step-item" [class.completed]="getStepIndex(issue()?.status || '') >= 2" [class.current]="getStepIndex(issue()?.status || '') === 2">
                      <div class="step-circle"><i class="bi bi-person-gear"></i></div>
                      <div class="step-label">Assigned</div>
                    </div>
                    <div class="step-line" [class.completed]="getStepIndex(issue()?.status || '') >= 3"></div>
                    <div class="step-item" [class.completed]="getStepIndex(issue()?.status || '') >= 3" [class.current]="getStepIndex(issue()?.status || '') === 3">
                      <div class="step-circle"><i class="bi bi-tools"></i></div>
                      <div class="step-label">In Progress</div>
                    </div>
                    <div class="step-line" [class.completed]="getStepIndex(issue()?.status || '') >= 4"></div>
                    <div class="step-item" [class.completed]="getStepIndex(issue()?.status || '') >= 4" [class.current]="getStepIndex(issue()?.status || '') === 4">
                      <div class="step-circle"><i class="bi bi-check-lg"></i></div>
                      <div class="step-label">Resolved</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Right Sidebar Column -->
          <div class="side-column">
            <!-- Assignment Card -->
            <div class="side-card glass-card">
              <h3 class="side-title"><i class="bi bi-person-lines-fill"></i> Assignment & Roles</h3>
              
              <div class="user-block">
                <div class="user-role-label">Reported By</div>
                <div class="user-chip">
                  <div class="avatar-sm"><i class="bi bi-mortarboard"></i></div>
                  <div>
                    <div class="font-bold text-slate-800">{{ issue()?.reporterName }}</div>
                    <div class="text-xs text-slate-500">Student / Campus Reporter</div>
                  </div>
                </div>
              </div>

              <div class="user-block mt-3">
                <div class="user-role-label">Assigned Technician</div>
                @if (issue()?.technicianName) {
                  <div class="user-chip chip-tech">
                    <div class="avatar-sm tech-avatar"><i class="bi bi-tools"></i></div>
                    <div>
                      <div class="font-bold text-slate-800">{{ issue()?.technicianName }}</div>
                      <div class="text-xs text-purple">Campus Maintenance Staff</div>
                    </div>
                  </div>
                } @else {
                  <div class="unassigned-box">
                    <i class="bi bi-clock-history"></i> Awaiting technician assignment
                  </div>
                }
              </div>

              <!-- Admin Assign Controls -->
              @if (authService.isAdmin() && issue()?.status === 'New') {
                <div class="action-panel mt-4">
                  <div class="panel-title">Admin Dispatch</div>
                  <div class="form-group mb-2">
                    <select class="form-select" [(ngModel)]="assignTechId">
                      <option [ngValue]="2">Technician (technician&#64;fix.com)</option>
                      <option [ngValue]="1">Admin (admin&#64;fix.com)</option>
                    </select>
                  </div>
                  <button class="btn btn-primary w-full" (click)="submitAssign()" [disabled]="actionLoading()">
                    @if (actionLoading()) { <span class="spinner"></span> Dispatching... } @else { Assign Staff }
                  </button>
                </div>
              }
            </div>

            <!-- Technician / Admin Status Controls -->
            @if ((authService.isTechnician() || authService.isAdmin()) && issue()?.status !== 'Resolved') {
              <div class="side-card glass-card mt-3">
                <h3 class="side-title"><i class="bi bi-sliders"></i> Update Status</h3>
                
                <div class="status-quick-btns">
                  @if (issue()?.status === 'Assigned') {
                    <button
                      class="btn btn-secondary w-full"
                      [class.btn-primary]="newStatusValue === 'InProgress'"
                      (click)="newStatusValue = 'InProgress'"
                    >
                      <i class="bi bi-tools"></i> Move to In Progress
                    </button>
                  }
                  <button
                    class="btn btn-secondary w-full mt-2"
                    [class.btn-success]="newStatusValue === 'Resolved'"
                    (click)="newStatusValue = 'Resolved'"
                  >
                    <i class="bi bi-check2-circle"></i> Mark as Resolved
                  </button>
                </div>

                <div class="form-group mt-3">
                  <label class="form-label" for="detailComment">Resolution Comment</label>
                  <textarea
                    class="form-control"
                    id="detailComment"
                    rows="2"
                    placeholder="Add repair note or findings..."
                    [(ngModel)]="statusComment"
                  ></textarea>
                </div>

                <button class="btn btn-primary w-full mt-2" (click)="submitStatusUpdate()" [disabled]="actionLoading()">
                  @if (actionLoading()) { <span class="spinner"></span> Saving... } @else { Save Status Update }
                </button>
              </div>
            }

            <!-- Timestamps -->
            <div class="side-card glass-card mt-3">
              <h3 class="side-title"><i class="bi bi-clock-history"></i> Audit Trail</h3>
              <div class="audit-row">
                <span class="text-slate-500">Created:</span>
                <span class="font-semibold">{{ formatDate(issue()?.createdAt || '') }}</span>
              </div>
              @if (issue()?.updatedAt) {
                <div class="audit-row">
                  <span class="text-slate-500">Last Updated:</span>
                  <span class="font-semibold">{{ formatDate(issue()?.updatedAt || '') }}</span>
                </div>
              }
              @if (issue()?.resolvedAt) {
                <div class="audit-row text-emerald">
                  <span>Resolved:</span>
                  <span class="font-semibold">{{ formatDate(issue()?.resolvedAt || '') }}</span>
                </div>
              }
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .detail-page {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 1.5rem 3rem 1.5rem;
    }

    .detail-header {
      margin-bottom: 1rem;
    }

    .back-link {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      font-weight: 600;
      color: var(--slate-600);
      font-size: 0.875rem;
    }
    .back-link:hover {
      color: var(--primary-600);
    }

    .detail-grid {
      display: grid;
      grid-template-columns: 2fr 1.1fr;
      gap: 1.5rem;
    }

    @media (max-width: 860px) {
      .detail-grid {
        grid-template-columns: 1fr;
      }
    }

    .issue-main-card {
      padding: 2rem;
    }

    .issue-badge-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      flex-wrap: wrap;
      margin-bottom: 1.5rem;
    }

    .issue-number {
      font-size: 1.5rem;
      font-weight: 800;
      color: var(--slate-400);
    }

    .cat-pill {
      display: inline-flex;
      align-items: center;
      gap: 0.375rem;
      background: var(--slate-100);
      color: var(--slate-800);
      padding: 0.375rem 0.75rem;
      border-radius: var(--radius-sm);
      font-size: 0.875rem;
      font-weight: 700;
    }

    .badge-group {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .location-banner {
      background: var(--slate-50);
      border: 1px solid var(--slate-200);
      border-radius: var(--radius-md);
      padding: 1rem 1.25rem;
      display: flex;
      align-items: center;
      justify-content: space-around;
      gap: 1rem;
      margin-bottom: 1.75rem;
    }

    .loc-item {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .loc-label {
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--slate-400);
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .loc-val {
      font-size: 0.9375rem;
      font-weight: 700;
      color: var(--slate-800);
    }

    .loc-divider {
      width: 1px;
      height: 32px;
      background: var(--slate-200);
    }

    .desc-section {
      margin-bottom: 2rem;
    }

    .section-title {
      font-size: 1.0625rem;
      font-weight: 700;
      color: var(--slate-900);
      margin-bottom: 0.75rem;
    }

    .desc-box {
      background: #ffffff;
      border: 1px solid var(--slate-200);
      border-radius: var(--radius-md);
      padding: 1.25rem;
      font-size: 0.9375rem;
      color: var(--slate-700);
      line-height: 1.7;
    }

    /* Stepper */
    .stepper-wrap {
      background: var(--slate-50);
      border: 1px solid var(--slate-200);
      border-radius: var(--radius-md);
      padding: 1.25rem 1.5rem;
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
    }
    .step-line.completed {
      background: var(--emerald-500);
    }

    /* Side Column */
    .side-card {
      padding: 1.5rem;
    }

    .side-title {
      font-size: 0.9375rem;
      font-weight: 700;
      color: var(--slate-800);
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 1rem;
      padding-bottom: 0.5rem;
      border-bottom: 1px solid var(--slate-100);
    }

    .user-block {
      display: flex;
      flex-direction: column;
      gap: 0.375rem;
    }

    .user-role-label {
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--slate-500);
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .user-chip {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      background: var(--slate-50);
      padding: 0.625rem 0.875rem;
      border-radius: var(--radius-md);
      border: 1px solid var(--slate-200);
    }
    .chip-tech {
      background: var(--purple-50);
      border-color: #e9d5ff;
    }

    .avatar-sm {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: var(--primary-100);
      color: var(--primary-700);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.875rem;
    }
    .tech-avatar {
      background: #f3e8ff;
      color: #7e22ce;
    }

    .unassigned-box {
      font-size: 0.8125rem;
      color: var(--slate-500);
      background: var(--slate-50);
      padding: 0.625rem 0.875rem;
      border-radius: var(--radius-md);
      border: 1px dashed var(--slate-300);
    }

    .action-panel {
      background: var(--slate-50);
      border: 1px solid var(--slate-200);
      padding: 1rem;
      border-radius: var(--radius-md);
    }
    .panel-title {
      font-size: 0.8125rem;
      font-weight: 700;
      color: var(--slate-800);
      margin-bottom: 0.5rem;
    }

    .audit-row {
      display: flex;
      justify-content: space-between;
      font-size: 0.8125rem;
      padding: 0.375rem 0;
      border-bottom: 1px solid var(--slate-100);
    }
    .audit-row:last-child {
      border-bottom: none;
    }

    .loading-state, .empty-card {
      text-align: center;
      padding: 4rem;
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
export class IssueDetailComponent implements OnInit {
  private readonly issueService = inject(IssueService);
  readonly authService = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  issue = signal<IssueResponse | null>(null);
  loading = signal(true);
  actionLoading = signal(false);

  assignTechId: number = 2;
  newStatusValue: IssueStatus = 'InProgress';
  statusComment: string = '';

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const idStr = params.get('id');
      if (idStr) {
        this.loadIssue(parseInt(idStr, 10));
      }
    });
  }

  loadIssue(id: number): void {
    this.loading.set(true);
    this.issueService.getIssueById(id).subscribe({
      next: res => {
        this.issue.set(res);
        this.assignTechId = res.technicianId || 2;
        this.newStatusValue = res.status === 'New' ? 'Assigned' : res.status === 'Assigned' ? 'InProgress' : 'Resolved';
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  submitAssign(): void {
    const current = this.issue();
    if (!current) return;

    this.actionLoading.set(true);
    this.issueService.assignIssue(current.id, { technicianId: this.assignTechId }).subscribe({
      next: () => {
        this.actionLoading.set(false);
        this.toast.success('Assigned!', `Technician dispatched to issue #${current.id}.`);
        this.loadIssue(current.id);
      },
      error: err => {
        this.actionLoading.set(false);
        this.toast.error('Assignment error', err?.error?.title || 'Could not assign issue.');
      }
    });
  }

  submitStatusUpdate(): void {
    const current = this.issue();
    if (!current) return;

    this.actionLoading.set(true);
    const req: UpdateIssueStatusRequest = {
      newStatus: this.newStatusValue,
      comment: this.statusComment || undefined
    };

    this.issueService.updateStatus(current.id, req).subscribe({
      next: () => {
        this.actionLoading.set(false);
        this.toast.success('Status updated', `Issue marked as ${this.newStatusValue}.`);
        this.statusComment = '';
        this.loadIssue(current.id);
      },
      error: err => {
        this.actionLoading.set(false);
        this.toast.error('Update error', err?.error?.title || 'Invalid status transition.');
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
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }
}

