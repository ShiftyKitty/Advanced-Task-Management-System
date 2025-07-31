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
    priority: 'All',
    status: 'All'
  });
  
  // Number of tasks to load at once for lazy loading
  const taskIncrement = 5;
  const [tasksToShow, setTasksToShow] = useState(taskIncrement);

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

  useEffect(() => {
    // Apply filters
    let result = tasks;
    
    if (filters.priority !== 'All') {
      result = result.filter(task => task.priority === parseInt(filters.priority));
    }
    
    if (filters.status !== 'All') {
      result = result.filter(task => task.status === parseInt(filters.status));
    }
    
    setFilteredTasks(result);
    setVisibleTasks(result.slice(0, tasksToShow));
  }, [filters, tasks, tasksToShow]);

  // Handle scroll for lazy loading
  const handleScroll = (e) => {
    const bottom = e.target.scrollHeight - e.target.scrollTop === e.target.clientHeight;
    if (bottom && visibleTasks.length < filteredTasks.length) {
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

  if (loading) return <div>Loading tasks...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="task-list-container">
      <div className="list-header">
        <h2>My Tasks</h2>
        <Link to="/create" className="create-button">+ Add Task</Link>
      </div>
      
      <div className="filters">
        <select name="priority" onChange={handleFilterChange} value={filters.priority}>
          <option value="All">All Priorities</option>
          <option value="0">Low</option>
          <option value="1">Medium</option>
          <option value="2">High</option>
        </select>
        
        <select name="status" onChange={handleFilterChange} value={filters.status}>
          <option value="All">All Statuses</option>
          <option value="0">Pending</option>
          <option value="1">In Progress</option>
          <option value="2">Completed</option>
          <option value="3">Archived</option>
        </select>
      </div>

      <div className="task-list" onScroll={handleScroll}>
        {visibleTasks.length === 0 ? (
          <div className="no-tasks">No tasks match your filters</div>
        ) : (
          visibleTasks.map(task => (
            <div key={task.id} className={`task-item priority-${task.priority}`}>
              <input 
                type="checkbox" 
                checked={task.status === 2} 
                readOnly 
              />
              <div className="task-details">
                <Link to={`/tasks/${task.id}`} className="task-title">
                  <h3>{task.title}</h3>
                </Link>
                <p>{task.description}</p>
                <div className="task-meta">
                  <span className={`priority priority-${task.priority}`}>
                    {task.priority === 0 ? 'Low' : task.priority === 1 ? 'Medium' : 'High'}
                  </span>
                  <span className={`status status-${task.status}`}>
                    {task.status === 0 ? 'Pending' : 
                     task.status === 1 ? 'In Progress' : 
                     task.status === 2 ? 'Completed' : 'Archived'}
                  </span>
                  <span className="due-date">Due: {new Date(task.dueDate).toLocaleDateString()}</span>
                </div>
              </div>
              <div className="task-actions">
                <Link to={`/tasks/${task.id}/edit`} className="edit-button">Edit</Link>
              </div>
            </div>
          ))
        )}
        {visibleTasks.length < filteredTasks.length && (
          <div className="loading-more">Loading more tasks as you scroll...</div>
        )}
      </div>
      
      {/* Task visualizations */}
      <TaskStats tasks={tasks} />
    </div>
  );
};

export default TaskList;