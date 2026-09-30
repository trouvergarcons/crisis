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

  injectScenario: (scenarioName: string) =>
    apiClient<{
      status: string;
      message: string;
      scenario: string;
      replanning_event: ReplanEvent;
      response_plan: ResponsePlan;
      human_approval_required: boolean;
    }>(`/api/demo/scenario/${scenarioName}`, {
      method: 'POST',
    }),

  sendCommand: (query: string) =>
    apiClient<{
      status: string;
      reply: string;
      action?: string;
      incident_id?: string;
    }>('/api/demo/command', {
      method: 'POST',
      body: JSON.stringify({ query }),
    }),
};
