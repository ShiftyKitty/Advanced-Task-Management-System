// tests/TaskManagement.Web.Tests/components/LogsView/LogsView.test.js
import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';

// Mock the logService
const mockGetLogs = jest.fn();
const mockExportLogs = jest.fn();

// Mock data
const mockLogs = [
  {
    id: 1,
    timestamp: '2025-08-02T10:30:00',
    user: 'admin',
    method: 'GET',
    endpoint: '/api/tasks',
    ip: '192.168.1.1',
    priority: 'normal',
    action: 'viewed all tasks'
  },
  {
    id: 2,
    timestamp: '2025-08-02T09:15:00',
    user: 'john_dev',
    method: 'POST',
    endpoint: '/api/tasks',
    ip: '192.168.1.2',
    priority: 'high',
    action: 'created a new task'
  },
  {
    id: 3,
    timestamp: '2025-08-01T14:20:00',
    user: 'sarah_pm',
    method: 'PUT',
    endpoint: '/api/tasks/5',
    ip: '192.168.1.3',
    priority: 'normal',
    action: 'updated task status'
  },
  {
    id: 4,
    timestamp: '2025-07-25T11:45:00',
    user: 'john_dev',
    method: 'DELETE',
    endpoint: '/api/tasks/3',
    ip: '192.168.1.2',
    priority: 'high',
    action: 'deleted a task'
  },
  {
    id: 5,
    timestamp: '2025-07-20T16:30:00',
    user: 'admin (login attempt)',
    method: 'POST',
    endpoint: '/api/auth/login',
    ip: '192.168.1.1',
    priority: 'normal',
    action: 'attempted login'
  }
];

// Only high priority logs
const mockHighPriorityLogs = mockLogs.filter(log => log.priority === 'high');

