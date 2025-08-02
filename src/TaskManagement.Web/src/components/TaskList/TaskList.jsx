// Enhanced TaskList.jsx with sorting functionality
import { useState, useEffect } from 'react';
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
    showArchived: false // Filter for archived tasks
  });
  
  // New state for sorting
  const [sortMethod, setSortMethod] = useState('dueDate-asc'); // Default sort by due date (ascending)
  
  // Number of tasks to load at once for lazy loading
  const taskIncrement = 5;
  const [tasksToShow, setTasksToShow] = useState(taskIncrement);

  // Helper function to format dates in Irish format (DD/MM/YYYY)
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const data = await taskService.getTasks();
        setTasks(data);
        setFilteredTasks(data);
        setVisibleTasks(data.slice(0, taskIncrement));
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch tasks. Please try again later.');
        setLoading(false);
      }
    };

    fetchTasks();
  }, []);

  // Apply filters and sorting
  useEffect(() => {
    // Apply filters first
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
            return dueDate < today && task.status !== 2; // Not completed and past due
          });
          break;
        case 'Archived':
          result = result.filter(task => task.status === 3); // Show only archived tasks
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
      // Hide archived tasks by default unless explicitly showing archived
      result = result.filter(task => task.status !== 3);
    }
    
    // Then apply sorting
    const [sortBy, direction] = sortMethod.split('-');
    const sortMultiplier = direction === 'asc' ? 1 : -1;
    
    // Sort the filtered results
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

  // Handle scroll for lazy loading
  const handleScroll = (e) => {
    // Load more when scrolled to within 50px of the bottom
    const scrollPosition = e.target.scrollHeight - e.target.scrollTop - e.target.clientHeight;
    if (scrollPosition < 50 && visibleTasks.length < filteredTasks.length) {
      const nextBatch = Math.min(tasksToShow + taskIncrement, filteredTasks.length);
      setTasksToShow(nextBatch);
      setVisibleTasks(filteredTasks.slice(0, nextBatch));
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
    // Reset tasks to show when filtering
    setTasksToShow(taskIncrement);
  };

  // Handle sort method change
  const handleSortChange = (e) => {
    setSortMethod(e.target.value);
    // Reset tasks to show when sorting
    setTasksToShow(taskIncrement);
  };

  // Toggle showing archived tasks
  const toggleArchived = () => {
    setFilters(prev => ({
      ...prev,
      showArchived: !prev.showArchived
    }));
    // Reset tasks to show when filtering
    setTasksToShow(taskIncrement);
  };

  // Count tasks by status
  const taskCounts = {
    total: tasks.length,
    active: tasks.filter(task => task.status !== 3).length,
    archived: tasks.filter(task => task.status === 3).length
  };

  if (loading) return <div>Loading tasks...</div>;
  if (error) return <div className="error">{error}</div>;

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
            >
              {filters.showArchived ? 'Hide Archived' : 'Show Archived'} ({taskCounts.archived})
            </button>
          </div>
          <Link to="/create" className="create-button">+ Add Task</Link>
        </div>
      </div>
      
      <div className="filters-container">
        <div className="filters">
          <select name="filter" onChange={handleFilterChange} value={filters.filter}>
            <option value="All">Filter: All</option>
            <option value="Today">Today</option>
            <option value="Upcoming">Upcoming</option>
            <option value="Overdue">Overdue</option>
            <option value="Archived">Archived</option>
          </select>
          
          <select name="priority" onChange={handleFilterChange} value={filters.priority}>
            <option value="All">Priority: All</option>
            <option value="0">Low</option>
            <option value="1">Medium</option>
            <option value="2">High</option>
          </select>
          
          <select name="status" onChange={handleFilterChange} value={filters.status}>
            <option value="All">Status: All</option>
            <option value="0">To Do</option>
            <option value="1">In Progress</option>
            <option value="2">Completed</option>
            {(filters.showArchived || filters.filter === 'Archived') && (
              <option value="3">Archived</option>
            )}
          </select>
          
          {/* New sort dropdown */}
          <select name="sort" onChange={handleSortChange} value={sortMethod}>
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

      <div className="task-list" onScroll={handleScroll}>
        {visibleTasks.length === 0 ? (
          <div className="no-tasks">
            {filters.filter === 'Archived' || filters.status === '3' ? 
              'No archived tasks found. To archive a task, open it and change its status to "Archived".' : 
              'No tasks match your filters'}
          </div>
        ) : (
          visibleTasks.map(task => (
            <div key={task.id} className={`task-item priority-${task.priority} ${task.status === 3 ? 'archived' : ''}`}>
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
          <div className="loading-more">Loading more tasks as you scroll...</div>
        )}
      </div>
      
      {/* Only show task stats for non-archived view */}
      {(!filters.showArchived && filters.filter !== 'Archived') && (
        <TaskStats tasks={tasks.filter(task => task.status !== 3)} />
      )}
      
      {/* Show archived info section regardless of whether there are archived tasks */}
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