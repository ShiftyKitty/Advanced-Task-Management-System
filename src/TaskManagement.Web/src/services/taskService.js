const API_URL = 'http://localhost:5271/api';

// Get auth headers from stored credentials
const getAuthHeader = () => {
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user?.token ? { 'Authorization': `Bearer ${user.token}` } : {};
  } catch (error) {
    console.error('Auth token retrieval failed:', error);
    return {};
  }
};

export const taskService = {
  // Get all tasks
  async getTasks() {
    const response = await fetch(`${API_URL}/tasks`, {
      headers: getAuthHeader()
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch tasks');
    }
    
    return await response.json();
  },

  // Get a single task by ID
  async getTask(id) {
    const response = await fetch(`${API_URL}/tasks/${id}`, {
      headers: getAuthHeader()
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch task with ID ${id}`);
    }
    
    return await response.json();
  },

  // Create a new task
  async createTask(task) {
    const response = await fetch(`${API_URL}/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify(task)
    });
    
    if (!response.ok) {
      throw new Error('Failed to create task');
    }
    
    return await response.json();
  },

  // Update an existing task
  async updateTask(id, task) {
    const response = await fetch(`${API_URL}/tasks/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify(task)
    });
    
    if (!response.ok) {
      throw new Error(`Failed to update task with ID ${id}`);
    }
    
    return true;
  },

  // Delete a task
  async deleteTask(id) {
    const response = await fetch(`${API_URL}/tasks/${id}`, {
      method: 'DELETE',
      headers: getAuthHeader()
    });
    
    if (!response.ok) {
      throw new Error(`Failed to delete task with ID ${id}`);
    }
    
    return true;
  }
};

/*
Design/Coding Choices:

1. Authentication:
   - Protected against token parsing errors
   - Simplified header retrieval with optional chaining

2. API Consistency:
   - Maintained consistent error handling across all methods
   - Preserved API contract for backward compatibility

3. Code Structure:
   - Grouped related functionality for better readability
   - Maintained clear method separation for maintainability

4. Error Handling:
   - Specific error messages for easier debugging
   - Consistent error object structure throughout
*/