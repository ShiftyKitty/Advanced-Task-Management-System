// LogsView.jsx
import { useState, useEffect } from 'react';
import { logService } from '../../services/logService';
import './LogsView.css';

const LogsView = () => {
  const [logs, setLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [visibleLogs, setVisibleLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    dateRange: 'All',
    priority: 'All',
    user: 'All'
  });
  
  // Number of logs to load at once for lazy loading
  const logIncrement = 20;
  const [logsToShow, setLogsToShow] = useState(logIncrement);

  // Fetch logs from the API
  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      
      // Build filter object based on current filter state
      const filterParams = {};
      if (filters.priority !== 'All') {
        filterParams.priority = filters.priority.toLowerCase();
      }
      
      if (filters.dateRange !== 'All') {
        // Calculate date range based on selection
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        let startDate = new Date(today);
        let endDate = new Date(today);
        endDate.setHours(23, 59, 59, 999);
        
        switch(filters.dateRange) {
          case 'Today':
            break;
          case 'Yesterday':
            startDate.setDate(today.getDate() - 1);
            endDate.setDate(today.getDate() - 1);
            break;
          case 'Last 7 days':
            startDate.setDate(today.getDate() - 7);
            break;
          case 'Last 30 days':
            startDate.setDate(today.getDate() - 30);
            break;
          default:
            break;
        }
        
        filterParams.dateRange = true;
        filterParams.startDate = startDate.toISOString().split('T')[0];
        filterParams.endDate = endDate.toISOString().split('T')[0];
      }
      
      const data = await logService.getLogs(filterParams);
      setLogs(data);
      setFilteredLogs(data);
      setVisibleLogs(data.slice(0, logIncrement));
      setLoading(false);
    } catch (err) {
      setError(`Failed to fetch logs: ${err.message}`);
      setLoading(false);
    }
  };

  // Apply filters when they change
  useEffect(() => {
    let result = logs;
    
    // Apply date range filter
    if (filters.dateRange !== 'All') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      
      const lastWeek = new Date(today);
      lastWeek.setDate(today.getDate() - 7);
      
      const lastMonth = new Date(today);
      lastMonth.setMonth(today.getMonth() - 1);
      
      switch(filters.dateRange) {
        case 'Today':
          result = result.filter(log => {
            const logDate = new Date(log.timestamp);
            return logDate >= today;
          });
          break;
        case 'Yesterday':
          result = result.filter(log => {
            const logDate = new Date(log.timestamp);
            return logDate >= yesterday && logDate < today;
          });
          break;
        case 'Last 7 days':
          result = result.filter(log => {
            const logDate = new Date(log.timestamp);
            return logDate >= lastWeek;
          });
          break;
        case 'Last 30 days':
          result = result.filter(log => {
            const logDate = new Date(log.timestamp);
            return logDate >= lastMonth;
          });
          break;
        default:
          break;
      }
    }
    
    // Apply priority filter
    if (filters.priority !== 'All') {
      result = result.filter(log => 
        log.priority === filters.priority.toLowerCase()
      );
    }
    
    // Apply user filter
    if (filters.user !== 'All') {
      result = result.filter(log => 
        log.user === filters.user
      );
    }
    
    setFilteredLogs(result);
    setVisibleLogs(result.slice(0, logsToShow));
  }, [filters, logs, logsToShow]);

  // Handle scroll for lazy loading
  const handleScroll = (e) => {
    const bottom = e.target.scrollHeight - e.target.scrollTop - e.target.clientHeight < 50;
    if (bottom && visibleLogs.length < filteredLogs.length) {
      const nextBatch = Math.min(logsToShow + logIncrement, filteredLogs.length);
      setLogsToShow(nextBatch);
      setVisibleLogs(filteredLogs.slice(0, nextBatch));
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
    // Reset logs to show when filtering
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

  const handleDateRangeFilter = () => {
    setFilters(prev => ({
      ...prev,
      dateRange: 'Last 7 days'
    }));
    setLogsToShow(logIncrement);
  };

  // Get unique users for the user filter
  const uniqueUsers = [...new Set(logs.map(log => log.user))];

  // Format date to readable format
  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-IE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  // Export logs as CSV using the service
  const handleExport = async () => {
    try {
      await logService.exportLogs();
    } catch (err) {
      setError(`Failed to export logs: ${err.message}`);
    }
  };

  if (loading) return <div className="loading">Loading logs...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="logs-container">
      <h1 className="screen-title">Logs/Audit Trail Screen (Admin)</h1>
      
      <div className="logs-controls">
        <div className="logs-filters">
          <button 
            className={`btn-all-logs ${filters.dateRange === 'All' && filters.priority === 'All' && filters.user === 'All' ? 'active' : ''}`}
            onClick={handleAllLogs}
          >
            All Logs
          </button>
          <button 
            className={`btn-high-priority ${filters.priority === 'high' ? 'active' : ''}`}
            onClick={handleHighPriorityOnly}
          >
            High Priority Only
          </button>
          <button 
            className={`btn-date-range ${filters.dateRange === 'Last 7 days' ? 'active' : ''}`}
            onClick={handleDateRangeFilter}
          >
            Date Range
          </button>
          <button className="btn-export" onClick={handleExport}>Export Logs</button>
        </div>
        
        <div className="filter-selects">
          <select 
            name="dateRange" 
            value={filters.dateRange} 
            onChange={handleFilterChange}
          >
            <option value="All">All Dates</option>
            <option value="Today">Today</option>
            <option value="Yesterday">Yesterday</option>
            <option value="Last 7 days">Last 7 days</option>
            <option value="Last 30 days">Last 30 days</option>
          </select>
          
          <select 
            name="priority" 
            value={filters.priority} 
            onChange={handleFilterChange}
          >
            <option value="All">All Priorities</option>
            <option value="high">High Priority</option>
            <option value="normal">Normal Priority</option>
          </select>
          
          <select 
            name="user" 
            value={filters.user} 
            onChange={handleFilterChange}
          >
            <option value="All">All Users</option>
            {uniqueUsers.map(user => (
              <option key={user} value={user}>{user}</option>
            ))}
          </select>
        </div>
      </div>
      
      <div className="logs-list" onScroll={handleScroll}>
        {visibleLogs.length === 0 ? (
          <div className="no-logs">No logs match your filters</div>
        ) : (
          visibleLogs.map((log, index) => (
            <div key={index} className={`log-item ${log.priority === 'high' ? 'high-priority' : ''}`}>
              {log.priority === 'high' ? (
                // High priority log format that matches wireframe
                <>
                  <div className="log-line">
                    <span className="high-priority-label">[HIGH PRIORITY]</span> - {formatDate(log.timestamp)} - User '{log.user}' {log.action}
                  </div>
                  <div className="log-details">
                    Method: {log.method} - Endpoint: {log.endpoint} - IP: {log.ip}
                  </div>
                </>
              ) : (
                // Normal priority log format
                <>
                  <div className="log-header">
                    <span className="log-timestamp">{formatDate(log.timestamp)}</span>
                    <span className="log-user">User '{log.user}'</span>
                    <span className="log-action">{log.action}</span>
                  </div>
                  <div className="log-details">
                    <span className="log-method">Method: {log.method}</span>
                    <span className="log-endpoint">Endpoint: {log.endpoint}</span>
                    <span className="log-ip">IP: {log.ip}</span>
                  </div>
                </>
              )}
            </div>
          ))
        )}
        {visibleLogs.length < filteredLogs.length && (
          <div className="loading-more">Loading more logs as you scroll...</div>
        )}
      </div>
      
      <div className="logs-summary">
        <div className="logs-count">
          Showing {visibleLogs.length} of {filteredLogs.length} logs
          {filteredLogs.length !== logs.length && ` (filtered from ${logs.length} total)`}
        </div>
      </div>
    </div>
  );
};

export default LogsView;