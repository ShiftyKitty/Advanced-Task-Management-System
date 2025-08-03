// services/taskService.test.js
import { taskService } from '../../../src/TaskManagement.Web/src/services/taskService.js';

const API_URL = 'http://localhost:5271/api';

describe('taskService', () => {
  let fetchSpy;

  beforeEach(() => {
    fetchSpy = jest.spyOn(global, 'fetch');
    localStorage.clear();
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  describe('getTasks', () => {
    it('returns tasks data on success', async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: async () => [{ id: 1, title: 'A' }],
      });
      const data = await taskService.getTasks();
      expect(fetchSpy).toHaveBeenCalledWith(`${API_URL}/tasks`, { headers: {} });
      expect(data).toEqual([{ id: 1, title: 'A' }]);
    });

    it('throws if response is not ok', async () => {
      fetchSpy.mockResolvedValueOnce({ ok: false });
      await expect(taskService.getTasks()).rejects.toThrow('Failed to fetch tasks');
    });
  });

  describe('getTask', () => {
    it('returns task data for valid ID', async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 5, title: 'T' }),
      });
      const data = await taskService.getTask(5);
      expect(fetchSpy).toHaveBeenCalledWith(`${API_URL}/tasks/5`, { headers: {} });
      expect(data).toEqual({ id: 5, title: 'T' });
    });

    it('throws if task not found', async () => {
      fetchSpy.mockResolvedValueOnce({ ok: false });
      await expect(taskService.getTask(123)).rejects.toThrow('Failed to fetch task with ID 123');
    });
  });

  describe('createTask', () => {
    it('posts data and returns created task', async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 2, title: 'Created' }),
      });
      const task = { title: 'Created' };
      const result = await taskService.createTask(task);
      expect(fetchSpy).toHaveBeenCalledWith(
        `${API_URL}/tasks`,
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
          body: JSON.stringify(task),
        })
      );
      expect(result).toEqual({ id: 2, title: 'Created' });
    });

    it('throws if creation fails', async () => {
      fetchSpy.mockResolvedValueOnce({ ok: false });
      await expect(taskService.createTask({ title: 'X' })).rejects.toThrow('Failed to create task');
    });
  });

  describe('updateTask', () => {
    it('puts data and returns true on success', async () => {
      fetchSpy.mockResolvedValueOnce({ ok: true });
      const updated = { title: 'Updated' };
      const result = await taskService.updateTask(5, updated);
      expect(fetchSpy).toHaveBeenCalledWith(
        `${API_URL}/tasks/5`,
        expect.objectContaining({
          method: 'PUT',
          headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
          body: JSON.stringify(updated),
        })
      );
      expect(result).toBe(true);
    });

    it('throws if update fails', async () => {
      fetchSpy.mockResolvedValueOnce({ ok: false });
      await expect(taskService.updateTask(8, { title: 'bad' }))
        .rejects.toThrow('Failed to update task with ID 8');
    });
  });

  describe('deleteTask', () => {
    it('deletes task and returns true on success', async () => {
      fetchSpy.mockResolvedValueOnce({ ok: true });
      const result = await taskService.deleteTask(12);
      expect(fetchSpy).toHaveBeenCalledWith(
        `${API_URL}/tasks/12`,
        expect.objectContaining({
          method: 'DELETE',
          headers: {},
        })
      );
      expect(result).toBe(true);
    });

    it('throws if delete fails', async () => {
      fetchSpy.mockResolvedValueOnce({ ok: false });
      await expect(taskService.deleteTask(99)).rejects.toThrow('Failed to delete task with ID 99');
    });
  });

  describe('Auth header', () => {
    it('adds auth header if token exists', async () => {
      localStorage.setItem('user', JSON.stringify({ token: 'abc123' }));
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });
      await taskService.getTasks();
      expect(fetchSpy).toHaveBeenCalledWith(
        `${API_URL}/tasks`,
        { headers: { Authorization: 'Bearer abc123' } }
      );
    });
  });
});
