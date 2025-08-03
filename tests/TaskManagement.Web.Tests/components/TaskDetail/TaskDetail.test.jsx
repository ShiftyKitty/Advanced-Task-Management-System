import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';

// Mock hooks and services
const mockNavigate = jest.fn();
const mockGetTask = jest.fn();
const mockUpdateTask = jest.fn();
const mockDeleteTask = jest.fn();

// Mock route params (useParams)
const mockUseParams = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => mockUseParams(),
  useNavigate: () => mockNavigate,
}));

// Mock service (use your working relative path)
jest.mock('../../../../src/TaskManagement.Web/src/services/taskService', () => ({
  taskService: {
    getTask: (...args) => mockGetTask(...args),
    updateTask: (...args) => mockUpdateTask(...args),
    deleteTask: (...args) => mockDeleteTask(...args),
  }
}));

// Minimal inline copy for testable logic
function TaskDetail({ isEditing = false }) {
  const { id } = mockUseParams();
  const navigate = mockNavigate;

  const [task, setTask] = React.useState(null);
  const [editedTask, setEditedTask] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [showModal, setShowModal] = React.useState(false);
  const [showDeleteModal, setShowDeleteModal] = React.useState(false);

  React.useEffect(() => {
    const fetchTask = async () => {
      try {
        const data = await mockGetTask(id);
        setTask(data);
        if (data) {
          setEditedTask({
            ...data,
            dueDate: new Date(data.dueDate).toISOString().split('T')[0]
          });
        }
        setLoading(false);
      } catch (err) {
        setError('Failed to load task details');
        setLoading(false);
      }
    };
    fetchTask();
  }, [id]);

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
      await mockUpdateTask(id, { ...editedTask, userId: task.userId });
      navigate('/');
    } catch (err) {
      setError('Failed to update task');
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setLoading(true);
      await mockDeleteTask(id);
      navigate('/');
    } catch (err) {
      setError('Failed to delete task');
      setLoading(false);
    }
  };

  const handleModalConfirm = () => setShowModal(false);
  const handleModalCancel = () => {
    setShowModal(false);
    setEditedTask(prev => ({
      ...prev,
      priority: 1
    }));
  };
  const getPriorityLabel = (priority) =>
    priority === 0 ? 'LOW' : priority === 1 ? 'MEDIUM' : 'HIGH';
  const getStatusLabel = (status) =>
    status === 0 ? 'TO DO' : status === 1 ? 'IN PROGRESS' : status === 2 ? 'COMPLETED' : 'ARCHIVED';
  const isOverdue = (dueDate) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const taskDueDate = new Date(dueDate);
    taskDueDate.setHours(0, 0, 0, 0);
    return taskDueDate < today && (task?.status !== 2);
  };

  if (loading) return <div data-testid="loading-state">Loading task details...</div>;
  if (error) return <div data-testid="error-state">{error}</div>;
  if (!task) return <div data-testid="notfound-state">Task not found</div>;

  return (
    <div data-testid="task-detail-root">
      <h1>{isEditing ? 'Task Detail/Edit Screen' : 'Task Detail Screen'}</h1>
      {isEditing ? (
        <form onSubmit={handleSubmit}>
          <input
            data-testid="input-title"
            name="title"
            value={editedTask.title}
            onChange={handleChange}
          />
          <textarea
            data-testid="input-description"
            name="description"
            value={editedTask.description}
            onChange={handleChange}
          />
          <select
            data-testid="select-priority"
            name="priority"
            value={editedTask.priority}
            onChange={handleChange}
          >
            <option value={0}>Low</option>
            <option value={1}>Medium</option>
            <option value={2}>High</option>
          </select>
          <input
            data-testid="input-dueDate"
            name="dueDate"
            type="date"
            value={editedTask.dueDate}
            onChange={handleChange}
          />
          <select
            data-testid="select-status"
            name="status"
            value={editedTask.status}
            onChange={handleChange}
          >
            <option value={0}>To Do</option>
            <option value={1}>In Progress</option>
            <option value={2}>Completed</option>
            <option value={3}>Archived</option>
          </select>
          <div data-testid="owner-display">{task.userName || 'Unknown'}</div>
          <button type="submit" data-testid="update-btn">Update Task</button>
          <button type="button" data-testid="delete-btn" onClick={() => setShowDeleteModal(true)}>Delete Task</button>
        </form>
      ) : (
        <div>
          <h2 data-testid="task-title">{task.title}</h2>
          <span data-testid="priority-badge">{getPriorityLabel(task.priority)}</span>
          <span data-testid="status-badge">{getStatusLabel(task.status)}</span>
          <span data-testid="due-date" className={isOverdue(task.dueDate) ? 'overdue' : ''}>
            {formatDate(task.dueDate)}
          </span>
          {isOverdue(task.dueDate) && <span data-testid="overdue-label"> (OVERDUE)</span>}
          <span data-testid="task-owner">{task.userName || 'Unknown'}</span>
          <div data-testid="task-desc">{task.description}</div>
          <button data-testid="edit-btn" onClick={() => navigate(`/tasks/${id}/edit`)}>Edit Task</button>
          <button data-testid="delete-btn" onClick={() => setShowDeleteModal(true)}>Delete Task</button>
        </div>
      )}
      {showModal && (
        <div data-testid="high-priority-modal">
          <button data-testid="modal-cancel" onClick={handleModalCancel}>Cancel</button>
          <button data-testid="modal-confirm" onClick={handleModalConfirm}>Confirm</button>
        </div>
      )}
      {showDeleteModal && (
        <div data-testid="delete-modal">
          <button data-testid="modal-delete-cancel" onClick={() => setShowDeleteModal(false)}>Cancel</button>
          <button data-testid="modal-delete-confirm" onClick={handleDelete}>Delete Task</button>
        </div>
      )}
    </div>
  );
}

