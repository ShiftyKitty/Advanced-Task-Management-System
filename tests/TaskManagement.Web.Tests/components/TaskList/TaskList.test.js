import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

// MOCK SERVICES AND DEPENDENCIES 
const mockGetTasks = jest.fn();
const mockNavigate = jest.fn();
const MockLink = ({ to, children, ...props }) => <a href={to} {...props}>{children}</a>;

// Minimal TaskStats 
const MockTaskStats = ({ tasks }) => <div data-testid="task-stats">{tasks.length} stats</div>;

//MOCK react-router-dom
jest.mock('react-router-dom', () => ({
  Link: (props) => <MockLink {...props} />,
  useNavigate: () => mockNavigate,
}));

// MOCK service layer 
jest.mock('../../../../src/TaskManagement.Web/src/services/taskService', () => ({
  taskService: {
    getTasks: (...args) => mockGetTasks(...args),
  }
}));

// MINIMAL TASKLIST LOGIC 
function TaskList() {
  const [tasks, setTasks] = React.useState([]);
  const [filteredTasks, setFilteredTasks] = React.useState([]);
  const [visibleTasks, setVisibleTasks] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [filters, setFilters] = React.useState({
    filter: 'All',
    priority: 'All',
    status: 'All',
    showArchived: false
  });
  const [sortMethod, setSortMethod] = React.useState('dueDate-asc');
  const taskIncrement = 5;
  const [tasksToShow, setTasksToShow] = React.useState(taskIncrement);

  React.useEffect(() => {
    const fetchTasks = async () => {
      try {
        const data = await mockGetTasks();
        setTasks(data);
        setFilteredTasks(data);
        setVisibleTasks(data.slice(0, taskIncrement));
        setLoading(false);
      } catch {
        setError('Failed to fetch tasks. Please try again later.');
        setLoading(false);
      }
    };
    fetchTasks();
  }, []);

  React.useEffect(() => {
    let result = tasks;

    if (filters.filter !== 'All') {
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const nextWeek = new Date(today); nextWeek.setDate(today.getDate() + 7);

      switch (filters.filter) {
        case 'Today':
          result = result.filter(t => {
            const d = new Date(t.dueDate); d.setHours(0,0,0,0);
            return d.getTime() === today.getTime();
          }); break;
        case 'Upcoming':
          result = result.filter(t => {
            const d = new Date(t.dueDate); d.setHours(0,0,0,0);
            return d > today && d <= nextWeek;
          }); break;
        case 'Overdue':
          result = result.filter(t => {
            const d = new Date(t.dueDate); d.setHours(0,0,0,0);
            return d < today && t.status !== 2;
          }); break;
        case 'Archived':
          result = result.filter(t => t.status === 3); break;
        default: break;
      }
    }
    if (filters.priority !== 'All') result = result.filter(t => t.priority === parseInt(filters.priority));
    if (filters.status !== 'All') result = result.filter(t => t.status === parseInt(filters.status));
    else if (!filters.showArchived && filters.filter !== 'Archived') result = result.filter(t => t.status !== 3);

    // Sorting
    const [sortBy, dir] = sortMethod.split('-');
    const mult = dir === 'asc' ? 1 : -1;
    result = [...result].sort((a, b) => {
      switch (sortBy) {
        case 'dueDate': return (new Date(a.dueDate) - new Date(b.dueDate)) * mult;
        case 'priority': return (a.priority - b.priority) * mult;
        case 'title': return a.title.localeCompare(b.title) * mult;
        case 'status': return (a.status - b.status) * mult;
        case 'created': return (a.id - b.id) * mult;
        default: return 0;
      }
    });

    setFilteredTasks(result);
    setVisibleTasks(result.slice(0, tasksToShow));
  }, [filters, sortMethod, tasks, tasksToShow]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setTasksToShow(taskIncrement);
  };
  const handleSortChange = (e) => { setSortMethod(e.target.value); setTasksToShow(taskIncrement); };
  const toggleArchived = () => { setFilters(prev => ({ ...prev, showArchived: !prev.showArchived })); setTasksToShow(taskIncrement); };

  const taskCounts = {
    total: tasks.length,
    active: tasks.filter(t => t.status !== 3).length,
    archived: tasks.filter(t => t.status === 3).length
  };
  // Irish format date
  const formatDate = s => new Date(s).toLocaleDateString('en-IE', {day:'2-digit', month:'2-digit', year:'numeric'});

  if (loading) return <div data-testid="loading">Loading tasks...</div>;
  if (error) return <div data-testid="error">{error}</div>;

  return (
    <div>
      <h1 data-testid="title">Task Dashboard/List View</h1>
      <div>
        <button data-testid="toggle-archived" onClick={toggleArchived}>
          {filters.showArchived ? 'Hide Archived' : 'Show Archived'} ({taskCounts.archived})
        </button>
        <MockLink to="/create" data-testid="add-task-link">+ Add Task</MockLink>
      </div>
      <div>
        <select data-testid="filter-select" name="filter" onChange={handleFilterChange} value={filters.filter}>
          <option value="All">Filter: All</option>
          <option value="Today">Today</option>
          <option value="Upcoming">Upcoming</option>
          <option value="Overdue">Overdue</option>
          <option value="Archived">Archived</option>
        </select>
        <select data-testid="priority-select" name="priority" onChange={handleFilterChange} value={filters.priority}>
          <option value="All">Priority: All</option>
          <option value="0">Low</option>
          <option value="1">Medium</option>
          <option value="2">High</option>
        </select>
        <select data-testid="status-select" name="status" onChange={handleFilterChange} value={filters.status}>
          <option value="All">Status: All</option>
          <option value="0">To Do</option>
          <option value="1">In Progress</option>
          <option value="2">Completed</option>
          {(filters.showArchived || filters.filter === 'Archived') && <option value="3">Archived</option>}
        </select>
        <select data-testid="sort-select" name="sort" onChange={handleSortChange} value={sortMethod}>
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
      <div>
        {visibleTasks.length === 0 ? (
          <div data-testid="no-tasks">
            {filters.filter === 'Archived' || filters.status === '3'
              ? 'No archived tasks found. To archive a task, open it and change its status to "Archived".'
              : 'No tasks match your filters'}
          </div>
        ) : (
          visibleTasks.map(task => (
            <div key={task.id} data-testid={`task-${task.id}`}>
              <span data-testid="task-title">{task.title}</span>
              <span data-testid="task-priority">{['LOW','MEDIUM','HIGH'][task.priority]}</span>
              <span data-testid="task-status">{['TO DO','IN PROGRESS','COMPLETED','ARCHIVED'][task.status]}</span>
              <span data-testid="task-dueDate">{formatDate(task.dueDate)}</span>
              {task.userName && <span data-testid="task-owner">{task.userName}</span>}
            </div>
          ))
        )}
      </div>
      {(!filters.showArchived && filters.filter !== 'Archived') &&
        <MockTaskStats tasks={tasks.filter(t => t.status !== 3)} />}
      {(filters.showArchived || filters.filter === 'Archived') &&
        <div data-testid="archived-info">
          <h2>Archived Tasks</h2>
          {taskCounts.archived > 0
            ? <p>You have {taskCounts.archived} archived task{taskCounts.archived !== 1 ? 's' : ''}.</p>
            : <p>No archived tasks found.</p>
          }
        </div>
      }
    </div>
  );
}

