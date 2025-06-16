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
import { DataSourcesController } from '../../../src/server/controllers/data-sources';

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

const mockNext = jest.fn();

describe('DataSourcesController', () => {
  let controller: DataSourcesController;
  let mockCtx: Context;

  beforeEach(() => {
    controller = new DataSourcesController(mockDatabase as any);
    mockCtx = {
      action: {
        params: {},
      },
      throw: jest.fn(),
      body: null,
      status: 200,
      app: {
        getService: jest.fn(),
      },
    };
    
    jest.clearAllMocks();
  });

  describe('list', () => {
    it('should list data sources with pagination and filtering', async () => {
      // Arrange
      const mockResults = {
        data: [
          { id: '1', title: 'Test DB', type: 'postgres' },
          { id: '2', title: 'Another DB', type: 'mysql' },
        ],
        meta: { page: 1, pageSize: 20, count: 2 },
      };
      
      mockRepository.find.mockResolvedValue(mockResults);
      mockCtx.action.params = { page: 2, pageSize: 10, filter: { type: 'postgres' } };
      
      // Act
      await controller.list(mockCtx as any, mockNext as any);
      
      // Assert
      expect(mockRepository.find).toHaveBeenCalledWith({
        filter: { type: 'postgres' },
        sort: undefined,
        page: 2,
        pageSize: 10,
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
    
    it('should throw error if data source is not found', async () => {
      // Arrange
      mockCtx.action.params = { filterByTk: '999' };
      mockRepository.findOne.mockResolvedValue(null);
      
      // Act
      await controller.get(mockCtx as any, mockNext as any);
      
      // Assert
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        filterByTk: '999',
      });
      expect(mockCtx.throw).toHaveBeenCalledWith(404, 'Data source not found');
      expect(mockNext).not.toHaveBeenCalled();
    });
    
    it('should return data source if found', async () => {
      // Arrange
      const mockDataSource = { id: '1', title: 'Test DB', type: 'postgres' };
      mockCtx.action.params = { filterByTk: '1' };
      mockRepository.findOne.mockResolvedValue(mockDataSource);
      
      // Act
      await controller.get(mockCtx as any, mockNext as any);
      
      // Assert
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        filterByTk: '1',
      });
      expect(mockCtx.body).toEqual(mockDataSource);
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
    
    it('should create a new data source', async () => {
      // Arrange
      const mockValues = { title: 'New DB', type: 'postgres' };
      const mockCreatedDataSource = { id: '3', ...mockValues };
      mockCtx.action.params = { values: mockValues };
      mockRepository.create.mockResolvedValue(mockCreatedDataSource);
      
      // Act
      await controller.create(mockCtx as any, mockNext as any);
      
      // Assert
      expect(mockRepository.create).toHaveBeenCalledWith({
        values: mockValues,
      });
      expect(mockCtx.body).toEqual(mockCreatedDataSource);
      expect(mockCtx.status).toBe(201);
      expect(mockNext).toHaveBeenCalled();
    });
    
    it('should handle errors during creation', async () => {
      // Arrange
      mockCtx.action.params = { values: {} };
      mockRepository.create.mockRejectedValue(new Error('Creation failed'));
      
      // Act
      await controller.create(mockCtx as any, mockNext as any);
      
      // Assert
      expect(mockCtx.throw).toHaveBeenCalledWith(400, 'Creation failed');
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  // Additional tests for update, destroy, and testConnection methods...
}); 