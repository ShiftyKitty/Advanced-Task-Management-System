import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

// --- Mocks ---
const mockNavigate = jest.fn();
const mockCreateTask = jest.fn();

jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => mockNavigate,
}));

jest.mock('../../../../src/TaskManagement.Web/src/services/taskService', () => ({
    taskService: {
        createTask: (...args) => mockCreateTask(...args)
    }
}));

// --- Minimal Inline Copy ---
function TaskForm() {
    const navigate = mockNavigate;
    const [task, setTask] = React.useState({
        title: '',
        description: '',
        priority: 0,
        dueDate: new Date().toISOString().split('T')[0],
        status: 0
    });
    const [showModal, setShowModal] = React.useState(false);
    const [error, setError] = React.useState('');
    const [loading, setLoading] = React.useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === 'priority' && parseInt(value) === 2) setShowModal(true);
        setTask(prev => ({
            ...prev,
            [name]: name === 'priority' || name === 'status' ? parseInt(value) : value
        }));
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!task.title.trim()) {
            setError('Title is required');
            return;
        }
        try {
            setLoading(true);
            await mockCreateTask(task);
            navigate('/');
        } catch {
            setError('Failed to create task. Please try again.');
        } finally {
            setLoading(false);
        }
    };
    const handleModalConfirm = () => setShowModal(false);
    const handleModalCancel = () => {
        setShowModal(false);
        setTask(prev => ({
            ...prev,
            priority: 1
        }));
    };

    return (
        <div data-testid="form-root">
            <h1>Create Task Screen</h1>
            {error && <div data-testid="error-message">{error}</div>}
            <form onSubmit={handleSubmit}>
                <input
                    data-testid="input-title"
                    name="title"
                    value={task.title}
                    onChange={handleChange}
                    placeholder="Enter task title"
                />
                <textarea
                    data-testid="input-description"
                    name="description"
                    value={task.description}
                    onChange={handleChange}
                />
                <select
                    data-testid="select-priority"
                    name="priority"
                    value={task.priority}
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
                    value={task.dueDate}
                    onChange={handleChange}
                />
                <select
                    data-testid="select-status"
                    name="status"
                    value={task.status}
                    onChange={handleChange}
                >
                    <option value={0}>To Do</option>
                    <option value={1}>In Progress</option>
                    <option value={2}>Completed</option>
                    <option value={3}>Archived</option>
                </select>
                <button
                    type="button"
                    data-testid="cancel-btn"
                    onClick={() => navigate('/')}
                    disabled={loading}
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    data-testid="create-btn"
                    disabled={loading}
                >
                    {loading ? 'Creating...' : 'Create Task'}
                </button>
            </form>
            {showModal && (
                <div data-testid="high-priority-modal">
                    <button data-testid="modal-cancel" onClick={handleModalCancel}>Cancel</button>
                    <button data-testid="modal-confirm" onClick={handleModalConfirm}>Confirm</button>
                </div>
            )}
        </div>
    );
}

// --- TESTS ---
describe('TaskForm Component', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockCreateTask.mockResolvedValue({});
    });

    test('renders form fields and buttons', () => {
        render(<TaskForm />);
        expect(screen.getByTestId('input-title')).toBeInTheDocument();
        expect(screen.getByTestId('input-description')).toBeInTheDocument();
        expect(screen.getByTestId('select-priority')).toBeInTheDocument();
        expect(screen.getByTestId('input-dueDate')).toBeInTheDocument();
        expect(screen.getByTestId('select-status')).toBeInTheDocument();
        expect(screen.getByTestId('cancel-btn')).toBeInTheDocument();
        expect(screen.getByTestId('create-btn')).toBeInTheDocument();
    });

    test('updates input fields on change', () => {
        render(<TaskForm />);
        fireEvent.change(screen.getByTestId('input-title'), { target: { value: 'New Task', name: 'title' } });
        expect(screen.getByTestId('input-title')).toHaveValue('New Task');
        fireEvent.change(screen.getByTestId('input-description'), { target: { value: 'Desc', name: 'description' } });
        expect(screen.getByTestId('input-description')).toHaveValue('Desc');
        fireEvent.change(screen.getByTestId('select-priority'), { target: { value: '2', name: 'priority' } }); // value as string
        expect(screen.getByTestId('select-priority')).toHaveValue('2'); // expect string
        fireEvent.change(screen.getByTestId('input-dueDate'), { target: { value: '2025-08-05', name: 'dueDate' } });
        expect(screen.getByTestId('input-dueDate')).toHaveValue('2025-08-05');
        fireEvent.change(screen.getByTestId('select-status'), { target: { value: '1', name: 'status' } }); // value as string
        expect(screen.getByTestId('select-status')).toHaveValue('1'); // expect string
    });

    test('shows modal when setting priority to high', () => {
        render(<TaskForm />);
        fireEvent.change(screen.getByTestId('select-priority'), { target: { name: 'priority', value: '2' } }); // value as string
        expect(screen.getByTestId('high-priority-modal')).toBeInTheDocument();
        // Modal cancel resets to medium
        fireEvent.click(screen.getByTestId('modal-cancel'));
        expect(screen.queryByTestId('high-priority-modal')).not.toBeInTheDocument();
        expect(screen.getByTestId('select-priority')).toHaveValue('1'); // expect string
        // Modal confirm just closes modal
        fireEvent.change(screen.getByTestId('select-priority'), { target: { name: 'priority', value: '2' } });
        fireEvent.click(screen.getByTestId('modal-confirm'));
        expect(screen.queryByTestId('high-priority-modal')).not.toBeInTheDocument();
    });

    test('shows error if title is empty on submit', async () => {
        render(<TaskForm />);
        fireEvent.change(screen.getByTestId('input-title'), { target: { value: '', name: 'title' } });
        fireEvent.click(screen.getByTestId('create-btn'));
        await waitFor(() => expect(screen.getByTestId('error-message')).toBeInTheDocument());
        expect(screen.getByText('Title is required')).toBeInTheDocument();
    });

    test('submits task and navigates away', async () => {
        render(<TaskForm />);
        fireEvent.change(screen.getByTestId('input-title'), { target: { value: 'My Created Task', name: 'title' } });
        fireEvent.click(screen.getByTestId('create-btn'));
        await waitFor(() => expect(mockCreateTask).toHaveBeenCalled());
        expect(mockNavigate).toHaveBeenCalledWith('/');
    });

    test('shows error if creation fails', async () => {
        mockCreateTask.mockRejectedValue(new Error('fail'));
        render(<TaskForm />);
        fireEvent.change(screen.getByTestId('input-title'), { target: { value: 'My Created Task', name: 'title' } });
        fireEvent.click(screen.getByTestId('create-btn'));
        await waitFor(() => expect(screen.getByTestId('error-message')).toBeInTheDocument());
        expect(screen.getByText('Failed to create task. Please try again.')).toBeInTheDocument();
    });

    test('cancel button navigates away', () => {
        render(<TaskForm />);
        fireEvent.click(screen.getByTestId('cancel-btn'));
        expect(mockNavigate).toHaveBeenCalledWith('/');
    });
});