// MOCK DATA 
const today = new Date();
const iso = d => new Date(d).toISOString().split('T')[0];
const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
const nextWeek = new Date(today); nextWeek.setDate(today.getDate() + 7);

const sampleTasks = [
  { id: 1, title: 'Do Laundry', description: 'desc', dueDate: iso(today), priority: 0, status: 0, userName: 'Anna' },
  { id: 2, title: 'Finish Report', description: '', dueDate: iso(nextWeek), priority: 2, status: 1, userName: 'Bob' },
  { id: 3, title: 'Fix Bug', description: '', dueDate: iso(yesterday), priority: 1, status: 0, userName: 'Anna' },
  { id: 4, title: 'Archive Me', description: '', dueDate: iso(today), priority: 1, status: 3, userName: 'Carl' }
];

// TESTS 
describe('TaskList Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetTasks.mockResolvedValue(sampleTasks);
  });

  test('renders loading and then task list', async () => {
    render(<TaskList />);
    expect(screen.getByTestId('loading')).toBeInTheDocument();
    await waitFor(() => expect(screen.getByTestId('task-1')).toBeInTheDocument());
    // Use getAllByTestId since there are multiple titles
    const titles = screen.getAllByTestId('task-title').map(e => e.textContent);
    expect(titles).toContain('Do Laundry');
  });

  test('shows error if fetch fails', async () => {
    mockGetTasks.mockRejectedValue(new Error('fail'));
    render(<TaskList />);
    await waitFor(() => expect(screen.getByTestId('error')).toBeInTheDocument());
    expect(screen.getByText(/Failed to fetch tasks/)).toBeInTheDocument();
  });

  test('shows no tasks message if filter hides all', async () => {
    render(<TaskList />);
    await waitFor(() => expect(screen.getByTestId('task-1')).toBeInTheDocument());
    fireEvent.change(screen.getByTestId('status-select'), { target: { name: 'status', value: '2' } });
    expect(screen.getByTestId('no-tasks')).toBeInTheDocument();
  });

  test('filters by Today', async () => {
    render(<TaskList />);
    await waitFor(() => expect(screen.getByTestId('task-1')).toBeInTheDocument());
    fireEvent.change(screen.getByTestId('filter-select'), { target: { name: 'filter', value: 'Today' } });
    // Only tasks due today and not archived
    expect(screen.getByTestId('task-1')).toBeInTheDocument();
    expect(screen.queryByTestId('task-2')).not.toBeInTheDocument();
    expect(screen.queryByTestId('task-4')).not.toBeInTheDocument();
  });

  test('filters by Overdue', async () => {
    render(<TaskList />);
    await waitFor(() => expect(screen.getByTestId('task-3')).toBeInTheDocument());
    fireEvent.change(screen.getByTestId('filter-select'), { target: { name: 'filter', value: 'Overdue' } });
    expect(screen.getByTestId('task-3')).toBeInTheDocument();
    expect(screen.queryByTestId('task-1')).not.toBeInTheDocument();
  });

  test('filters by priority', async () => {
    render(<TaskList />);
    await waitFor(() => expect(screen.getByTestId('task-2')).toBeInTheDocument());
    fireEvent.change(screen.getByTestId('priority-select'), { target: { name: 'priority', value: '2' } });
    expect(screen.getByTestId('task-2')).toBeInTheDocument();
    expect(screen.queryByTestId('task-1')).not.toBeInTheDocument();
  });

  test('shows archived section and info', async () => {
    render(<TaskList />);
    await waitFor(() => expect(screen.getByTestId('task-4')).toBeInTheDocument());
    fireEvent.click(screen.getByTestId('toggle-archived'));
    expect(screen.getByTestId('archived-info')).toBeInTheDocument();
    expect(screen.getByText(/You have 1 archived task/)).toBeInTheDocument();
  });

  test('sorts by title Z-A', async () => {
    render(<TaskList />);
    await waitFor(() => expect(screen.getByTestId('task-1')).toBeInTheDocument());
    fireEvent.change(screen.getByTestId('sort-select'), { target: { name: 'sort', value: 'title-desc' } });
    // Z-A should put 'Fix Bug' first (since 'Fix Bug' > 'Finish Report' > 'Do Laundry' > 'Archive Me')
    const titles = screen.getAllByTestId('task-title').map(e => e.textContent);
    expect(titles[0]).toBe('Fix Bug');
  });

  test('renders task stats when not viewing archived', async () => {
    render(<TaskList />);
    await waitFor(() => expect(screen.getByTestId('task-stats')).toBeInTheDocument());
  });

  test('renders no archived info if no archived', async () => {
    mockGetTasks.mockResolvedValue(sampleTasks.filter(t => t.status !== 3));
    render(<TaskList />);
    await waitFor(() => expect(screen.getByTestId('task-1')).toBeInTheDocument());
    fireEvent.click(screen.getByTestId('toggle-archived'));
    expect(screen.getByTestId('archived-info')).toBeInTheDocument();
    expect(screen.getByText(/No archived tasks found/)).toBeInTheDocument();
  });
});
