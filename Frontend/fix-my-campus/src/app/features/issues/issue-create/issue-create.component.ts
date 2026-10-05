import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { IssueService } from '../../../core/services/issue.service';
import { ToastService } from '../../../core/services/toast.service';
import { CreateIssueRequest, IssueCategory, IssuePriority } from '../../../core/models/issue.models';

interface CategoryOption {
  id: IssueCategory;
  name: string;
  icon: string;
  color: string;
}

@Component({
  selector: 'app-issue-create',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="create-page animate-fade-in">
      <div class="create-header">
        <a routerLink="/issues" class="back-link">
          <i class="bi bi-arrow-left"></i> Back to Issues
        </a>
        <h1 class="page-title">Report a Campus Issue</h1>
        <p class="page-subtitle">Submit facility problems, broken equipment, or maintenance requests.</p>
      </div>

      <div class="form-card glass-card">
        <form (ngSubmit)="onSubmit()" #issueForm="ngForm">
          <!-- 1. Select Category -->
          <div class="form-section">
            <label class="section-label">
              <span class="step-num">1</span> Select Category
            </label>
            <div class="category-grid">
              @for (cat of categories; track cat.id) {
                <div
                  class="category-option"
                  [class.selected]="selectedCategory === cat.id"
                  (click)="selectedCategory = cat.id"
                >
                  <div class="cat-icon-circle" [style.background]="cat.color + '15'" [style.color]="cat.color">
                    <i class="bi" [ngClass]="cat.icon"></i>
                  </div>
                  <div class="cat-name">{{ cat.name }}</div>
                </div>
              }
            </div>
          </div>

          <!-- 2. Location -->
          <div class="form-section">
            <label class="section-label">
              <span class="step-num">2</span> Campus Location
            </label>
            
            <div class="grid-2">
              <div class="form-group">
                <label class="form-label" for="building">Building / Complex</label>
                <input
                  type="text"
                  id="building"
                  name="building"
                  class="form-control"
                  [(ngModel)]="building"
                  required
                  placeholder="e.g. Block A, Library, Science Complex"
                />
                <div class="quick-pills">
                  @for (b of popularBuildings; track b) {
                    <button type="button" class="quick-pill" (click)="building = b">
                      {{ b }}
                    </button>
                  }
                </div>
              </div>

              <div class="form-group">
                <label class="form-label" for="room">Room / Area / Hall</label>
                <input
                  type="text"
                  id="room"
                  name="room"
                  class="form-control"
                  [(ngModel)]="room"
                  required
                  placeholder="e.g. Room 204, 2nd Floor Hall, Lab 3"
                />
              </div>
            </div>
          </div>

          <!-- 3. Urgency Priority -->
          <div class="form-section">
            <label class="section-label">
              <span class="step-num">3</span> Urgency Level
            </label>
            <div class="priority-selector">
              <div
                class="priority-chip chip-low"
                [class.selected]="urgency === 'Low'"
                (click)="urgency = 'Low'"
              >
                <i class="bi bi-info-circle"></i>
                <div>
                  <div class="chip-title">Low</div>
                  <div class="chip-desc">Minor cosmetic / non-urgent</div>
                </div>
              </div>

              <div
                class="priority-chip chip-medium"
                [class.selected]="urgency === 'Medium'"
                (click)="urgency = 'Medium'"
              >
                <i class="bi bi-clock-history"></i>
                <div>
                  <div class="chip-title">Medium</div>
                  <div class="chip-desc">Affects regular activity</div>
                </div>
              </div>

              <div
                class="priority-chip chip-high"
                [class.selected]="urgency === 'High'"
                (click)="urgency = 'High'"
              >
                <i class="bi bi-exclamation-octagon-fill"></i>
                <div>
                  <div class="chip-title">High / Urgent</div>
                  <div class="chip-desc">Critical hazard or blocker</div>
                </div>
              </div>
            </div>
          </div>

          <!-- 4. Description -->
          <div class="form-section">
            <label class="section-label">
              <span class="step-num">4</span> Description of the Problem
            </label>
            <div class="form-group">
              <textarea
                id="description"
                name="description"
                rows="4"
                class="form-control"
                [(ngModel)]="description"
                required
                minlength="10"
                placeholder="Please describe the issue in detail (e.g. Projector has blinking red light, no image when connected to laptop via HDMI cable)..."
              ></textarea>
            </div>
          </div>

          <!-- Submit Button -->
          <div class="form-actions">
            <button
              type="submit"
              class="btn btn-primary btn-lg submit-btn"
              [disabled]="loading() || !issueForm.form.valid"
            >
              @if (loading()) {
                <span class="spinner"></span> Submitting Report...
              } @else {
                <i class="bi bi-send-fill"></i> Submit Campus Issue
              }
            </button>
            <a routerLink="/issues" class="btn btn-secondary btn-lg">Cancel</a>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .create-page {
      max-width: 860px;
      margin: 0 auto;
      padding: 0 1.5rem 3rem 1.5rem;
    }

    .create-header {
      margin-bottom: 1.5rem;
    }

    .back-link {
      display: inline-flex;
      align-items: center;
      gap: 0.375rem;
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--slate-500);
      margin-bottom: 0.5rem;
    }
    .back-link:hover {
      color: var(--primary-600);
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

    .form-card {
      padding: 2.25rem 2rem;
    }

    .form-section {
      margin-bottom: 2rem;
      padding-bottom: 1.75rem;
      border-bottom: 1px solid var(--slate-200);
    }
    .form-section:last-of-type {
      border-bottom: none;
      margin-bottom: 1rem;
      padding-bottom: 0;
    }

    .section-label {
      display: flex;
      align-items: center;
      gap: 0.625rem;
      font-size: 1.0625rem;
      font-weight: 700;
      color: var(--slate-900);
      margin-bottom: 1rem;
    }

    .step-num {
      width: 26px;
      height: 26px;
      background: var(--primary-600);
      color: #fff;
      font-size: 0.8125rem;
      font-weight: 800;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    /* Category Grid */
    .category-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(110px, 1fr));
      gap: 0.75rem;
    }

    .category-option {
      background: #ffffff;
      border: 2px solid var(--slate-200);
      border-radius: var(--radius-md);
      padding: 1rem 0.5rem;
      text-align: center;
      cursor: pointer;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
      transition: all 0.15s ease-in-out;
    }

    .category-option:hover {
      border-color: var(--primary-300);
      background: var(--slate-50);
      transform: translateY(-2px);
    }

    .category-option.selected {
      border-color: var(--primary-600);
      background: var(--primary-50);
      box-shadow: 0 0 0 1px var(--primary-600);
    }

    .cat-icon-circle {
      width: 42px;
      height: 42px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.25rem;
    }

    .cat-name {
      font-size: 0.8125rem;
      font-weight: 700;
      color: var(--slate-800);
    }

    /* Location Grid */
    .grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.25rem;
    }

    @media (max-width: 640px) {
      .grid-2 {
        grid-template-columns: 1fr;
      }
    }

    .quick-pills {
      display: flex;
      flex-wrap: wrap;
      gap: 0.375rem;
      margin-top: 0.5rem;
    }

    .quick-pill {
      background: var(--slate-100);
      border: 1px solid var(--slate-200);
      color: var(--slate-600);
      font-size: 0.6875rem;
      font-weight: 600;
      padding: 0.25rem 0.5rem;
      border-radius: 9999px;
      cursor: pointer;
      transition: all 0.1s;
    }

    .quick-pill:hover {
      background: var(--primary-100);
      color: var(--primary-700);
      border-color: var(--primary-300);
    }

    /* Priority Selector */
    .priority-selector {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 0.75rem;
    }

    @media (max-width: 640px) {
      .priority-selector {
        grid-template-columns: 1fr;
      }
    }

    .priority-chip {
      background: #ffffff;
      border: 2px solid var(--slate-200);
      border-radius: var(--radius-md);
      padding: 0.875rem 1rem;
      cursor: pointer;
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      transition: all 0.15s;
    }

    .priority-chip:hover {
      border-color: var(--slate-300);
    }

    .priority-chip.selected.chip-low {
      border-color: var(--slate-500);
      background: var(--slate-50);
    }

    .priority-chip.selected.chip-medium {
      border-color: var(--amber-500);
      background: var(--amber-50);
    }

    .priority-chip.selected.chip-high {
      border-color: var(--rose-500);
      background: var(--rose-50);
    }

    .priority-chip i {
      font-size: 1.25rem;
      margin-top: 2px;
    }
    .chip-low i { color: var(--slate-500); }
    .chip-medium i { color: var(--amber-500); }
    .chip-high i { color: var(--rose-500); }

    .chip-title {
      font-weight: 700;
      font-size: 0.875rem;
      color: var(--slate-900);
    }

    .chip-desc {
      font-size: 0.75rem;
      color: var(--slate-500);
    }

    .form-actions {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-top: 1rem;
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
export class IssueCreateComponent {
  private readonly issueService = inject(IssueService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  readonly categories: CategoryOption[] = [
    { id: 'Computer', name: 'Computer / PC', icon: 'bi-laptop', color: '#2563eb' },
    { id: 'Network', name: 'Wi-Fi / LAN', icon: 'bi-wifi', color: '#6366f1' },
    { id: 'Projector', name: 'Projector / AV', icon: 'bi-projector', color: '#8b5cf6' },
    { id: 'Plumbing', name: 'Plumbing / Water', icon: 'bi-droplet-fill', color: '#0284c7' },
    { id: 'Electrical', name: 'Electrical / Lights', icon: 'bi-lightning-charge-fill', color: '#d97706' },
    { id: 'Infrastructure', name: 'Furniture / Building', icon: 'bi-building', color: '#475569' },
    { id: 'Other', name: 'General / Other', icon: 'bi-three-dots', color: '#64748b' }
  ];

  readonly popularBuildings = ['Block A', 'Block B', 'Library', 'Science Complex', 'Engineering Hall', 'Student Center'];

  selectedCategory: IssueCategory = 'Computer';
  building = '';
  room = '';
  description = '';
  urgency: IssuePriority = 'Medium';
  loading = signal(false);

  onSubmit(): void {
    if (!this.selectedCategory || !this.building || !this.room || !this.description) return;

    this.loading.set(true);

    const request: CreateIssueRequest = {
      category: this.selectedCategory,
      building: this.building.trim(),
      room: this.room.trim(),
      description: this.description.trim(),
      urgency: this.urgency
    };

    this.issueService.createIssue(request).subscribe({
      next: created => {
        this.loading.set(false);
        this.toast.success('Report submitted!', `Issue #${created.id} was created and sent to maintenance.`);
        this.router.navigate(['/issues', created.id]);
      },
      error: err => {
        this.loading.set(false);
        this.toast.error('Failed to submit issue', err?.error?.title || 'Please check your inputs and try again.');
      }
    });
  }
}

