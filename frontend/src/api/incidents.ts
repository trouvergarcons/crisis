import { apiClient } from './client';
import { Incident, IncidentCreatePayload } from '../types';

export const incidentsApi = {
  list: () => apiClient<Incident[]>('/api/incidents'),

  get: (id: string) => apiClient<Incident>(`/api/incidents/${id}`),

  create: (data: IncidentCreatePayload) =>
    apiClient<Incident>('/api/incidents', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  assess: (id: string) =>
    apiClient<{ status: string; incident: Incident; assessment: unknown }>(
      `/api/incidents/${id}/assess`,
      { method: 'POST' }
    ),

  resolve: (id: string) =>
    apiClient<{ status: string; message: string; incident: Incident }>(
      `/api/incidents/${id}/resolve`,
      { method: 'POST' }
    ),
};