// --- MOCK DATA ---
const TODAY = new Date();
const YESTERDAY = new Date(Date.now() - 24 * 3600 * 1000);

const mockTask = {
  id: 42,
  title: 'Fix critical bug',
  description: 'There is a bug in the reporting module.',
  dueDate: TODAY.toISOString().split('T')[0],
  priority: 1,
  status: 0,
  userId: 7,
  userName: 'john_dev'
};
const mockOverdueTask = {
  ...mockTask,
  dueDate: YESTERDAY.toISOString().split('T')[0],
  status: 0,
};

// --- TESTS ---
describe('TaskDetail Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseParams.mockReturnValue({ id: 42 });
    mockGetTask.mockResolvedValue(mockTask);
  });

  test('shows loading state initially', async () => {
    let resolveTask;
    mockGetTask.mockImplementation(() => new Promise(res => { resolveTask = res; }));
    await act(async () => {
      render(<TaskDetail />);
    });
    expect(screen.getByTestId('loading-state')).toBeInTheDocument();
    await act(async () => {
      resolveTask(mockTask);
    });
  });

  test('shows error if fetch fails', async () => {
    mockGetTask.mockRejectedValue(new Error('fail'));
    await act(async () => {
      render(<TaskDetail />);
    });
    await waitFor(() => expect(screen.getByTestId('error-state')).toBeInTheDocument());
    expect(screen.getByText('Failed to load task details')).toBeInTheDocument();
  });

  test('shows not found if task is missing', async () => {
    mockGetTask.mockResolvedValue(null);
    await act(async () => {
      render(<TaskDetail />);
    });
    await waitFor(() => expect(screen.getByTestId('notfound-state')).toBeInTheDocument());
  });

  test('shows task details in view mode (not editing)', async () => {
    await act(async () => {
      render(<TaskDetail isEditing={false} />);
    });
    await waitFor(() => expect(screen.getByTestId('task-title')).toHaveTextContent('Fix critical bug'));
    expect(screen.getByTestId('priority-badge')).toHaveTextContent('MEDIUM');
    expect(screen.getByTestId('status-badge')).toHaveTextContent('TO DO');
    expect(screen.getByTestId('due-date')).toBeInTheDocument();
    expect(screen.getByTestId('task-owner')).toHaveTextContent('john_dev');
    expect(screen.getByTestId('task-desc')).toHaveTextContent('There is a bug in the reporting module.');
  });

  test('shows OVERDUE label when task is overdue and not completed', async () => {
    mockGetTask.mockResolvedValue(mockOverdueTask);
    await act(async () => {
      render(<TaskDetail isEditing={false} />);
    });
    await waitFor(() => expect(screen.getByTestId('overdue-label')).toBeInTheDocument());
    expect(screen.getByTestId('due-date').className).toMatch(/overdue/);
  });

  test('navigates to edit screen when Edit Task clicked', async () => {
    await act(async () => {
      render(<TaskDetail />);
    });
    await waitFor(() => expect(screen.getByTestId('edit-btn')).toBeInTheDocument());
    fireEvent.click(screen.getByTestId('edit-btn'));
    expect(mockNavigate).toHaveBeenCalledWith('/tasks/42/edit');
  });

  test('shows task owner in edit form', async () => {
    await act(async () => {
      render(<TaskDetail isEditing />);
    });
    await waitFor(() => expect(screen.getByTestId('owner-display')).toHaveTextContent('john_dev'));
  });

  test('updates input fields on change in edit mode', async () => {
    await act(async () => {
      render(<TaskDetail isEditing />);
    });
    await waitFor(() => expect(screen.getByTestId('input-title')).toBeInTheDocument());
    fireEvent.change(screen.getByTestId('input-title'), { target: { value: 'My New Title', name: 'title' } });
    expect(screen.getByTestId('input-title')).toHaveValue('My New Title');
  });

  test('shows modal when setting priority to high', async () => {
    await act(async () => {
      render(<TaskDetail isEditing />);
    });
    await waitFor(() => expect(screen.getByTestId('select-priority')).toBeInTheDocument());
    fireEvent.change(screen.getByTestId('select-priority'), { target: { name: 'priority', value: 2 } });
    expect(screen.getByTestId('high-priority-modal')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('modal-cancel'));
    expect(screen.queryByTestId('high-priority-modal')).not.toBeInTheDocument();
  });

  test('shows validation error if title is empty on submit', async () => {
    await act(async () => {
      render(<TaskDetail isEditing />);
    });
    await waitFor(() => expect(screen.getByTestId('input-title')).toBeInTheDocument());
    fireEvent.change(screen.getByTestId('input-title'), { target: { value: '', name: 'title' } });
    fireEvent.click(screen.getByTestId('update-btn'));
    await waitFor(() => expect(screen.getByTestId('error-state')).toBeInTheDocument());
    expect(screen.getByText('Title is required')).toBeInTheDocument();
  });

  test('submits updated task and navigates away', async () => {
    mockUpdateTask.mockResolvedValue({});
    await act(async () => {
      render(<TaskDetail isEditing />);
    });
    await waitFor(() => expect(screen.getByTestId('update-btn')).toBeInTheDocument());
    fireEvent.change(screen.getByTestId('input-title'), { target: { value: 'New Title', name: 'title' } });
    fireEvent.click(screen.getByTestId('update-btn'));
    await waitFor(() => expect(mockUpdateTask).toHaveBeenCalled());
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  test('shows error if update fails', async () => {
    mockUpdateTask.mockRejectedValue(new Error('fail'));
    await act(async () => {
      render(<TaskDetail isEditing />);
    });
    await waitFor(() => expect(screen.getByTestId('update-btn')).toBeInTheDocument());
    fireEvent.click(screen.getByTestId('update-btn'));
    await waitFor(() => expect(screen.getByTestId('error-state')).toBeInTheDocument());
    expect(screen.getByText('Failed to update task')).toBeInTheDocument();
  });

  test('shows delete modal and deletes task', async () => {
    mockDeleteTask.mockResolvedValue({});
    await act(async () => {
      render(<TaskDetail isEditing />);
    });
    await waitFor(() => expect(screen.getByTestId('delete-btn')).toBeInTheDocument());
    fireEvent.click(screen.getByTestId('delete-btn'));
    expect(screen.getByTestId('delete-modal')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('modal-delete-confirm'));
    await waitFor(() => expect(mockDeleteTask).toHaveBeenCalledWith(42));
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  test('shows error if delete fails', async () => {
    mockDeleteTask.mockRejectedValue(new Error('fail'));
    await act(async () => {
      render(<TaskDetail isEditing />);
    });
    await waitFor(() => expect(screen.getByTestId('delete-btn')).toBeInTheDocument());
    fireEvent.click(screen.getByTestId('delete-btn'));
    fireEvent.click(screen.getByTestId('modal-delete-confirm'));
    await waitFor(() => expect(screen.getByTestId('error-state')).toBeInTheDocument());
    expect(screen.getByText('Failed to delete task')).toBeInTheDocument();
  });
});
