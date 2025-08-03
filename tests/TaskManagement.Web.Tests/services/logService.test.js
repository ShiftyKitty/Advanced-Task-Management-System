import { logService } from '../../../src/TaskManagement.Web/src/services/logService.js';

describe('logService', () => {
  // Set up global mocks before each test
  beforeEach(() => {
    global.fetch = jest.fn();
    localStorage.clear();
  });

  // Clean up after each test
  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('getLogs', () => {
    it('returns logs data on success (no filters)', async () => {
      // Arrange
      const mockLogs = [{ id: 1, msg: 'log 1' }];
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockLogs,
      });

      // Act
      const result = await logService.getLogs();
      
      // Assert
      expect(result).toEqual(mockLogs);
      expect(fetch).toHaveBeenCalledWith('/api/logs', expect.any(Object));
    });

    it('calls /highpriority endpoint when filter is high', async () => {
      // Arrange
      const mockLogs = [{ id: 2, msg: 'high' }];
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockLogs,
      });

      // Act
      const result = await logService.getLogs({ priority: 'high' });
      
      // Assert
      expect(fetch).toHaveBeenCalledWith('/api/logs/highpriority', expect.any(Object));
      expect(result).toEqual(mockLogs);
    });

    it('calls /daterange with dates when dateRange filter provided', async () => {
      // Arrange
      const mockLogs = [{ id: 3, msg: 'range' }];
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockLogs,
      });

      const filters = { 
        dateRange: true, 
        startDate: '2025-08-01', 
        endDate: '2025-08-02' 
      };
      
      // Act
      const result = await logService.getLogs(filters);

      // Assert
      expect(fetch).toHaveBeenCalledWith(
        '/api/logs/daterange?start=2025-08-01&end=2025-08-02',
        expect.any(Object)
      );
      expect(result).toEqual(mockLogs);
    });

    it('throws if fetch fails', async () => {
      // Arrange - Silence expected console.error
      jest.spyOn(console, 'error').mockImplementation(() => {});
      fetch.mockResolvedValueOnce({
        ok: false,
        statusText: 'Not Found',
      });

      // Act & Assert
      await expect(logService.getLogs()).rejects.toThrow('Failed to fetch logs: Not Found');
      
      // Cleanup
      console.error.mockRestore();
    });
  });

  describe('exportLogs', () => {
    // Setup DOM environment for file download testing
    beforeEach(() => {
      document.body.innerHTML = '';
      global.URL.createObjectURL = jest.fn(() => 'blob:url');
      global.URL.revokeObjectURL = jest.fn();
    });

    it('exports logs as CSV and triggers download', async () => {
      // Arrange
      const mockBlob = new Blob(['id,msg\n1,log']);
      fetch.mockResolvedValueOnce({
        ok: true,
        blob: async () => mockBlob,
      });

      const clickSpy = jest.fn();
      
      // Mock DOM manipulation for download
      document.body.appendChild = jest.fn();
      document.body.removeChild = jest.fn();

      // Save original createElement to restore later
      const origCreateElement = document.createElement;
      document.createElement = jest.fn(tag => {
        if (tag === 'a') {
          // Mock anchor element with needed properties
          return { click: clickSpy, set href(h) {}, set download(d) {} };
        }
        return origCreateElement(tag);
      });

      // Act
      const result = await logService.exportLogs();
      
      // Assert
      expect(fetch).toHaveBeenCalledWith('/api/logs/export', expect.any(Object));
      expect(clickSpy).toHaveBeenCalled();
      expect(global.URL.createObjectURL).toHaveBeenCalledWith(mockBlob);
      expect(result).toBe(true);

      // Restore original function
      document.createElement = origCreateElement;
    });

    it('throws if export fails', async () => {
      // Arrange
      jest.spyOn(console, 'error').mockImplementation(() => {});
      fetch.mockResolvedValueOnce({
        ok: false,
        statusText: 'Internal Error',
      });
      
      // Act & Assert
      await expect(logService.exportLogs()).rejects.toThrow('Failed to export logs: Internal Error');
      
      // Cleanup
      console.error.mockRestore();
    });
  });

  describe('Auth header', () => {
    it('includes auth header if user has token', async () => {
      // Arrange - Set authenticated user in localStorage
      localStorage.setItem('user', JSON.stringify({ token: 'ABC' }));
      fetch.mockResolvedValueOnce({ 
        ok: true, 
        json: async () => [] 
      });
      
      // Act
      await logService.getLogs();
      
      // Assert - Verify Authorization header is correctly set
      expect(fetch).toHaveBeenCalledWith(
        '/api/logs',
        expect.objectContaining({
          headers: expect.objectContaining({ 
            Authorization: 'Bearer ABC' 
          }),
        })
      );
    });
  });
});