export type IssueCategory =
  | 'Computer'
  | 'Network'
  | 'Projector'
  | 'Plumbing'
  | 'Electrical'
  | 'Infrastructure'
  | 'Other';

export type IssueStatus = 'New' | 'Assigned' | 'InProgress' | 'Resolved';

export type IssuePriority = 'Low' | 'Medium' | 'High';

export interface IssueResponse {
  id: number;
  category: IssueCategory;
  building: string;
  room: string;
  description: string;
  status: IssueStatus;
  priority: IssuePriority;
  reporterId: number;
  reporterName: string;
  technicianId: number | null;
  technicianName: string | null;
  createdAt: string;
  updatedAt: string | null;
  resolvedAt: string | null;
}

export interface CreateIssueRequest {
  category: string;
  building: string;
  room: string;
  description: string;
  urgency: IssuePriority;
}

export interface AssignIssueRequest {
  technicianId: number;
}

export interface UpdateIssueStatusRequest {
  newStatus: IssueStatus;
  comment?: string;
}

export interface IssueHistoryResponse {
  id: number;
  oldStatus?: IssueStatus;
  newStatus: IssueStatus;
  changedByUserId: number;
  changedByUserName: string;
  changedAt: string;
  comment?: string;
}

