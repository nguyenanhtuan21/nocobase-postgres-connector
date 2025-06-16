// Mock Context and Next types
type Context = {
  action: {
    params: any;
  };
  throw: jest.Mock;
  body: any;
  status: number;
  app: {
    getService: jest.Mock;
  };
};

type Next = () => Promise<void>;

// Import the controller class directly
import { ScheduledQueriesController } from '../../../src/server/controllers/scheduled-queries';

// Mock database and context
const mockRepository = {
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  destroy: jest.fn(),
};

const mockDatabase = {
  getRepository: jest.fn(() => mockRepository),
};

const mockSQLExecutor = {
  validateQuery: jest.fn(),
  execute: jest.fn(),
};

const mockNext = jest.fn();

describe('ScheduledQueriesController', () => {
  let controller: ScheduledQueriesController;
  let mockCtx: Context;

  beforeEach(() => {
    controller = new ScheduledQueriesController(mockDatabase as any);
    mockCtx = {
      action: {
        params: {},
      },
      throw: jest.fn(),
      body: null,
      status: 200,
      app: {
        getService: jest.fn(() => mockSQLExecutor),
      },
    };
    
    jest.clearAllMocks();
  });

  describe('list', () => {
    it('should list scheduled queries with pagination and filtering', async () => {
      // Arrange
      const mockResults = {
        data: [
          { id: '1', title: 'Daily Report', dataSourceId: '1', sqlQuery: 'SELECT * FROM users' },
          { id: '2', title: 'Weekly Stats', dataSourceId: '2', sqlQuery: 'SELECT * FROM stats' },
        ],
        meta: { page: 1, pageSize: 20, count: 2 },
      };
      
      mockRepository.find.mockResolvedValue(mockResults);
      mockCtx.action.params = { page: 1, pageSize: 20 };
      
      // Act
      await controller.list(mockCtx as any, mockNext as any);
      
      // Assert
      expect(mockRepository.find).toHaveBeenCalledWith({
        filter: undefined,
        sort: undefined,
        page: 1,
        pageSize: 20,
        appends: ['dataSource'],
      });
      expect(mockCtx.body).toEqual(mockResults);
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('get', () => {
    it('should throw error if ID is not provided', async () => {
      // Arrange
      mockCtx.action.params = {};
      
      // Act
      await controller.get(mockCtx as any, mockNext as any);
      
      // Assert
      expect(mockCtx.throw).toHaveBeenCalledWith(400, 'ID is required');
      expect(mockRepository.findOne).not.toHaveBeenCalled();
      expect(mockNext).not.toHaveBeenCalled();
    });
    
    it('should throw error if scheduled query is not found', async () => {
      // Arrange
      mockCtx.action.params = { filterByTk: '999' };
      mockRepository.findOne.mockResolvedValue(null);
      
      // Act
      await controller.get(mockCtx as any, mockNext as any);
      
      // Assert
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        filterByTk: '999',
        appends: ['dataSource'],
      });
      expect(mockCtx.throw).toHaveBeenCalledWith(404, 'Scheduled query not found');
      expect(mockNext).not.toHaveBeenCalled();
    });
    
    it('should return scheduled query if found', async () => {
      // Arrange
      const mockScheduledQuery = { 
        id: '1', 
        title: 'Daily Report', 
        dataSourceId: '1', 
        sqlQuery: 'SELECT * FROM users',
        dataSource: { id: '1', title: 'Test DB' }
      };
      mockCtx.action.params = { filterByTk: '1' };
      mockRepository.findOne.mockResolvedValue(mockScheduledQuery);
      
      // Act
      await controller.get(mockCtx as any, mockNext as any);
      
      // Assert
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        filterByTk: '1',
        appends: ['dataSource'],
      });
      expect(mockCtx.body).toEqual(mockScheduledQuery);
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('create', () => {
    it('should throw error if values are not provided', async () => {
      // Arrange
      mockCtx.action.params = {};
      
      // Act
      await controller.create(mockCtx as any, mockNext as any);
      
      // Assert
      expect(mockCtx.throw).toHaveBeenCalledWith(400, 'Values are required');
      expect(mockRepository.create).not.toHaveBeenCalled();
      expect(mockNext).not.toHaveBeenCalled();
    });
    
    it('should throw error if dataSourceId is not provided', async () => {
      // Arrange
      mockCtx.action.params = { values: { title: 'Test Query' } };
      
      // Act
      await controller.create(mockCtx as any, mockNext as any);
      
      // Assert
      expect(mockCtx.throw).toHaveBeenCalledWith(400, 'Data source is required');
      expect(mockRepository.create).not.toHaveBeenCalled();
      expect(mockNext).not.toHaveBeenCalled();
    });
    
    it('should throw error if sqlQuery is not provided', async () => {
      // Arrange
      mockCtx.action.params = { values: { title: 'Test Query', dataSourceId: '1' } };
      
      // Act
      await controller.create(mockCtx as any, mockNext as any);
      
      // Assert
      expect(mockCtx.throw).toHaveBeenCalledWith(400, 'SQL query is required');
      expect(mockRepository.create).not.toHaveBeenCalled();
      expect(mockNext).not.toHaveBeenCalled();
    });
    
    it('should create a new scheduled query', async () => {
      // Arrange
      const mockValues = { 
        title: 'Daily Report', 
        dataSourceId: '1', 
        sqlQuery: 'SELECT * FROM users',
        cronExpression: '0 0 * * *',
        triggerType: 'schedule',
      };
      const mockCreatedQuery = { id: '3', ...mockValues };
      mockCtx.action.params = { values: mockValues };
      mockRepository.create.mockResolvedValue(mockCreatedQuery);
      
      // Act
      await controller.create(mockCtx as any, mockNext as any);
      
      // Assert
      expect(mockCtx.app.getService).toHaveBeenCalledWith('postgresConnector:sqlExecutor');
      expect(mockSQLExecutor.validateQuery).toHaveBeenCalledWith(mockValues.sqlQuery);
      expect(mockRepository.create).toHaveBeenCalledWith({
        values: mockValues,
      });
      expect(mockCtx.body).toEqual(mockCreatedQuery);
      expect(mockCtx.status).toBe(201);
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('execute', () => {
    it('should throw error if ID is not provided', async () => {
      // Arrange
      mockCtx.action.params = {};
      
      // Act
      await controller.execute(mockCtx as any, mockNext as any);
      
      // Assert
      expect(mockCtx.throw).toHaveBeenCalledWith(400, 'ID is required');
      expect(mockRepository.findOne).not.toHaveBeenCalled();
      expect(mockNext).not.toHaveBeenCalled();
    });
    
    it('should throw error if scheduled query is not found', async () => {
      // Arrange
      mockCtx.action.params = { filterByTk: '999' };
      mockRepository.findOne.mockResolvedValue(null);
      
      // Act
      await controller.execute(mockCtx as any, mockNext as any);
      
      // Assert
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        filterByTk: '999',
        appends: ['dataSource'],
      });
      expect(mockCtx.throw).toHaveBeenCalledWith(404, 'Scheduled query not found');
      expect(mockNext).not.toHaveBeenCalled();
    });
    
    it('should throw error if data source is not found', async () => {
      // Arrange
      const mockScheduledQuery = { 
        id: '1', 
        title: 'Daily Report', 
        dataSourceId: '1', 
        sqlQuery: 'SELECT * FROM users',
        // No dataSource property
      };
      mockCtx.action.params = { filterByTk: '1' };
      mockRepository.findOne.mockResolvedValue(mockScheduledQuery);
      
      // Act
      await controller.execute(mockCtx as any, mockNext as any);
      
      // Assert
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        filterByTk: '1',
        appends: ['dataSource'],
      });
      expect(mockCtx.throw).toHaveBeenCalledWith(400, 'Data source not found');
      expect(mockNext).not.toHaveBeenCalled();
    });
    
    it('should execute the query and update last execution time and result', async () => {
      // Arrange
      const mockScheduledQuery = { 
        id: '1', 
        title: 'Daily Report', 
        dataSourceId: '1', 
        sqlQuery: 'SELECT * FROM users',
        dataSource: { id: '1', title: 'Test DB' }
      };
      const mockQueryResult = {
        rows: [{ id: 1, name: 'John' }, { id: 2, name: 'Jane' }],
        rowCount: 2,
        executionTime: 42,
      };
      
      mockCtx.action.params = { filterByTk: '1', params: { limit: 10 } };
      mockRepository.findOne.mockResolvedValue(mockScheduledQuery);
      mockSQLExecutor.execute.mockResolvedValue(mockQueryResult);
      
      // Act
      await controller.execute(mockCtx as any, mockNext as any);
      
      // Assert
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        filterByTk: '1',
        appends: ['dataSource'],
      });
      expect(mockCtx.app.getService).toHaveBeenCalledWith('postgresConnector:sqlExecutor');
      expect(mockSQLExecutor.execute).toHaveBeenCalledWith(
        mockScheduledQuery.dataSource.id,
        mockScheduledQuery.sqlQuery,
        { limit: 10 }
      );
      expect(mockRepository.update).toHaveBeenCalledWith({
        filterByTk: '1',
        values: {
          lastExecutedAt: expect.any(Date),
          lastResult: mockQueryResult,
        },
      });
      expect(mockCtx.body).toEqual(mockQueryResult);
      expect(mockNext).toHaveBeenCalled();
    });
    
    it('should handle execution errors', async () => {
      // Arrange
      const mockScheduledQuery = { 
        id: '1', 
        title: 'Daily Report', 
        dataSourceId: '1', 
        sqlQuery: 'SELECT * FROM users',
        dataSource: { id: '1', title: 'Test DB' }
      };
      const mockError = new Error('Execution failed');
      
      mockCtx.action.params = { filterByTk: '1' };
      mockRepository.findOne.mockResolvedValue(mockScheduledQuery);
      mockSQLExecutor.execute.mockRejectedValue(mockError);
      
      // Act
      await controller.execute(mockCtx as any, mockNext as any);
      
      // Assert
      expect(mockRepository.findOne).toHaveBeenCalled();
      expect(mockSQLExecutor.execute).toHaveBeenCalled();
      expect(mockCtx.body).toEqual({
        error: 'Execution failed',
      });
      expect(mockCtx.status).toBe(400);
      expect(mockNext).toHaveBeenCalled();
    });
  });

  // Additional tests for update and destroy methods...
}); 