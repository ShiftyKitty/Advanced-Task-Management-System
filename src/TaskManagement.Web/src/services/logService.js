// services/logService.js
const API_URL = '/api/logs';

export const logService = {
  // Get all logs with optional filtering
  getLogs: async (filters = {}) => {
    try {
      let url = API_URL;

      // Add query parameters for filtering if provided
      if (filters.priority === 'high') {
        url = `${API_URL}/highpriority`;
      } else if (filters.dateRange) {
        url = `${API_URL}/daterange?start=${filters.startDate}&end=${filters.endDate}`;
      }

      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch logs: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching logs:', error);
      throw error;
    }
  },
  
  // Export logs as CSV
  exportLogs: async () => {
    try {
      const response = await fetch(`${API_URL}/export`);
      
      if (!response.ok) {
        throw new Error(`Failed to export logs: ${response.statusText}`);
      }
      
      // Get the blob from the response
      const blob = await response.blob();
      
      // Create a download link and trigger the download
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `logs-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      return true;
    } catch (error) {
      console.error('Error exporting logs:', error);
      throw error;
    }
  }
};