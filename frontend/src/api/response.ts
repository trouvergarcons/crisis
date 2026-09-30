import { apiClient } from './client';
import { ResponsePlan, AllocationChange, ReplanEvent } from '../types';

export const responseApi = {
  getPlan: () => apiClient<ResponsePlan | null>('/api/response/plan'),

  generatePlan: () =>
    apiClient<ResponsePlan>('/api/response/plan', {
      method: 'POST',
    }),

  replan: (reason?: string) =>
    apiClient<{
      status: string;
      message: string;
      response_plan: ResponsePlan;
      replanning_event: ReplanEvent;
      changes: AllocationChange[];
    }>('/api/response/replan', {
      method: 'POST',
      body: JSON.stringify({ reason: reason || 'Tactical Replan from UI' }),
    }),

  handleApproval: (action: 'approve' | 'reject' | 'review', reviewerNotes?: string) =>
    apiClient<{
      status: string;
      action: string;
      current_approval_status: string;
      notes?: string;
    }>('/api/response/plan/approve', {
      method: 'POST',
      body: JSON.stringify({ action, reviewer_notes: reviewerNotes }),
    }),

  getChanges: () => apiClient<AllocationChange[]>('/api/response/changes'),
};
