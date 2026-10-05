import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'dashboard'
  },
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'register',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/auth/register/register.component').then(m => m.RegisterComponent)
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
  },
  {
    path: 'issues',
    canActivate: [authGuard],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/issues/issue-list/issue-list.component').then(
            m => m.IssueListComponent
          )
      },
      {
        path: 'new',
        loadComponent: () =>
          import('./features/issues/issue-create/issue-create.component').then(
            m => m.IssueCreateComponent
          )
      },
      {
        path: 'my',
        loadComponent: () =>
          import('./features/issues/my-issues/my-issues.component').then(
            m => m.MyIssuesComponent
          )
      },
      {
        path: ':id',
        loadComponent: () =>
          import('./features/issues/issue-detail/issue-detail.component').then(
            m => m.IssueDetailComponent
          )
      }
    ]
  },
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];

