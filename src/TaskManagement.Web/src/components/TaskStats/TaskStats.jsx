// Updated TaskStats.jsx with lazy loading for deadlines
import { useState, useEffect, useRef } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Link } from 'react-router-dom';
import './TaskStats.css';

const TaskStats = ({ tasks }) => {
  // Define colors to match wireframe
  const PRIORITY_COLORS = ['#4caf50', '#ffeb3b', '#f44336']; // Low, Medium, High
  const STATUS_COLORS = ['#90caf9', '#42a5f5', '#1e88e5', '#757575']; // To Do, In Progress, Completed, Archived
  
  // State for lazy loading deadlines
  const [displayedDeadlines, setDisplayedDeadlines] = useState([]);
  const [deadlineIncrement, setDeadlineIncrement] = useState(5);
  const [hasMoreDeadlines, setHasMoreDeadlines] = useState(false);
  
  const deadlinesContainerRef = useRef(null);
  
  // Irish date formatting (DD/MM/YYYY)
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };
  
  // Group tasks by priority
  const tasksByPriority = [
    { name: 'Low', value: 0, tasks: [] },
    { name: 'Medium', value: 0, tasks: [] },
    { name: 'High', value: 0, tasks: [] }
  ];
  
  // Group tasks by status
  const tasksByStatus = [
    { name: 'To Do', value: 0, tasks: [] },
    { name: 'In Progress', value: 0, tasks: [] },
    { name: 'Completed', value: 0, tasks: [] },
    { name: 'Archived', value: 0, tasks: [] }
  ];
  
  // Calculate and filter upcoming deadlines
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const threeDaysFromNow = new Date(today);
  threeDaysFromNow.setDate(today.getDate() + 3);
  
  const allUpcomingDeadlines = tasks
    .filter(task => task.status !== 2) // Not completed
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
  
  // Count tasks by priority and status and store the tasks in each group
  tasks.forEach(task => {
    tasksByPriority[task.priority].value++;
    tasksByPriority[task.priority].tasks.push(task);
    
    tasksByStatus[task.status].value++;
    tasksByStatus[task.status].tasks.push(task);
  });
  
  // Filter out zero values for cleaner charts
  const priorityData = tasksByPriority.filter(item => item.value > 0);
  const statusData = tasksByStatus.filter(item => item.value > 0);
  
  // Calculate overall progress
  const completedTasks = tasks.filter(task => task.status === 2).length;
  const progressPercentage = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;
  
  // Initialize displayed deadlines
  useEffect(() => {
    setDisplayedDeadlines(allUpcomingDeadlines.slice(0, deadlineIncrement));
    setHasMoreDeadlines(allUpcomingDeadlines.length > deadlineIncrement);
  }, [tasks, deadlineIncrement]);
  
  // Handle scroll for lazy loading deadlines
  const handleDeadlinesScroll = () => {
    if (!deadlinesContainerRef.current) return;
    
    const container = deadlinesContainerRef.current;
    const scrollPosition = container.scrollHeight - container.scrollTop - container.clientHeight;
    
    // Load more when scrolled to within 50px of the bottom
    if (scrollPosition < 50 && hasMoreDeadlines) {
      const nextBatch = deadlineIncrement + 5;
      setDeadlineIncrement(nextBatch);
      setDisplayedDeadlines(allUpcomingDeadlines.slice(0, nextBatch));
      setHasMoreDeadlines(allUpcomingDeadlines.length > nextBatch);
    }
  };
  
  // Calculate percentages for legend
  const totalTasks = tasks.length;
  const priorityPercentages = tasksByPriority.map(item => ({
    ...item,
    percentage: totalTasks > 0 ? Math.round((item.value / totalTasks) * 100) : 0
  }));
  
  // Custom label for pie chart center
  const renderCustomizedLabel = ({ cx, cy }) => {
    return (
      <text x={cx} y={cy} fill="#333" textAnchor="middle" dominantBaseline="central" fontWeight="bold">
        {totalTasks} Tasks
      </text>
    );
  };

  // Get priority label
  const getPriorityLabel = (priority) => {
    return priority === 0 ? 'LOW' : priority === 1 ? 'MEDIUM' : 'HIGH';
  };
  
  return (
    <div className="task-overview">
      <h2>Task Overview</h2>
      
      <div className="charts-container">
        <div className="chart">
          <h3>Task Priority Distribution</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={priorityData}
                cx="50%"
                cy="50%"
                outerRadius={100}
                dataKey="value"
                label={renderCustomizedLabel}
              >
                {priorityData.map((entry, index) => (
                  <Cell 
                    key={`priority-${index}`} 
                    fill={PRIORITY_COLORS[tasksByPriority.findIndex(item => item.name === entry.name)]} 
                  />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value, name) => [`${value} Tasks`, name]}
                contentStyle={{ borderRadius: '4px', border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="chart-legend">
            {priorityPercentages.map((item, index) => (
              item.value > 0 && (
                <div key={`legend-${index}`} className="legend-item">
                  <span className="legend-color" style={{ backgroundColor: PRIORITY_COLORS[index] }}></span>
                  <span>{item.name} ({item.percentage}%)</span>
                </div>
              )
            ))}
          </div>
        </div>
        
        <div className="chart">
          <h3>Tasks by Status</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                outerRadius={100}
                dataKey="value"
                label={renderCustomizedLabel}
              >
                {statusData.map((entry, index) => (
                  <Cell 
                    key={`status-${index}`} 
                    fill={STATUS_COLORS[tasksByStatus.findIndex(item => item.name === entry.name)]} 
                  />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value, name) => [`${value} Tasks`, name]}
                contentStyle={{ borderRadius: '4px', border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="chart-legend">
            {tasksByStatus.map((item, index) => (
              item.value > 0 && (
                <div key={`legend-${index}`} className="legend-item">
                  <span className="legend-color" style={{ backgroundColor: STATUS_COLORS[index] }}></span>
                  <span>{item.name} ({item.value})</span>
                </div>
              )
            ))}
          </div>
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
      
      <div className="deadlines-section">
        <div className="deadlines-header">
          <h3>Upcoming Deadlines</h3>
          <span className="deadlines-count">{allUpcomingDeadlines.length} tasks</span>
        </div>
        
        <div 
          className="deadline-cards-container" 
          onScroll={handleDeadlinesScroll}
          ref={deadlinesContainerRef}
        >
          <div className="deadline-cards">
            {displayedDeadlines.length > 0 ? (
              displayedDeadlines.map(task => {
                const dueDate = new Date(task.dueDate);
                const isToday = dueDate.toDateString() === today.toDateString();
                const isWithinThreeDays = dueDate <= threeDaysFromNow;
                
                return (
                  <div key={task.id} className="deadline-card">
                    <div className="deadline-card-content">
                      <div className="deadline-card-header">
                        <Link to={`/tasks/${task.id}`} className="task-link">{task.title}</Link>
                        <span className={`priority priority-${task.priority}`}>
                          {getPriorityLabel(task.priority)}
                        </span>
                      </div>
                      <span className={`deadline-date ${isToday ? 'today' : isWithinThreeDays ? 'soon' : ''}`}>
                        {isToday ? 'Today' : isWithinThreeDays ? 'In 3 days' : formatDate(task.dueDate)}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="no-deadlines">No upcoming deadlines</div>
            )}
            
            {hasMoreDeadlines && (
              <div className="loading-more">Loading more deadlines as you scroll...</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskStats;