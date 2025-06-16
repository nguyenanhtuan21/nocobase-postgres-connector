import { StandaloneDatabaseService as DatabaseService, DatabaseConfig } from '../../../src/server/services/StandaloneDatabaseService';

// Mock NocoBase app
const mockApp = {
  logger: {
    info: jest.fn(),
    error: jest.fn(),
  },
} as any;

describe('DatabaseService', () => {
  let service: DatabaseService;

  beforeEach(() => {
    service = new DatabaseService();
    jest.clearAllMocks();
  });

  describe('validateConfig', () => {
    it('should validate required fields', () => {
      const invalidConfig = {
        type: 'postgres',
        host: 'localhost',
        // missing required fields
      } as DatabaseConfig;

      expect(() => service.validateConfig(invalidConfig)).toThrow('Missing required field');
    });

    it('should validate database type', () => {
      const invalidConfig = {
        type: 'invalid' as any,
        host: 'localhost',
        port: 5432,
        database: 'test',
        username: 'user',
        password: 'pass',
      };

      expect(() => service.validateConfig(invalidConfig)).toThrow('Unsupported database type');
    });

    it('should validate port number', () => {
      const invalidConfig = {
        type: 'postgres',
        host: 'localhost',
        port: 99999,
        database: 'test',
        username: 'user',
        password: 'pass',
      } as DatabaseConfig;

      expect(() => service.validateConfig(invalidConfig)).toThrow('Invalid port number');
    });

    it('should pass validation for valid config', () => {
      const validConfig: DatabaseConfig = {
        type: 'postgres',
        host: 'localhost',
        port: 5432,
        database: 'test',
        username: 'user',
        password: 'pass',
      };

      expect(() => service.validateConfig(validConfig)).not.toThrow();
    });
  });

  describe('connect', () => {
    it('should throw for invalid configuration', async () => {
      const config = {
        type: 'unsupported' as any,
        host: 'localhost',
        port: 5432,
        database: 'test',
        username: 'user',
        password: 'pass',
      } as DatabaseConfig;

      await expect(service.connect(config)).rejects.toThrow('Unsupported database type');
    });
  });

  // Note: Integration tests with real databases would be in separate test files
  // and would require actual database instances to be available
}); 