import { apiClient } from './client';
import { DashboardData } from '../types';

export const dashboardApi = {
  get: () => apiClient<DashboardData>('/api/dashboard'),
  checkHealth: () =>
    apiClient<{
      status: string;
      service: string;
      llm_provider: string;
      active_incidents: number;
      total_resources: number;
      timestamp: string;
    }>('/health'),
};
