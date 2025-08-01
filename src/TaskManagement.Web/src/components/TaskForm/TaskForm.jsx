// Updated TaskForm.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { taskService } from '../../services/taskService';
import './TaskForm.css';

const TaskForm = () => {
  const navigate = useNavigate();
  const [task, setTask] = useState({
    title: '',
    description: '',
    priority: 0, // Low by default
    dueDate: new Date().toISOString().split('T')[0], // Today by default
    status: 0 // To Do by default
  });
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;

    // If changing priority to high (2), show confirmation modal
    if (name === 'priority' && parseInt(value) === 2) {
      setShowModal(true);
    }

    setTask(prev => ({
      ...prev,
      [name]: name === 'priority' || name === 'status' ? parseInt(value) : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate form
    if (!task.title.trim()) {
      setError('Title is required');
      return;
    }

    try {
      setLoading(true);
      await taskService.createTask(task);
      navigate('/');
    } catch (err) {
      console.error('Failed to create task:', err);
      setError('Failed to create task. Please try again.');
    } finally {
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
    setTask(prev => ({
      ...prev,
      priority: 1
    }));
  };

  return (
    <div className="task-form-container">
      <h1 className="screen-title">Create Task Screen</h1>

      <div className="task-create-form">
        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
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
              className="btn-create"
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>

      {/* High Priority Confirmation Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>High Priority Confirmation</h3>
            <p>Are you sure you want to set this task to high priority?</p>
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
    </div>
  );
};

export default TaskForm;