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
  
  if (loading) return <div>Loading task details...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!task) return <div className="error">Task not found</div>;
  
  return (
    <div className="task-detail-container">
      {isEditing ? (
        <>
          <h2>Edit Task</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="title">Title*</label>
              <input
                id="title"
                name="title"
                type="text"
                value={editedTask.title}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                name="description"
                value={editedTask.description || ''}
                onChange={handleChange}
                rows={4}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="priority">Priority</label>
              <select
                id="priority"
                name="priority"
                value={editedTask.priority}
                onChange={handleChange}
              >
                <option value={0}>Low</option>
                <option value={1}>Medium</option>
                <option value={2}>High</option>
              </select>
            </div>
            
            <div className="form-group">
              <label htmlFor="dueDate">Due Date</label>
              <input
                id="dueDate"
                name="dueDate"
                type="date"
                value={editedTask.dueDate}
                onChange={handleChange}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="status">Status</label>
              <select
                id="status"
                name="status"
                value={editedTask.status}
                onChange={handleChange}
              >
                <option value={0}>Pending</option>
                <option value={1}>In Progress</option>
                <option value={2}>Completed</option>
                <option value={3}>Archived</option>
              </select>
            </div>
            
            <div className="form-actions">
              <button type="button" onClick={() => navigate(`/tasks/${id}`)} disabled={loading}>
                Cancel
              </button>
              <button type="submit" disabled={loading}>
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
              <button 
                type="button" 
                className="delete-button" 
                onClick={() => setShowDeleteModal(true)} 
                disabled={loading}
              >
                Delete Task
              </button>
            </div>
          </form>
        </>
      ) : (
        <>
          <div className="detail-header">
            <h2>{task.title}</h2>
            <div className="detail-actions">
              <button onClick={() => navigate(`/tasks/${id}/edit`)}>Edit</button>
              <button 
                className="delete-button" 
                onClick={() => setShowDeleteModal(true)}
              >
                Delete
              </button>
            </div>
          </div>
          
          <div className={`detail-priority priority-${task.priority}`}>
            {task.priority === 0 ? 'Low Priority' : 
             task.priority === 1 ? 'Medium Priority' : 'High Priority'}
          </div>
          
          <div className={`detail-status status-${task.status}`}>
            {task.status === 0 ? 'Pending' : 
             task.status === 1 ? 'In Progress' : 
             task.status === 2 ? 'Completed' : 'Archived'}
          </div>
          
          <div className="detail-due-date">
            Due: {new Date(task.dueDate).toLocaleDateString()}
          </div>
          
          <div className="detail-description">
            <h3>Description</h3>
            <p>{task.description || 'No description provided'}</p>
          </div>
          
          <button className="back-button" onClick={() => navigate('/')}>
            Back to Tasks
          </button>
        </>
      )}
      
      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>High Priority Confirmation</h3>
            <p>Are you sure you want to set this task to high priority?</p>
            <div className="modal-actions">
              <button onClick={handleModalCancel}>No, use medium priority</button>
              <button onClick={handleModalConfirm} className="btn-primary">
                Yes, use high priority
              </button>
            </div>
          </div>
        </div>
      )}
      
      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Delete Confirmation</h3>
            <p>Are you sure you want to delete this task? This action cannot be undone.</p>
            <div className="modal-actions">
              <button onClick={() => setShowDeleteModal(false)}>Cancel</button>
              <button onClick={handleDelete} className="delete-button">
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