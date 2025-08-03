import React from 'react';
import { render, screen } from '@testing-library/react';

// Contract/mock TaskStats as a minimal pure functional component
const TaskStats = ({ tasks }) => {
  // Helper calculations for contract
  const priorities = [0, 1, 2];
  const statuses = [0, 1, 2, 3];
  const priorityCounts = priorities.map(
    p => tasks.filter(t => t.priority === p).length
  );
  const statusCounts = statuses.map(
    s => tasks.filter(t => t.status === s).length
  );
  const completed = statusCounts[2];
  const total = tasks.length;
  const percent = total ? Math.round((completed / total) * 100) : 0;
  const deadlines = tasks.filter(t => t.status !== 2);
  const deadlineTitles = deadlines.map(t => t.title).join(',');

  return (
    <div data-testid="task-stats">
      <div data-testid="priority-counts">{priorityCounts.join(',')}</div>
      <div data-testid="status-counts">{statusCounts.join(',')}</div>
      <div data-testid="progress-bar" style={{ width: `${percent}%` }}>{percent}%</div>
      <div data-testid="completed">{completed}</div>
      <div data-testid="total">{total}</div>
      <div data-testid="deadlines">{deadlineTitles}</div>
    </div>
  );
};

const tasksSample = [
  { id: 1, title: 'T1', priority: 0, status: 0, dueDate: '2025-08-04', userName: 'A' },
  { id: 2, title: 'T2', priority: 1, status: 1, dueDate: '2025-08-05', userName: 'B' },
  { id: 3, title: 'T3', priority: 2, status: 2, dueDate: '2025-08-06', userName: 'C' },
  { id: 4, title: 'T4', priority: 2, status: 0, dueDate: '2025-08-07', userName: 'D' },
  { id: 5, title: 'T5', priority: 1, status: 3, dueDate: '2025-08-08', userName: 'E' }
];

describe('TaskStats contract test', () => {
  it('renders correct priority and status counts', () => {
    render(<TaskStats tasks={tasksSample} />);
    expect(screen.getByTestId('priority-counts')).toHaveTextContent('1,2,2'); // 1 Low, 2 Med, 2 High
    expect(screen.getByTestId('status-counts')).toHaveTextContent('2,1,1,1'); // 2 ToDo, 1 InProg, 1 Done, 1 Archived
  });

  it('renders progress bar with correct width', () => {
    render(<TaskStats tasks={tasksSample} />);
    expect(screen.getByTestId('progress-bar')).toHaveTextContent('20%');
    expect(screen.getByTestId('progress-bar').style.width).toBe('20%');
  });

  it('renders correct completed and total counts', () => {
    render(<TaskStats tasks={tasksSample} />);
    expect(screen.getByTestId('completed')).toHaveTextContent('1');
    expect(screen.getByTestId('total')).toHaveTextContent('5');
  });

  it('shows deadlines for all except completed', () => {
    render(<TaskStats tasks={tasksSample} />);
    expect(screen.getByTestId('deadlines')).toHaveTextContent('T1,T2,T4,T5');
  });

  it('shows 0s if given no tasks', () => {
    render(<TaskStats tasks={[]} />);
    expect(screen.getByTestId('priority-counts')).toHaveTextContent('0,0,0');
    expect(screen.getByTestId('status-counts')).toHaveTextContent('0,0,0,0');
    expect(screen.getByTestId('progress-bar')).toHaveTextContent('0%');
    expect(screen.getByTestId('completed')).toHaveTextContent('0');
    expect(screen.getByTestId('total')).toHaveTextContent('0');
    expect(screen.getByTestId('deadlines')).toHaveTextContent('');
  });
});
