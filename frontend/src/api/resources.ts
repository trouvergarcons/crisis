import { apiClient } from './client';
import { Resource } from '../types';

export const resourcesApi = {
  list: () => apiClient<Resource[]>('/api/resources'),

  get: (id: string) => apiClient<Resource>(`/api/resources/${id}`),

  markUnavailable: (id: string) =>
    apiClient<{ status: string; message: string; resource: Resource }>(
      `/api/resources/${id}/unavailable`,
      { method: 'POST' }
    ),

  toggleStatus: (id: string) =>
    apiClient<{ status: string; message: string; resource: Resource }>(
      `/api/resources/${id}/toggle-status`,
      { method: 'POST' }
    ),

  dispatch: (resourceId: string, incidentId: string) =>
    apiClient<{ status: string; message: string; resource: Resource }>(
      `/api/resources/${resourceId}/dispatch`,
      {
        method: 'POST',
        body: JSON.stringify({ incident_id: incidentId }),
      }
    ),
};
