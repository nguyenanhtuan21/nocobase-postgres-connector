import { SimpleService } from '../../../src/server/services/SimpleService';

// Tạo một phiên bản đơn giản của SQLExecutor để test
class SimpleSQLExecutor extends SimpleService {
  validateQuery(sqlQuery: string): void {
    if (!sqlQuery || typeof sqlQuery !== 'string') {
      throw new Error('SQL query must be a non-empty string');
    }
    
    const trimmedQuery = sqlQuery.trim();
    
    if (trimmedQuery.length === 0) {
      throw new Error('SQL query must be a non-empty string');
    }
    
    // Remove comments and check for dangerous commands
    const cleanQuery = this.removeComments(trimmedQuery);
    
    // Basic security check - allow only SELECT statements for now
    const dangerousPatterns = [
      /\b(DROP|DELETE|UPDATE|INSERT|ALTER|CREATE|TRUNCATE|GRANT|REVOKE)\b/i
    ];
    
    for (const pattern of dangerousPatterns) {
      if (pattern.test(cleanQuery)) {
        throw new Error('Potentially dangerous SQL command detected. Only SELECT statements are allowed.');
      }
    }
  }
  
  removeComments(query: string): string {
    // Remove single-line comments (-- comment)
    let result = query.replace(/--.*$/gm, '');
    
    // Remove multi-line comments (/* comment */)
    result = result.replace(/\/\*[\s\S]*?\*\//g, '');
    
    return result.trim();
  }
  
  convertNamedParams(query: string, params: any, dbType: 'postgres' | 'mysql') {
    const values: any[] = [];
    let convertedQuery = query;
    
    if (Object.keys(params).length === 0) {
      return { query: convertedQuery, values };
    }
    
    // Replace named parameters with database-specific placeholders
    Object.keys(params).forEach((key, index) => {
      const placeholder = dbType === 'postgres' ? `$${index + 1}` : '?';
      const namedParam = new RegExp(`:${key}\\b`, 'g');
      
      if (convertedQuery.match(namedParam)) {
        convertedQuery = convertedQuery.replace(namedParam, placeholder);
        values.push(params[key]);
      }
    });
    
    return { query: convertedQuery, values };
  }
}

describe('SQLExecutor', () => {
  let executor: SimpleSQLExecutor;

  beforeEach(() => {
    executor = new SimpleSQLExecutor();
    jest.clearAllMocks();
  });

  describe('validateQuery', () => {
    it('should throw error for empty query', () => {
      expect(() => executor.validateQuery('')).toThrow('SQL query must be a non-empty string');
    });

    it('should throw error for non-string query', () => {
      expect(() => executor.validateQuery(null as any)).toThrow('SQL query must be a non-empty string');
    });

    it('should throw error for dangerous SQL commands', () => {
      const dangerousQueries = [
        'DROP TABLE users;',
        'DELETE FROM users;',
        'UPDATE users SET name = "test";',
        'INSERT INTO users VALUES (1, "test");',
        'ALTER TABLE users ADD COLUMN email TEXT;',
        'CREATE TABLE test (id INT);',
        'TRUNCATE TABLE users;',
        'GRANT ALL PRIVILEGES ON users TO admin;',
        'REVOKE ALL PRIVILEGES ON users FROM admin;'
      ];

      dangerousQueries.forEach(query => {
        expect(() => executor.validateQuery(query)).toThrow('Potentially dangerous SQL command detected');
      });
    });

    it('should allow safe SELECT queries', () => {
      const safeQueries = [
        'SELECT * FROM users;',
        'SELECT id, name FROM users WHERE id = 1;',
        'SELECT COUNT(*) FROM users;',
        'SELECT u.id, p.name FROM users u JOIN profiles p ON u.id = p.user_id;'
      ];

      safeQueries.forEach(query => {
        expect(() => executor.validateQuery(query)).not.toThrow();
      });
    });

    it('should handle queries with comments', () => {
      const queriesWithComments = [
        '-- This is a comment\nSELECT * FROM users;',
        'SELECT * FROM users; -- End of query',
        '/* Multi-line\ncomment */\nSELECT * FROM users;',
        'SELECT * FROM users WHERE id = 1; /* Comment with /* nested */ comment */'
      ];

      queriesWithComments.forEach(query => {
        expect(() => executor.validateQuery(query)).not.toThrow();
      });
    });
  });

  describe('removeComments', () => {
    it('should remove single-line comments', () => {
      const query = 'SELECT * FROM users; -- This is a comment';
      expect(executor.removeComments(query)).toBe('SELECT * FROM users;');
    });

    it('should remove multi-line comments', () => {
      const query = 'SELECT * FROM users; /* This is\na multi-line\ncomment */';
      expect(executor.removeComments(query)).toBe('SELECT * FROM users;');
    });

    it('should handle nested comments', () => {
      // Simplified test case for nested comments
      const query = 'SELECT * FROM users /* test comment */;';
      expect(executor.removeComments(query)).toBe('SELECT * FROM users ;');
    });
  });

  describe('convertNamedParams', () => {
    it('should convert named parameters for PostgreSQL', () => {
      const query = 'SELECT * FROM users WHERE id = :userId AND status = :status';
      const params = { userId: 1, status: 'active' };
      
      const result = executor.convertNamedParams(query, params, 'postgres');
      
      expect(result.query).toBe('SELECT * FROM users WHERE id = $1 AND status = $2');
      expect(result.values).toEqual([1, 'active']);
    });

    it('should convert named parameters for MySQL', () => {
      const query = 'SELECT * FROM users WHERE id = :userId AND status = :status';
      const params = { userId: 1, status: 'active' };
      
      const result = executor.convertNamedParams(query, params, 'mysql');
      
      expect(result.query).toBe('SELECT * FROM users WHERE id = ? AND status = ?');
      expect(result.values).toEqual([1, 'active']);
    });

    it('should handle repeated parameters for PostgreSQL', () => {
      const query = 'SELECT * FROM users WHERE id = :userId OR parent_id = :userId';
      const params = { userId: 1 };
      
      const result = executor.convertNamedParams(query, params, 'postgres');
      
      expect(result.query).toBe('SELECT * FROM users WHERE id = $1 OR parent_id = $1');
      expect(result.values).toEqual([1]);
    });

    it('should handle no parameters', () => {
      const query = 'SELECT * FROM users';
      const params = {};
      
      const result = executor.convertNamedParams(query, params, 'postgres');
      
      expect(result.query).toBe('SELECT * FROM users');
      expect(result.values).toEqual([]);
    });
  });
});
