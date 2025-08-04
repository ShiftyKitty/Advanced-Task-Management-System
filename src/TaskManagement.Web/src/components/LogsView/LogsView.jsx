import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
  
  const logIncrement = 20;
  const [logsToShow, setLogsToShow] = useState(logIncrement);
  const logsListRef = useRef(null);

  // Fetch logs with server-side filtering where possible
  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const filterParams = {};
      
      if (filters.priority !== 'All') {
        filterParams.priority = filters.priority.toLowerCase();
      }
      
      if (filters.dateRange !== 'All') {
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
    } catch (err) {
      setError(`Failed to fetch logs: ${err.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  }, [filters.dateRange, filters.priority]);

  // Load initial data
  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Apply additional client-side filtering
  useEffect(() => {
    let result = logs;
    
    // Date filtering
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
    
    // Priority filtering
    if (filters.priority !== 'All') {
      result = result.filter(log => 
        log.priority === filters.priority.toLowerCase()
      );
    }
    
    // User filtering - normalize by removing login attempt suffix
    if (filters.user !== 'All') {
      result = result.filter(log => {
        const baseUsername = log.user.replace(/ \(login attempt\)$/, '');
        return baseUsername === filters.user;
      });
    }
    
    setFilteredLogs(result);
    setVisibleLogs(result.slice(0, logsToShow));
  }, [filters, logs, logsToShow]);

  // Handle infinite scrolling
  const handleScroll = useCallback((e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 50;
    
    if (isNearBottom && visibleLogs.length < filteredLogs.length) {
      const nextBatch = Math.min(logsToShow + logIncrement, filteredLogs.length);
      setLogsToShow(nextBatch);
      setVisibleLogs(filteredLogs.slice(0, nextBatch));
    }
  }, [filteredLogs, logsToShow, visibleLogs.length]);

  // Handle filter changes and reset pagination
  const handleFilterChange = useCallback((e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
    setLogsToShow(logIncrement);
  }, []);

  // Quick filter presets
  const handleAllLogs = useCallback(() => {
    setFilters({
      dateRange: 'All',
      priority: 'All',
      user: 'All'
    });
    setLogsToShow(logIncrement);
  }, []);

  const handleHighPriorityOnly = useCallback(() => {
    setFilters(prev => ({
      ...prev,
      priority: 'high'
    }));
    setLogsToShow(logIncrement);
  }, []);

  const handleDateRangeFilter = useCallback(() => {
    setFilters(prev => ({
      ...prev,
      dateRange: 'Last 7 days'
    }));
    setLogsToShow(logIncrement);
  }, []);

  // Export logs to CSV
  const handleExport = useCallback(async () => {
    try {
      setError(null);
      await logService.exportLogs();
    } catch (err) {
      setError(`Failed to export logs: ${err.message || 'Unknown error'}`);
    }
  }, []);

  // Format timestamps consistently
  const formatDate = useCallback((timestamp) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleString('en-IE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch (e) {
      return 'Invalid date';
    }
  }, []);

  // Get unique usernames for filter dropdown
  const uniqueUsers = useMemo(() => {
    return [...new Set(logs.map(log => {
      return log.user.replace(/ \(login attempt\)$/, '');
    }))].sort();
  }, [logs]);

  // Handle initial loading state
  if (loading && logs.length === 0) {
    return <div className="loading" aria-live="polite">Loading logs...</div>;
  }
  
  // Handle error state with retry option
  if (error) {
    return (
      <div className="error" role="alert" aria-live="assertive">
        {error}
        <button onClick={fetchLogs} className="retry-button">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="logs-container">
      <h1 className="screen-title">Logs/Audit Trail Screen (Admin)</h1>
      
      <div className="logs-controls">
        <div className="logs-filters">
          <button 
            className={`btn-all-logs ${filters.dateRange === 'All' && filters.priority === 'All' && filters.user === 'All' ? 'active' : ''}`}
            onClick={handleAllLogs}
            aria-pressed={filters.dateRange === 'All' && filters.priority === 'All' && filters.user === 'All'}
          >
            All Logs
          </button>
          <button 
            className={`btn-high-priority ${filters.priority === 'high' ? 'active' : ''}`}
            onClick={handleHighPriorityOnly}
            aria-pressed={filters.priority === 'high'}
          >
            High Priority Only
          </button>
          <button 
            className={`btn-date-range ${filters.dateRange === 'Last 7 days' ? 'active' : ''}`}
            onClick={handleDateRangeFilter}
            aria-pressed={filters.dateRange === 'Last 7 days'}
          >
            Last 7 Days
          </button>
          <button 
            className="btn-export" 
            onClick={handleExport}
            disabled={filteredLogs.length === 0}
          >
            Export Logs
          </button>
        </div>
        
        <div className="filter-selects">
          <select 
            name="dateRange" 
            value={filters.dateRange} 
            onChange={handleFilterChange}
            aria-label="Filter by date range"
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
            aria-label="Filter by priority"
          >
            <option value="All">All Priorities</option>
            <option value="high">High Priority</option>
            <option value="normal">Normal Priority</option>
          </select>
          
          <select 
            name="user" 
            value={filters.user} 
            onChange={handleFilterChange}
            aria-label="Filter by user"
          >
            <option value="All">All Users</option>
            {uniqueUsers.map(user => (
              <option key={user} value={user}>{user}</option>
            ))}
          </select>
        </div>
      </div>
      
      <div 
        className="logs-list" 
        onScroll={handleScroll}
        ref={logsListRef}
        tabIndex={0}
        aria-label="Log entries"
      >
        {loading && logs.length > 0 && (
          <div className="list-loading-overlay" aria-live="polite">
            Updating logs...
          </div>
        )}
      
        {visibleLogs.length === 0 ? (
          <div className="no-logs">No logs match your filters</div>
        ) : (
          visibleLogs.map((log, index) => (
            <div 
              key={log.id || index} 
              className={`log-item ${log.priority === 'high' ? 'high-priority' : ''}`}
            >
              {log.priority === 'high' ? (
                <>
                  <div className="log-line">
                    <span className="high-priority-label">[HIGH PRIORITY]</span> - {formatDate(log.timestamp)} - User '{log.user}' {log.action}
                  </div>
                  <div className="log-details">
                    Method: {log.method} - Endpoint: {log.endpoint} - IP: {log.ip}
                  </div>
                </>
              ) : (
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
          <div className="loading-more" aria-live="polite">
            Loading more logs as you scroll...
          </div>
        )}
      </div>
      
      <div className="logs-summary" aria-live="polite">
        <div className="logs-count">
          Showing {visibleLogs.length} of {filteredLogs.length} logs
          {filteredLogs.length !== logs.length && ` (filtered from ${logs.length} total)`}
        </div>
      </div>
    </div>
  );
};

export default LogsView;