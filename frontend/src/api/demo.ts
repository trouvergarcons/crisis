import { apiClient } from './client';
import { ResponsePlan, ReplanEvent } from '../types';

export const demoApi = {
  reset: () =>
    apiClient<{ status: string; message: string }>('/api/demo/reset', {
      method: 'POST',
    }),

  loadScenario: () =>
    apiClient<{
      status: string;
      message: string;
      incidents_count: number;
      resources_count: number;
      response_plan: ResponsePlan;
    }>('/api/demo/load-scenario', {
      method: 'POST',
    }),

  simulateCriticalIncident: () =>
    apiClient<{
      status: string;
      message: string;
      replanning_event: ReplanEvent;
      response_plan: ResponsePlan;
      human_approval_required: boolean;
    }>('/api/demo/new-critical-incident', {
      method: 'POST',
    }),

  simulateResourceFailure: () =>
    apiClient<{
      status: string;
      message: string;
      replanning_event: ReplanEvent;
      response_plan: ResponsePlan;
    }>('/api/demo/resource-failure', {
      method: 'POST',
    }),
};
