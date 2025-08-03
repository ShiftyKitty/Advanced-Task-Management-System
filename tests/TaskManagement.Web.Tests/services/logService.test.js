import { logService } from '../../../src/TaskManagement.Web/src/services/logService.js';

// Setup fetch mock and localStorage
beforeEach(() => {
  global.fetch = jest.fn();
  localStorage.clear();
});

afterEach(() => {
  jest.resetAllMocks();
});

describe('logService', () => {
  describe('getLogs', () => {
    it('returns logs data on success (no filters)', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ([{ id: 1, msg: 'log 1' }]),
      });

      const result = await logService.getLogs();
      expect(result).toEqual([{ id: 1, msg: 'log 1' }]);
      expect(fetch).toHaveBeenCalledWith('/api/logs', expect.any(Object));
    });

    it('calls /highpriority endpoint when filter is high', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ([{ id: 2, msg: 'high' }]),
      });

      const result = await logService.getLogs({ priority: 'high' });
      expect(fetch).toHaveBeenCalledWith('/api/logs/highpriority', expect.any(Object));
      expect(result).toEqual([{ id: 2, msg: 'high' }]);
    });

    it('calls /daterange with dates when dateRange filter provided', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ([{ id: 3, msg: 'range' }]),
      });

      const filters = { dateRange: true, startDate: '2025-08-01', endDate: '2025-08-02' };
      const result = await logService.getLogs(filters);

      expect(fetch).toHaveBeenCalledWith(
        '/api/logs/daterange?start=2025-08-01&end=2025-08-02',
        expect.any(Object)
      );
      expect(result).toEqual([{ id: 3, msg: 'range' }]);
    });

    it('throws if fetch fails', async () => {
      // Silence expected console.error
      jest.spyOn(console, 'error').mockImplementation(() => {});
      fetch.mockResolvedValueOnce({
        ok: false,
        statusText: 'Not Found',
      });

      await expect(logService.getLogs()).rejects.toThrow('Failed to fetch logs: Not Found');
      console.error.mockRestore();
    });
  });

  describe('exportLogs', () => {
    // Setup DOM for download
    beforeEach(() => {
      document.body.innerHTML = '';
      // Mock URL.createObjectURL
      global.URL.createObjectURL = jest.fn(() => 'blob:url');
      global.URL.revokeObjectURL = jest.fn();
    });

    it('exports logs as CSV and triggers download', async () => {
      const mockBlob = new Blob(['id,msg\n1,log']);
      fetch.mockResolvedValueOnce({
        ok: true,
        blob: async () => mockBlob,
      });

      const clickSpy = jest.fn();
      // Mock appendChild and removeChild for <a>
      document.body.appendChild = jest.fn();
      document.body.removeChild = jest.fn();

      // Intercept document.createElement
      const origCreateElement = document.createElement;
      document.createElement = jest.fn(tag => {
        if (tag === 'a') {
          return { click: clickSpy, set href(h) {}, set download(d) {} };
        }
        return origCreateElement(tag);
      });

      const result = await logService.exportLogs();
      expect(fetch).toHaveBeenCalledWith('/api/logs/export', expect.any(Object));
      expect(clickSpy).toHaveBeenCalled();
      expect(global.URL.createObjectURL).toHaveBeenCalledWith(mockBlob);
      expect(result).toBe(true);

      // Restore
      document.createElement = origCreateElement;
    });

    it('throws if export fails', async () => {
      jest.spyOn(console, 'error').mockImplementation(() => {});
      fetch.mockResolvedValueOnce({
        ok: false,
        statusText: 'Internal Error',
      });
      await expect(logService.exportLogs()).rejects.toThrow('Failed to export logs: Internal Error');
      console.error.mockRestore();
    });
  });

  describe('Auth header', () => {
    it('includes auth header if user has token', async () => {
      localStorage.setItem('user', JSON.stringify({ token: 'ABC' }));
      fetch.mockResolvedValueOnce({ ok: true, json: async () => [] });
      await logService.getLogs();
      expect(fetch).toHaveBeenCalledWith(
        '/api/logs',
        expect.objectContaining({
          headers: expect.objectContaining({ Authorization: 'Bearer ABC' }),
        })
      );
    });
  });
});
