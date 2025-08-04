import { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { taskService } from '../../services/taskService';
import './TaskForm.css';

const TaskForm = () => {
  const navigate = useNavigate();
  
  // Initialize default date once to avoid recalculation
  const defaultDate = useMemo(() => 
    new Date().toISOString().split('T')[0], []
  );
  
  const [task, setTask] = useState({
    title: '',
    description: '',
    priority: 0,
    dueDate: defaultDate,
    status: 0
  });
  
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;

    // Prompt confirmation when setting high priority
    if (name === 'priority' && parseInt(value) === 2) {
      setShowModal(true);
    }

    setTask(prev => ({
      ...prev,
      [name]: name === 'priority' || name === 'status' ? parseInt(value) : value
    }));
  }, []);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();

    if (!task.title.trim()) {
      setError('Title is required');
      document.getElementById('title')?.focus();
      return;
    }

    try {
      setLoading(true);
      setError('');
      await taskService.createTask(task);
      navigate('/');
    } catch (err) {
      setError(`Failed to create task: ${err.message || 'Please try again'}`);
    } finally {
      setLoading(false);
    }
  }, [task, navigate]);

  const handleModalConfirm = useCallback(() => {
    setShowModal(false);
  }, []);

  const handleModalCancel = useCallback(() => {
    setShowModal(false);
    // Revert to medium priority
    setTask(prev => ({
      ...prev,
      priority: 1
    }));
  }, []);

  return (
    <div className="task-form-container">
      <h1 className="screen-title">Create Task Screen</h1>

      <div className="task-create-form">
        {error && (
          <div className="error-message" role="alert" aria-live="assertive">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label htmlFor="title">Title:</label>
            <input
              id="title"
              name="title"
              type="text"
              value={task.title}
              onChange={handleChange}
              required
              placeholder="Enter task title"
              aria-required="true"
              data-testid="task-title-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Description:</label>
            <textarea
              id="description"
              name="description"
              value={task.description}
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
                value={task.priority}
                onChange={handleChange}
                className={`priority-select priority-${task.priority}`}
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
                value={task.dueDate}
                onChange={handleChange}
                data-testid="task-duedate-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="status">Status:</label>
              <select
                id="status"
                name="status"
                value={task.status}
                onChange={handleChange}
                className={`status-select status-${task.status}`}
                data-testid="task-status-select"
              >
                <option value={0}>Pending</option>
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
              data-testid="cancel-button"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-create"
              disabled={loading}
              aria-busy={loading}
              data-testid="create-button"
            >
              {loading ? 'Creating...' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>

      {showModal && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal">
            <h3>High Priority Confirmation</h3>
            <p>Are you sure you want to set this task to high priority?</p>
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
    </div>
  );
};

export default TaskForm;