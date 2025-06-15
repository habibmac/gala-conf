// composables/useExport.ts
import { transformFiltersForAPI } from '@/utils';

export const useExport = () => {
  const { $galantisApi } = useNuxtApp();

  const exportData = async (
    eventId: string,
    type: 'checkins' | 'registrations' | 'billings' | 'insights',
    format: 'csv' | 'xlsx' | 'json',
    filters: Record<string, any> = {},
  ) => {
    try {
      const params = {
        ...transformFiltersForAPI(filters),
        format,
      };

      if (format === 'json') {
        // Handle JSON response
        const response = await $galantisApi.get(`/event/${eventId}/export/${type}`, { params });
        return response.data;
      }
      else {
        // Handle file download
        const response = await $galantisApi.get(`/event/${eventId}/export/${type}`, {
          params,
          responseType: 'blob',
        });

        // Create download link
        const blob = new Blob([response.data], {
          type: response.headers['content-type'],
        });
        const downloadUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;

        // Extract filename from Content-Disposition header
        const contentDisposition = response.headers['content-disposition'];
        let filename = `${type}-export.${format}`;

        if (contentDisposition) {
          const filenameMatch = contentDisposition.match(/filename="(.+)"/);
          if (filenameMatch) {
            filename = filenameMatch[1];
          }
        }

        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(downloadUrl);
      }
    }
    catch (error) {
      console.error('Export failed:', error);
      throw error;
    }
  };

  return { exportData };
};
