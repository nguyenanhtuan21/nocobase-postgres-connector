import { StandaloneDatabaseService, DatabaseConfig } from '../../../src/server/services/StandaloneDatabaseService';

describe('StandaloneDatabaseService', () => {
  let service: StandaloneDatabaseService;

  beforeEach(() => {
    service = new StandaloneDatabaseService();
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

    it('should pass validation for valid postgres config', () => {
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

    it('should pass validation for valid mysql config', () => {
      const validConfig: DatabaseConfig = {
        type: 'mysql',
        host: 'localhost',
        port: 3306,
        database: 'test',
        username: 'user',
        password: 'pass',
      };

      expect(() => service.validateConfig(validConfig)).not.toThrow();
    });
  });

  describe('connect', () => {
    it('should throw for unsupported database type', async () => {
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

    it('should throw for invalid config', async () => {
      const config = {
        type: 'postgres',
        // missing required fields
      } as DatabaseConfig;

      await expect(service.connect(config)).rejects.toThrow('Missing required field');
    });
  });
}); 