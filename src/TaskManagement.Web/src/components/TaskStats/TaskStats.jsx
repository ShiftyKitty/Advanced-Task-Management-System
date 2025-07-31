import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import './TaskStats.css';

const TaskStats = ({ tasks }) => {
  // Calculate priority distribution
  const priorityCounts = [
    { name: 'Low', value: 0, color: '#e0f7fa' },
    { name: 'Medium', value: 0, color: '#fff9c4' },
    { name: 'High', value: 0, color: '#ffebee' }
  ];
  
  // Calculate status distribution
  const statusCounts = [
    { name: 'Pending', value: 0, color: '#e8eaf6' },
    { name: 'In Progress', value: 0, color: '#e3f2fd' },
    { name: 'Completed', value: 0, color: '#e8f5e9' },
    { name: 'Archived', value: 0, color: '#eeeeee' }
  ];
  
  // Count tasks by priority and status
  tasks.forEach(task => {
    priorityCounts[task.priority].value++;
    statusCounts[task.status].value++;
  });
  
  // Filter out zero values for cleaner charts
  const priorityData = priorityCounts.filter(item => item.value > 0);
  const statusData = statusCounts.filter(item => item.value > 0);
  
  // Calculate overall progress
  const completedTasks = tasks.filter(task => task.status === 2).length;
  const progressPercentage = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;
  
  // Get upcoming deadlines (tasks due in the next 7 days)
  const today = new Date();
  const nextWeek = new Date();
  nextWeek.setDate(today.getDate() + 7);
  
  const upcomingDeadlines = tasks
    .filter(task => {
      const dueDate = new Date(task.dueDate);
      return dueDate >= today && dueDate <= nextWeek && task.status !== 2; // Not completed
    })
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
    .slice(0, 5); // Show top 5
  
  return (
    <div className="task-stats">
      <h2>Task Overview</h2>
      
      <div className="charts-container">
        <div className="chart">
          <h3>Task Priority Distribution</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={priorityData}
                cx="50%"
                cy="50%"
                outerRadius={60}
                dataKey="value"
                label={({ name, value }) => `${name}: ${value}`}
              >
                {priorityData.map((entry, index) => (
                  <Cell key={`priority-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Legend />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
        
        <div className="chart">
          <h3>Tasks by Status</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                outerRadius={60}
                dataKey="value"
                label={({ name, value }) => `${name}: ${value}`}
              >
                {statusData.map((entry, index) => (
                  <Cell key={`status-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Legend />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      <div className="progress-section">
        <h3>Overall Progress</h3>
        <div className="progress-bar-container">
          <div 
            className="progress-bar" 
            style={{ width: `${progressPercentage}%` }}
          >
            {progressPercentage}%
          </div>
        </div>
      </div>
      
      {upcomingDeadlines.length > 0 && (
        <div className="deadlines-section">
          <h3>Upcoming Deadlines</h3>
          <ul className="deadline-list">
            {upcomingDeadlines.map(task => (
              <li key={task.id} className={`priority-${task.priority}`}>
                <span className="task-title">{task.title}</span>
                <span className="due-date">
                  {new Date(task.dueDate).toLocaleDateString()}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default TaskStats;