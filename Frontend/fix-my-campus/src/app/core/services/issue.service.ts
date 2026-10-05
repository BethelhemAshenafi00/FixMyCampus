import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AssignIssueRequest,
  CreateIssueRequest,
  IssueResponse,
  UpdateIssueStatusRequest
} from '../models/issue.models';

@Injectable({
  providedIn: 'root'
})
export class IssueService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/issues`;

  getIssues(building?: string, status?: string): Observable<IssueResponse[]> {
    let params = new HttpParams();
    if (building && building.trim()) {
      params = params.set('building', building.trim());
    }
    if (status && status.trim()) {
      params = params.set('status', status.trim());
    }
    return this.http.get<IssueResponse[]>(this.baseUrl, { params });
  }

  getMyIssues(): Observable<IssueResponse[]> {
    return this.http.get<IssueResponse[]>(`${this.baseUrl}/my`);
  }

  getIssueById(id: number): Observable<IssueResponse> {
    return this.http.get<IssueResponse>(`${this.baseUrl}/${id}`);
  }

  createIssue(request: CreateIssueRequest): Observable<IssueResponse> {
    return this.http.post<IssueResponse>(this.baseUrl, request);
  }

  assignIssue(id: number, request: AssignIssueRequest): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${this.baseUrl}/${id}/assign`, request);
  }

  updateStatus(id: number, request: UpdateIssueStatusRequest): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${this.baseUrl}/${id}/status`, request);
  }
}

