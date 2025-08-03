import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { taskService } from '../../services/taskService';
import TaskStats from '../TaskStats/TaskStats';
import './TaskList.css';

const TaskList = () => {
  const [tasks, setTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [visibleTasks, setVisibleTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    filter: 'All',
    priority: 'All',
    status: 'All',
    showArchived: false
  });
  
  const [sortMethod, setSortMethod] = useState('dueDate-asc');
  
  const taskIncrement = 5;
  const [tasksToShow, setTasksToShow] = useState(taskIncrement);

  const formatDate = useCallback((dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-IE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (e) {
      return 'Invalid date';
    }
  }, []);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setLoading(true);
        const data = await taskService.getTasks();
        setTasks(data);
        setFilteredTasks(data);
        setVisibleTasks(data.slice(0, taskIncrement));
      } catch (err) {
        setError(`Failed to fetch tasks: ${err.message || 'Please try again later'}`);
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, []);

  useEffect(() => {
    let result = tasks;
    
    // Apply time-based filter
    if (filters.filter !== 'All') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);
      
      const nextWeek = new Date(today);
      nextWeek.setDate(today.getDate() + 7);
      
      switch(filters.filter) {
        case 'Today':
          result = result.filter(task => {
            const dueDate = new Date(task.dueDate);
            dueDate.setHours(0, 0, 0, 0);
            return dueDate.getTime() === today.getTime();
          });
          break;
        case 'Upcoming':
          result = result.filter(task => {
            const dueDate = new Date(task.dueDate);
            dueDate.setHours(0, 0, 0, 0);
            return dueDate > today && dueDate <= nextWeek;
          });
          break;
        case 'Overdue':
          result = result.filter(task => {
            const dueDate = new Date(task.dueDate);
            dueDate.setHours(0, 0, 0, 0);
            return dueDate < today && task.status !== 2;
          });
          break;
        case 'Archived':
          result = result.filter(task => task.status === 3);
          break;
        default:
          break;
      }
    }
    
    // Apply priority filter
    if (filters.priority !== 'All') {
      result = result.filter(task => task.priority === parseInt(filters.priority));
    }
    
    // Apply status filter
    if (filters.status !== 'All') {
      result = result.filter(task => task.status === parseInt(filters.status));
    } else if (!filters.showArchived && filters.filter !== 'Archived') {
      // Hide archived tasks by default
      result = result.filter(task => task.status !== 3);
    }
    
    // Apply sorting
    const [sortBy, direction] = sortMethod.split('-');
    const sortMultiplier = direction === 'asc' ? 1 : -1;
    
    result = [...result].sort((a, b) => {
      switch (sortBy) {
        case 'dueDate':
          return (new Date(a.dueDate) - new Date(b.dueDate)) * sortMultiplier;
        case 'priority':
          return (a.priority - b.priority) * sortMultiplier;
        case 'title':
          return a.title.localeCompare(b.title) * sortMultiplier;
        case 'status':
          return (a.status - b.status) * sortMultiplier;
        case 'created':
          return (a.id - b.id) * sortMultiplier;
        default:
          return 0;
      }
    });
    
    setFilteredTasks(result);
    setVisibleTasks(result.slice(0, tasksToShow));
  }, [filters, sortMethod, tasks, tasksToShow]);

  const handleScroll = useCallback((e) => {
    const scrollPosition = e.target.scrollHeight - e.target.scrollTop - e.target.clientHeight;
    if (scrollPosition < 50 && visibleTasks.length < filteredTasks.length) {
      const nextBatch = Math.min(tasksToShow + taskIncrement, filteredTasks.length);
      setTasksToShow(nextBatch);
    }
  }, [filteredTasks.length, tasksToShow, visibleTasks.length]);

  const handleFilterChange = useCallback((e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
    setTasksToShow(taskIncrement);
  }, []);

  const handleSortChange = useCallback((e) => {
    setSortMethod(e.target.value);
    setTasksToShow(taskIncrement);
  }, []);

  const toggleArchived = useCallback(() => {
    setFilters(prev => ({
      ...prev,
      showArchived: !prev.showArchived
    }));
    setTasksToShow(taskIncrement);
  }, []);

  const taskCounts = useMemo(() => ({
    total: tasks.length,
    active: tasks.filter(task => task.status !== 3).length,
    archived: tasks.filter(task => task.status === 3).length
  }), [tasks]);

  if (loading && tasks.length === 0) {
    return <div className="loading-state" aria-live="polite">Loading tasks...</div>;
  }
  
  if (error && tasks.length === 0) {
    return <div className="error" role="alert">{error}</div>;
  }

  return (
    <div className="task-list-container">
      <h1 className="dashboard-title">Task Dashboard/List View</h1>
      
      <div className="list-header">
        <h2>My Tasks</h2>
        <div className="task-actions">
          <div className="archive-toggle">
            <button 
              className={`archive-btn ${filters.showArchived || filters.filter === 'Archived' ? 'active' : ''}`}
              onClick={toggleArchived}
              aria-pressed={filters.showArchived}
              data-testid="archive-toggle"
            >
              {filters.showArchived ? 'Hide Archived' : 'Show Archived'} ({taskCounts.archived})
            </button>
          </div>
          <Link to="/create" className="create-button" data-testid="add-task-button">+ Add Task</Link>
        </div>
      </div>
      
      <div className="filters-container">
        <div className="filters">
          <select 
            name="filter" 
            onChange={handleFilterChange} 
            value={filters.filter}
            aria-label="Filter tasks by time"
            data-testid="time-filter"
          >
            <option value="All">Filter: All</option>
            <option value="Today">Today</option>
            <option value="Upcoming">Upcoming</option>
            <option value="Overdue">Overdue</option>
            <option value="Archived">Archived</option>
          </select>
          
          <select 
            name="priority" 
            onChange={handleFilterChange} 
            value={filters.priority}
            aria-label="Filter tasks by priority"
            data-testid="priority-filter"
          >
            <option value="All">Priority: All</option>
            <option value="0">Low</option>
            <option value="1">Medium</option>
            <option value="2">High</option>
          </select>
          
          <select 
            name="status" 
            onChange={handleFilterChange} 
            value={filters.status}
            aria-label="Filter tasks by status"
            data-testid="status-filter"
          >
            <option value="All">Status: All</option>
            <option value="0">To Do</option>
            <option value="1">In Progress</option>
            <option value="2">Completed</option>
            {(filters.showArchived || filters.filter === 'Archived') && (
              <option value="3">Archived</option>
            )}
          </select>
          
          <select 
            name="sort" 
            onChange={handleSortChange} 
            value={sortMethod}
            aria-label="Sort tasks"
            data-testid="sort-selector"
          >
            <option value="dueDate-asc">Sort: Due Date (earliest)</option>
            <option value="dueDate-desc">Sort: Due Date (latest)</option>
            <option value="priority-asc">Sort: Priority (low to high)</option>
            <option value="priority-desc">Sort: Priority (high to low)</option>
            <option value="title-asc">Sort: Title (A-Z)</option>
            <option value="title-desc">Sort: Title (Z-A)</option>
            <option value="status-asc">Sort: Status (to do first)</option>
            <option value="created-desc">Sort: Recently Created</option>
            <option value="created-asc">Sort: Oldest Created</option>
          </select>
        </div>
      </div>

      <div 
        className="task-list" 
        onScroll={handleScroll}
        aria-label="Task list"
        data-testid="task-list"
      >
        {visibleTasks.length === 0 ? (
          <div className="no-tasks" aria-live="polite">
            {filters.filter === 'Archived' || filters.status === '3' ? 
              'No archived tasks found. To archive a task, open it and change its status to "Archived".' : 
              'No tasks match your filters'}
          </div>
        ) : (
          visibleTasks.map(task => (
            <div 
              key={task.id} 
              className={`task-item priority-${task.priority} ${task.status === 3 ? 'archived' : ''}`}
              data-testid={`task-${task.id}`}
            >
              <div className="task-details">
                <Link to={`/tasks/${task.id}`} className="task-title">
                  <h3>{task.title}</h3>
                </Link>
                <p className="task-description">{task.description}</p>
                <div className="task-meta">
                  <span className="due-date">Due: {formatDate(task.dueDate)}</span>
                  {task.userName && <span className="task-owner">Assigned to: {task.userName}</span>}
                </div>
              </div>
              <div className="task-badges">
                <span className={`priority priority-${task.priority}`}>
                  {task.priority === 0 ? 'LOW' : task.priority === 1 ? 'MEDIUM' : 'HIGH'}
                </span>
                <span className={`status status-${task.status}`}>
                  {task.status === 0 ? 'TO DO' : 
                   task.status === 1 ? 'IN PROGRESS' : 
                   task.status === 2 ? 'COMPLETED' : 'ARCHIVED'}
                </span>
              </div>
            </div>
          ))
        )}
        {visibleTasks.length < filteredTasks.length && (
          <div className="loading-more" aria-live="polite">
            Loading more tasks as you scroll...
          </div>
        )}
      </div>
      
      {(!filters.showArchived && filters.filter !== 'Archived') && (
        <TaskStats tasks={tasks.filter(task => task.status !== 3)} />
      )}
      
      {(filters.showArchived || filters.filter === 'Archived') && (
        <div className="archived-info">
          <h2>Archived Tasks</h2>
          {taskCounts.archived > 0 ? (
            <>
              <p>You have {taskCounts.archived} archived task{taskCounts.archived !== 1 ? 's' : ''}. Archived tasks are hidden from regular views and reports.</p>
              <p>To restore a task from the archive, open it and change its status.</p>
            </>
          ) : (
            <>
              <p>No archived tasks found.</p>
              <p>To archive a task, open it and change its status to "Archived".</p>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default TaskList;

/*
Design/Coding Choices:

1. Performance Optimization:
   - Memoized expensive calculations and callbacks to prevent unnecessary rerenders
   - Implemented lazy loading to handle large datasets efficiently
   - Multi-tiered state management for filtered and visible tasks

2. Filter Architecture:
   - Combined filtering and sorting in a single effect for performance
   - Preserved filter state during view transitions
   - Optimized date calculations for date-based filtering

3. User Experience:
   - Clear empty state messaging based on context
   - Progressive loading with scroll detection
   - Intelligent display of archive options based on current view

4. Accessibility:
   - ARIA attributes for dynamic content and interactive elements
   - Semantic structure with proper heading hierarchy
   - Live regions for status updates

5. Maintainability:
   - Organized code by logical function
   - Conditional rendering for contextual UI elements
   - Test IDs for automated testing support
*/