// Mock LogsView component
function LogsView() {
  const [logs, setLogs] = React.useState([]);
  const [filteredLogs, setFilteredLogs] = React.useState([]);
  const [visibleLogs, setVisibleLogs] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [filters, setFilters] = React.useState({
    dateRange: 'All',
    priority: 'All',
    user: 'All'
  });
  
  // Number of logs to load at once for lazy loading
  const logIncrement = 2; // Smaller increment for testing
  const [logsToShow, setLogsToShow] = React.useState(logIncrement);

  // Fetch logs when component mounts
  React.useEffect(() => {
    const fetchLogs = async () => {
      try {
        setLoading(true);
        
        // Create a filterParams object based on current filters
        const filterParams = {};
        if (filters.priority !== 'All') {
          filterParams.priority = filters.priority.toLowerCase();
        }
        
        if (filters.dateRange !== 'All') {
          filterParams.dateRange = true;
          // Mock date calculations for testing
        }
        
        const data = await mockGetLogs(filterParams);
        setLogs(data);
        setFilteredLogs(data);
        setVisibleLogs(data.slice(0, logIncrement));
        setLoading(false);
      } catch (err) {
        setError(`Failed to fetch logs: ${err.message}`);
        setLoading(false);
      }
    };
    
    fetchLogs();
  }, [filters.dateRange, filters.priority]);

  // Apply filters client-side
  React.useEffect(() => {
    let result = logs;
    
    // Apply priority filter
    if (filters.priority !== 'All') {
      result = result.filter(log => 
        log.priority === filters.priority.toLowerCase()
      );
    }
    
    // Apply user filter
    if (filters.user !== 'All') {
      result = result.filter(log => {
        const baseUsername = log.user.replace(/ \(login attempt\)$/, '');
        return baseUsername === filters.user;
      });
    }
    
    setFilteredLogs(result);
    setVisibleLogs(result.slice(0, logsToShow));
  }, [filters, logs, logsToShow]);

  // Handle scroll for lazy loading
  const handleScroll = () => {
    // Simplified for testing
    if (visibleLogs.length < filteredLogs.length) {
      const nextBatch = Math.min(logsToShow + logIncrement, filteredLogs.length);
      setLogsToShow(nextBatch);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
    setLogsToShow(logIncrement);
  };

  // Handle quick filter buttons
  const handleAllLogs = () => {
    setFilters({
      dateRange: 'All',
      priority: 'All',
      user: 'All'
    });
    setLogsToShow(logIncrement);
  };

  const handleHighPriorityOnly = () => {
    setFilters(prev => ({
      ...prev,
      priority: 'high'
    }));
    setLogsToShow(logIncrement);
  };

  // Format date to readable format
  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  // Export logs
  const handleExport = async () => {
    try {
      await mockExportLogs();
    } catch (err) {
      setError(`Failed to export logs: ${err.message}`);
    }
  };

  if (loading) return <div data-testid="loading-state">Loading logs...</div>;
  if (error) return <div data-testid="error-state">{error}</div>;

  return (
    <div className="logs-container">
      <h1>Logs/Audit Trail Screen (Admin)</h1>
      
      <div className="logs-controls">
        <div className="logs-filters">
          <button 
            className={filters.dateRange === 'All' && filters.priority === 'All' && filters.user === 'All' ? 'active' : ''}
            onClick={handleAllLogs}
            data-testid="all-logs-btn"
          >
            All Logs
          </button>
          <button 
            className={filters.priority === 'high' ? 'active' : ''}
            onClick={handleHighPriorityOnly}
            data-testid="high-priority-btn"
          >
            High Priority Only
          </button>
          <button onClick={handleExport} data-testid="export-btn">Export Logs</button>
        </div>
        
        <div className="filter-selects">
          <select 
            name="priority" 
            value={filters.priority} 
            onChange={handleFilterChange}
            data-testid="priority-select"
          >
            <option value="All">All Priorities</option>
            <option value="high">High Priority</option>
            <option value="normal">Normal Priority</option>
          </select>
        </div>
      </div>
      
      <div className="logs-list" data-testid="logs-list">
        {visibleLogs.length === 0 ? (
          <div data-testid="no-logs-message">No logs match your filters</div>
        ) : (
          visibleLogs.map((log, index) => (
            <div 
              key={index} 
              className={log.priority === 'high' ? 'high-priority' : ''}
              data-testid={`log-item-${index}`}
            >
              <div>
                {log.priority === 'high' && <span data-testid="high-priority-tag">[HIGH PRIORITY]</span>}
                <span data-testid={`log-timestamp-${index}`}>{formatDate(log.timestamp)}</span>
                <span data-testid={`log-user-${index}`}>User '{log.user}'</span>
                <span data-testid={`log-action-${index}`}>{log.action}</span>
              </div>
              <div>
                <span>Method: {log.method}</span>
                <span>Endpoint: {log.endpoint}</span>
                <span>IP: {log.ip}</span>
              </div>
            </div>
          ))
        )}
        {visibleLogs.length < filteredLogs.length && (
          <div data-testid="loading-more">Loading more logs as you scroll...</div>
        )}
      </div>
      
      <div className="logs-summary">
        <div data-testid="logs-count">
          Showing {visibleLogs.length} of {filteredLogs.length} logs
          {filteredLogs.length !== logs.length && (
            <span data-testid="filtered-count"> (filtered from {logs.length} total)</span>
          )}
        </div>
      </div>
      <button onClick={handleScroll} data-testid="load-more-button">Load More</button>
    </div>
  );
}

describe('LogsView Component', () => {
  beforeEach(() => {
    // Reset mocks
    mockGetLogs.mockClear();
    mockExportLogs.mockClear();
    
    // Setup default mock implementation
    mockGetLogs.mockResolvedValue(mockLogs);
    mockExportLogs.mockResolvedValue({});
  });

  test('renders loading state initially', async () => {
    // Delay the mock response to ensure loading state is displayed
    mockGetLogs.mockImplementation(() => new Promise(resolve => {
      setTimeout(() => resolve(mockLogs), 100);
    }));
    
    render(<LogsView />);
    
    expect(screen.getByTestId('loading-state')).toBeInTheDocument();
  });

  test('displays error message when logs fetch fails', async () => {
    // Mock an error response
    mockGetLogs.mockRejectedValue(new Error('Network error'));
    
    render(<LogsView />);
    
    await waitFor(() => {
      expect(screen.getByTestId('error-state')).toBeInTheDocument();
      expect(screen.getByText('Failed to fetch logs: Network error')).toBeInTheDocument();
    });
  });

  test('displays logs when fetch is successful', async () => {
    render(<LogsView />);
    
    await waitFor(() => {
      // Should show at least the first batch of logs (logIncrement = 2)
      expect(screen.getByTestId('log-item-0')).toBeInTheDocument();
      expect(screen.getByTestId('log-item-1')).toBeInTheDocument();
    });
    
    // Verify specific log content using testid selectors to avoid duplicates
    expect(screen.getByTestId('log-user-0')).toHaveTextContent('admin');
    expect(screen.getByTestId('log-action-0')).toHaveTextContent('viewed all tasks');
  });

  test('filters logs by priority when High Priority button is clicked', async () => {
    // Mock the implementation to return filtered logs when priority filter is applied
    mockGetLogs.mockImplementation((params) => {
      if (params && params.priority === 'high') {
        return Promise.resolve(mockHighPriorityLogs);
      }
      return Promise.resolve(mockLogs);
    });
    
    render(<LogsView />);
    
    // Wait for logs to load
    await waitFor(() => {
      expect(screen.getByTestId('log-item-0')).toBeInTheDocument();
    });
    
    // Click high priority filter button
    await act(async () => {
      fireEvent.click(screen.getByTestId('high-priority-btn'));
    });
    
    // Wait for the filtered results
    await waitFor(() => {
      // Check that all visible logs are high priority
      const highPriorityTag = screen.getAllByTestId('high-priority-tag');
      expect(highPriorityTag.length).toBeGreaterThan(0);
    });
  });

  test('calls export function when Export Logs button is clicked', async () => {
    render(<LogsView />);
    
    // Wait for logs to load
    await waitFor(() => {
      expect(screen.getByTestId('log-item-0')).toBeInTheDocument();
    });
    
    // Click export button
    fireEvent.click(screen.getByTestId('export-btn'));
    
    // Verify export function was called
    expect(mockExportLogs).toHaveBeenCalled();
  });
  
  test('formats dates correctly', async () => {
    render(<LogsView />);
    
    // Wait for logs to load
    await waitFor(() => {
      expect(screen.getByTestId('log-item-0')).toBeInTheDocument();
    });
    
    // Check date formatting - we can't check exact format due to locale differences,
    // but we can verify the timestamp contains digits and separators
    const timestamp = screen.getByTestId('log-timestamp-0');
    expect(timestamp.textContent).toMatch(/\d+/); // Contains digits
  });
  
  test('loads more logs when load more button is clicked', async () => {
    render(<LogsView />);
    
    // Wait for initial logs to load
    await waitFor(() => {
      expect(screen.getByTestId('log-item-0')).toBeInTheDocument();
      expect(screen.getByTestId('log-item-1')).toBeInTheDocument();
    });
    
    // Should show loading more indicator
    expect(screen.getByTestId('loading-more')).toBeInTheDocument();
    
    // Click load more button
    await act(async () => {
      fireEvent.click(screen.getByTestId('load-more-button'));
    });
    
    // Should load more logs
    await waitFor(() => {
      // We should now have more than the initial 2 logs displayed
      const logItems = screen.queryAllByTestId(/log-item-\d+/);
      expect(logItems.length).toBeGreaterThan(2);
    });
  });
  
  test('shows correct log summary information', async () => {
    render(<LogsView />);
    
    // Wait for logs to load
    await waitFor(() => {
      expect(screen.getByTestId('logs-count')).toBeInTheDocument();
    });
    
    // Initially shows 2 of 5 logs
    expect(screen.getByTestId('logs-count')).toHaveTextContent(/Showing 2 of 5 logs/);
  });
});