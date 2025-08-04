const API_URL = 'http://localhost:5271/api/logs';

// Get auth headers from stored credentials
const getAuthHeader = () => {
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user?.token ? { 'Authorization': `Bearer ${user.token}` } : {};
  } catch (error) {
    console.error('Auth token retrieval failed:', error);
    return {};
  }
};

export const logService = {
  // Get logs with optional filtering
  async getLogs(filters = {}) {
    // Construct URL based on filters
    let url = API_URL;
    
    if (filters.priority === 'high') {
      url = `${API_URL}/highpriority`;
    } else if (filters.dateRange) {
      url = `${API_URL}/daterange?start=${filters.startDate}&end=${filters.endDate}`;
    }

    const response = await fetch(url, {
      headers: getAuthHeader()
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch logs: ${response.statusText}`);
    }
    
    return await response.json();
  },
  
  // Export logs as CSV file
  async exportLogs() {
    const response = await fetch(`${API_URL}/export`, {
      headers: getAuthHeader()
    });
    
    if (!response.ok) {
      throw new Error(`Failed to export logs: ${response.statusText}`);
    }
    
    // Handle file download
    const blob = await response.blob();
    const filename = `logs-${new Date().toISOString().split('T')[0]}.csv`;
    
    // Create download link
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    
    // Trigger download and cleanup
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    return true;
  }
};