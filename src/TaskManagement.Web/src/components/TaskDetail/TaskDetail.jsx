// Updated TaskDetail.jsx
import { useState, useEffect } from 'react';
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
  
  useEffect(() => {
    const fetchTask = async () => {
      try {
        const data = await taskService.getTask(id);
        setTask(data);
        setEditedTask({
          ...data,
          dueDate: new Date(data.dueDate).toISOString().split('T')[0]
        });
        setLoading(false);
      } catch (err) {
        setError('Failed to load task details');
        setLoading(false);
      }
    };
    
    fetchTask();
  }, [id]);

  // Format date in Irish format (DD/MM/YYYY)
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // If changing priority to high (2), show confirmation modal
    if (name === 'priority' && parseInt(value) === 2 && (!task || task.priority !== 2)) {
      setShowModal(true);
    }
    
    setEditedTask(prev => ({
      ...prev,
      [name]: name === 'priority' || name === 'status' ? parseInt(value) : value
    }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!editedTask.title.trim()) {
      setError('Title is required');
      return;
    }
    
    try {
      setLoading(true);
      await taskService.updateTask(id, editedTask);
      navigate('/');
    } catch (err) {
      setError('Failed to update task');
      setLoading(false);
    }
  };
  
  const handleDelete = async () => {
    try {
      setLoading(true);
      await taskService.deleteTask(id);
      navigate('/');
    } catch (err) {
      setError('Failed to delete task');
      setLoading(false);
    }
  };
  
  const handleModalConfirm = () => {
    setShowModal(false);
    // Priority was already set in handleChange
  };

  const handleModalCancel = () => {
    setShowModal(false);
    // Revert to medium priority
    setEditedTask(prev => ({
      ...prev,
      priority: 1
    }));
  };

  // Get priority label
  const getPriorityLabel = (priority) => {
    return priority === 0 ? 'LOW' : priority === 1 ? 'MEDIUM' : 'HIGH';
  };

  // Get status label
  const getStatusLabel = (status) => {
    return status === 0 ? 'TO DO' : 
           status === 1 ? 'IN PROGRESS' : 
           status === 2 ? 'COMPLETED' : 'ARCHIVED';
  };
  
  if (loading) return <div className="loading-container">Loading task details...</div>;
  if (error) return <div className="error-container">{error}</div>;
  if (!task) return <div className="error-container">Task not found</div>;
  
  return (
    <div className="task-detail-container">
      <h1 className="screen-title">
        {isEditing ? 'Task Detail/Edit Screen' : 'Task Detail Screen'}
      </h1>
      
      {isEditing ? (
        <div className="task-edit-form">
          <form onSubmit={handleSubmit}>
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
                placeholder="Update the system to version 2.0 with all the new features"
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
                >
                  <option value={0}>To Do</option>
                  <option value={1}>In Progress</option>
                  <option value={2}>Completed</option>
                  <option value={3}>Archived</option>
                </select>
              </div>
            </div>
            
            <div className="form-actions">
              <button 
                type="button" 
                className="btn-cancel" 
                onClick={() => navigate('/')} 
                disabled={loading}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="btn-update" 
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Update Task'}
              </button>
              <button 
                type="button" 
                className="btn-delete" 
                onClick={() => setShowDeleteModal(true)} 
                disabled={loading}
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
              <span className="due-date">Due Date: {formatDate(task.dueDate)}</span>
            </div>
            
            <div className="detail-description">
              <h3>Description</h3>
              <p>{task.description || 'No description provided'}</p>
            </div>
            
            <div className="detail-actions">
              <button 
                className="btn-back" 
                onClick={() => navigate('/')}
              >
                Back to List
              </button>
              <button 
                className="btn-edit" 
                onClick={() => navigate(`/tasks/${id}/edit`)}
              >
                Edit Task
              </button>
              <button 
                className="btn-delete" 
                onClick={() => setShowDeleteModal(true)}
              >
                Delete Task
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* High Priority Confirmation Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>High Priority Confirmation</h3>
            <p>If the user sets a task to 'high' priority, display a confirmation modal asking if they're sure.</p>
            <div className="modal-actions">
              <button 
                className="btn-cancel" 
                onClick={handleModalCancel}
              >
                No, use medium priority
              </button>
              <button 
                className="btn-confirm" 
                onClick={handleModalConfirm}
              >
                Yes, use high priority
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Delete Confirmation</h3>
            <p>Are you sure you want to delete this task? This action cannot be undone.</p>
            <div className="modal-actions">
              <button 
                className="btn-cancel" 
                onClick={() => setShowDeleteModal(false)}
              >
                Cancel
              </button>
              <button 
                className="btn-delete" 
                onClick={handleDelete}
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