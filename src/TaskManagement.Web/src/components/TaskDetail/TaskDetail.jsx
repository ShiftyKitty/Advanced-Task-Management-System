import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { taskService } from '../../services/taskService';
import './TaskDetail.css';

const TaskDetail = ({ isEditing = false }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [task, setTask] = useState(null);
  const [editedTask, setEditedTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  // Fetch task data on component mount
  useEffect(() => {
    const fetchTask = async () => {
      try {
        const data = await taskService.getTask(id);
        setTask(data);
        setEditedTask({
          ...data,
          dueDate: new Date(data.dueDate).toISOString().split('T')[0]
        });
      } catch (err) {
        setError('Failed to load task details');
      } finally {
        setLoading(false);
      }
    };
    
    fetchTask();
  }, [id]);

  // Format date in Irish format (DD/MM/YYYY)
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
  
  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    
    // Show confirmation when upgrading to high priority
    if (name === 'priority' && parseInt(value) === 2 && (!task || task.priority !== 2)) {
      setShowModal(true);
    }
    
    setEditedTask(prev => ({
      ...prev,
      [name]: name === 'priority' || name === 'status' ? parseInt(value) : value
    }));
  }, [task]);
  
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    
    if (!editedTask?.title?.trim()) {
      setError('Title is required');
      return;
    }
    
    try {
      setLoading(true);
      
      // Preserve original owner when updating
      const updatedTask = {
        ...editedTask,
        userId: task.userId
      };
      
      await taskService.updateTask(id, updatedTask);
      navigate('/');
    } catch (err) {
      setError('Failed to update task');
      setLoading(false);
    }
  }, [editedTask, id, navigate, task]);
  
  const handleDelete = useCallback(async () => {
    try {
      setLoading(true);
      await taskService.deleteTask(id);
      navigate('/');
    } catch (err) {
      setError('Failed to delete task');
      setLoading(false);
    }
  }, [id, navigate]);
  
  const handleModalConfirm = useCallback(() => {
    setShowModal(false);
  }, []);

  const handleModalCancel = useCallback(() => {
    setShowModal(false);
    // Revert to medium priority
    setEditedTask(prev => ({
      ...prev,
      priority: 1
    }));
  }, []);

  // Memoize utility functions to prevent recalculation
  const getPriorityLabel = useCallback((priority) => {
    return priority === 0 ? 'LOW' : priority === 1 ? 'MEDIUM' : 'HIGH';
  }, []);

  const getStatusLabel = useCallback((status) => {
    return status === 0 ? 'PENDING' : 
           status === 1 ? 'IN PROGRESS' : 
           status === 2 ? 'COMPLETED' : 'ARCHIVED';
  }, []);

  // Check if task is overdue
  const isOverdue = useCallback((dueDate) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const taskDueDate = new Date(dueDate);
    taskDueDate.setHours(0, 0, 0, 0);
    
    return taskDueDate < today && (task?.status !== 2);
  }, [task]);
  
  // Handle loading and error states
  if (loading && !task) {
    return <div className="loading-container" aria-live="polite">Loading task details...</div>;
  }
  
  if (error && !task) {
    return <div className="error-container" role="alert">{error}</div>;
  }
  
  if (!task) {
    return <div className="error-container" role="alert">Task not found</div>;
  }
  
  return (
    <div className="task-detail-container">
      <h1 className="screen-title">
        {isEditing ? 'Task Detail/Edit Screen' : 'Task Detail Screen'}
      </h1>
      
      {isEditing ? (
        <div className="task-edit-form">
          <form onSubmit={handleSubmit} noValidate>
            {error && <div className="form-error" role="alert">{error}</div>}
            
            <div className="form-group">
              <label htmlFor="title">Title:</label>
              <input
                id="title"
                name="title"
                type="text"
                value={editedTask.title}
                onChange={handleChange}
                required
                placeholder="Enter task title"
                data-testid="task-title-input"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="description">Description:</label>
              <textarea
                id="description"
                name="description"
                value={editedTask.description || ''}
                onChange={handleChange}
                rows={4}
                placeholder="Describe the task details"
                data-testid="task-description-input"
              />
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="priority">Priority:</label>
                <select
                  id="priority"
                  name="priority"
                  value={editedTask.priority}
                  onChange={handleChange}
                  className={`priority-select priority-${editedTask.priority}`}
                  data-testid="task-priority-select"
                >
                  <option value={0}>Low</option>
                  <option value={1}>Medium</option>
                  <option value={2}>High</option>
                </select>
              </div>
              
              <div className="form-group">
                <label htmlFor="dueDate">Due Date:</label>
                <input
                  id="dueDate"
                  name="dueDate"
                  type="date"
                  value={editedTask.dueDate}
                  onChange={handleChange}
                  data-testid="task-duedate-input"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="status">Status:</label>
                <select
                  id="status"
                  name="status"
                  value={editedTask.status}
                  onChange={handleChange}
                  className={`status-select status-${editedTask.status}`}
                  data-testid="task-status-select"
                >
                  <option value={0}>Pending</option>
                  <option value={1}>In Progress</option>
                  <option value={2}>Completed</option>
                  <option value={3}>Archived</option>
                </select>
              </div>
            </div>
            
            <div className="form-group">
              <label>Assigned To:</label>
              <div className="owner-display">
                {task.userName || 'Unassigned'}
              </div>
            </div>
            
            <div className="form-actions">
              <button 
                type="button" 
                className="btn-cancel" 
                onClick={() => navigate('/')} 
                disabled={loading}
                data-testid="cancel-button"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="btn-update" 
                disabled={loading}
                data-testid="update-button"
              >
                {loading ? 'Saving...' : 'Update Task'}
              </button>
              <button 
                type="button" 
                className="btn-delete" 
                onClick={() => setShowDeleteModal(true)} 
                disabled={loading}
                data-testid="delete-button"
              >
                Delete Task
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="task-detail-view">
          <div className="detail-card">
            <div className="detail-header">
              <h2>{task.title}</h2>
              <div className="badge-container">
                <span className={`priority priority-${task.priority}`}>
                  {getPriorityLabel(task.priority)}
                </span>
                <span className={`status status-${task.status}`}>
                  {getStatusLabel(task.status)}
                </span>
              </div>
            </div>
            
            <div className="detail-meta">
              <span className={`due-date ${isOverdue(task.dueDate) ? 'overdue' : ''}`}>
                Due Date: {formatDate(task.dueDate)}
                {isOverdue(task.dueDate) && <span className="overdue-label"> (OVERDUE)</span>}
              </span>
              
              <span className="task-owner">
                Assigned To: {task.userName || 'Unassigned'}
              </span>
            </div>
            
            <div className="detail-description">
              <h3>Description</h3>
              <p>{task.description || 'No description provided'}</p>
            </div>
            
            <div className="detail-actions">
              <button 
                className="btn-back" 
                onClick={() => navigate('/')}
                data-testid="back-button"
              >
                Back to List
              </button>
              <button 
                className="btn-edit" 
                onClick={() => navigate(`/tasks/${id}/edit`)}
                data-testid="edit-button"
              >
                Edit Task
              </button>
              <button 
                className="btn-delete" 
                onClick={() => setShowDeleteModal(true)}
                data-testid="view-delete-button"
              >
                Delete Task
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Priority confirmation modal */}
      {showModal && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal">
            <h3>High Priority Confirmation</h3>
            <p>Are you sure you want to set this task to High priority? High priority tasks will generate notifications and appear prominently in the dashboard.</p>
            <div className="modal-actions">
              <button 
                className="btn-cancel" 
                onClick={handleModalCancel}
                data-testid="priority-cancel-button"
              >
                No, use medium priority
              </button>
              <button 
                className="btn-confirm" 
                onClick={handleModalConfirm}
                data-testid="priority-confirm-button"
              >
                Yes, use high priority
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Delete confirmation modal */}
      {showDeleteModal && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal">
            <h3>Delete Confirmation</h3>
            <p>Are you sure you want to delete this task? This action cannot be undone.</p>
            <div className="modal-actions">
              <button 
                className="btn-cancel" 
                onClick={() => setShowDeleteModal(false)}
                data-testid="delete-cancel-button"
              >
                Cancel
              </button>
              <button 
                className="btn-delete" 
                onClick={handleDelete}
                data-testid="delete-confirm-button"
              >
                Delete Task
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskDetail;