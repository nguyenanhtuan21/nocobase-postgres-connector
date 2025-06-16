# Tech Context: PostgreSQL Connector Plugin

## Technology Stack

### Core Technologies

#### Backend (Server)
- **Node.js**: Runtime environment
- **TypeScript**: Type-safe JavaScript
- **NocoBase Server API**: Plugin framework và database abstraction
- **pg (node-postgres)**: PostgreSQL client library
- **mysql2**: MySQL client library
- **node-cron**: Cron job scheduler

#### Frontend (Client)
- **React 18**: UI framework
- **TypeScript**: Type-safe development
- **Ant Design**: UI component library
- **NocoBase Client API**: Plugin registration và UI components
- **@uiw/react-codemirror**: Code editor với SQL syntax highlighting

#### Database
- **NocoBase Database**: Plugin metadata storage
- **PostgreSQL**: External database support
- **MySQL**: External database support

### Package Dependencies

```json
{
  "dependencies": {
    "pg": "^8.11.3",
    "mysql2": "^3.6.5", 
    "node-cron": "^3.0.3",
    "@uiw/react-codemirror": "^4.21.21",
    "@codemirror/lang-sql": "^6.5.4"
  },
  "devDependencies": {
    "@types/pg": "^8.10.7",
    "@types/node-cron": "^3.0.11",
    "jest": "^29.7.0",
    "@testing-library/react": "^13.4.0"
  }
}
```

## Development Environment

### Prerequisites

1. **NocoBase Environment**
   ```bash
   # NocoBase development setup
   git clone https://github.com/nocobase/nocobase.git
   cd nocobase
   yarn install
   yarn build
   ```

2. **Database Instances**
   - PostgreSQL server (local or remote)
   - MySQL server (local or remote)
   - Test databases với sample data

3. **Development Tools**
   - Node.js 18+
   - Yarn package manager
   - TypeScript compiler
   - Code editor (VS Code recommended)

### Project Setup

```bash
# Create plugin trong NocoBase workspace
cd packages/plugins
yarn pm create @my-project/plugin-postgres-connector

# Install dependencies
cd plugin-postgres-connector
yarn install

# Enable plugin trong development
yarn pm enable @my-project/plugin-postgres-connector

# Start development server
yarn dev
```

### Development Workflow

1. **Code Structure**
   ```
   plugin-postgres-connector/
   ├── src/
   │   ├── client/          # React components
   │   ├── server/          # Node.js services
   │   └── shared/          # Common types
   ├── __tests__/           # Test files
   ├── client.js            # Client entry
   ├── server.js            # Server entry
   └── package.json
   ```

2. **Build Process**
   ```bash
   # Development build (with watch)
   yarn build --watch
   
   # Production build
   yarn build
   
   # Type checking
   yarn tsc --noEmit
   ```

## Database Client Configuration

### PostgreSQL Configuration

```typescript
interface PostgresConfig {
  host: string
  port: number
  database: string
  user: string
  password: string
  ssl?: boolean | { rejectUnauthorized: boolean }
  connectionTimeoutMillis?: number
  idleTimeoutMillis?: number
  max?: number  // connection pool size
}

// Example usage
const pgClient = new Client({
  host: 'localhost',
  port: 5432,
  database: 'testdb',
  user: 'postgres',
  password: 'password',
  ssl: false
})
```

### MySQL Configuration

```typescript
interface MySQLConfig {
  host: string
  port: number
  database: string
  user: string
  password: string
  ssl?: boolean
  acquireTimeout?: number
  timeout?: number
  connectionLimit?: number
}

// Example usage
const mysqlConnection = await mysql.createConnection({
  host: 'localhost',
  port: 3306,
  database: 'testdb',
  user: 'root',
  password: 'password'
})
```

## NocoBase Integration

### Plugin Registration

```typescript
// server.js
const { Plugin } = require('@nocobase/server')
const PostgresConnectorPlugin = require('./lib/server').default

module.exports = PostgresConnectorPlugin

// client.js  
const { Plugin } = require('@nocobase/client')
const PostgresConnectorClient = require('./lib/client').default

module.exports = PostgresConnectorClient
```

### Collections Definition

```typescript
// Server-side collection registration
export default defineCollection({
  name: 'postgresConnector:dataSources',
  fields: [
    { type: 'string', name: 'title', required: true },
    { type: 'string', name: 'type', defaultValue: 'postgres' },
    { type: 'string', name: 'host', required: true },
    { type: 'integer', name: 'port', defaultValue: 5432 },
    { type: 'string', name: 'database', required: true },
    { type: 'string', name: 'username', required: true },
    { type: 'password', name: 'password', required: true }
  ]
})
```

### API Endpoints

```typescript
// Register resource actions
this.app.resourcer.define({
  name: 'postgresConnector:execute',
  actions: {
    async execute(ctx, next) {
      const { dataSourceId, sql, params } = ctx.action.params
      // Implementation
    },
    
    async testConnection(ctx, next) {
      const { config } = ctx.action.params
      // Implementation
    }
  }
})
```

## Development Patterns

### Error Handling

```typescript
// Custom error classes
export class DatabaseConnectionError extends Error {
  constructor(message: string, public readonly config: DatabaseConfig) {
    super(message)
    this.name = 'DatabaseConnectionError'
  }
}

export class SQLExecutionError extends Error {
  constructor(message: string, public readonly sql: string) {
    super(message)
    this.name = 'SQLExecutionError'
  }
}
```

### Logging

```typescript
// Use NocoBase logger
export class DatabaseService {
  private logger = this.app.logger.child({ service: 'DatabaseService' })
  
  async connect(config: DatabaseConfig) {
    this.logger.info('Attempting database connection', { 
      host: config.host, 
      database: config.database 
    })
    
    try {
      const client = await this.createConnection(config)
      this.logger.info('Database connection successful')
      return client
    } catch (error) {
      this.logger.error('Database connection failed', { error: error.message })
      throw error
    }
  }
}
```

### Configuration Management

```typescript
// Environment-based configuration
const config = {
  database: {
    connectionTimeout: process.env.DB_CONNECTION_TIMEOUT || 5000,
    maxConnections: process.env.DB_MAX_CONNECTIONS || 10
  },
  security: {
    encryptionKey: process.env.ENCRYPTION_KEY || 'default-key',
    allowedCommands: ['SELECT', 'SHOW', 'DESCRIBE']
  }
}
```

## Testing Strategy

### Unit Testing

```typescript
// Jest configuration
const config = {
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testMatch: ['**/__tests__/**/*.test.ts']
}

// Example test
describe('DatabaseService', () => {
  let service: DatabaseService
  let mockApp: MockApplication
  
  beforeEach(() => {
    mockApp = createMockApp()
    service = new DatabaseService(mockApp)
  })
  
  it('should connect to PostgreSQL', async () => {
    const config = createTestConfig('postgres')
    const client = await service.connect(config)
    expect(client).toBeDefined()
  })
})
```

### Integration Testing

```typescript
// Test with real database connections
describe('SQL Execution Integration', () => {
  let testDb: TestDatabase
  
  beforeAll(async () => {
    testDb = await setupTestDatabase()
  })
  
  afterAll(async () => {
    await teardownTestDatabase(testDb)
  })
  
  it('should execute SELECT query', async () => {
    const sql = 'SELECT * FROM users LIMIT 1'
    const result = await executor.execute(testDb.id, sql)
    expect(result).toHaveLength(1)
  })
})
```

## Security Considerations

### Password Encryption

```typescript
import crypto from 'crypto'

const algorithm = 'aes-256-gcm'
const secretKey = process.env.ENCRYPTION_KEY

export const encrypt = (text: string): string => {
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipher(algorithm, secretKey)
  const encrypted = Buffer.concat([cipher.update(text), cipher.final()])
  return iv.toString('hex') + ':' + encrypted.toString('hex')
}

export const decrypt = (hash: string): string => {
  const [ivHex, encryptedHex] = hash.split(':')
  const iv = Buffer.from(ivHex, 'hex')
  const encrypted = Buffer.from(encryptedHex, 'hex')
  const decipher = crypto.createDecipher(algorithm, secretKey)
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString()
}
```

### SQL Validation

```typescript
// Basic SQL sanitization
const sanitizeSQL = (sql: string): string => {
  // Remove comments
  sql = sql.replace(/--.*$/gm, '')
  sql = sql.replace(/\/\*[\s\S]*?\*\//g, '')
  
  // Basic validation
  const dangerousPatterns = [
    /\b(DROP|DELETE|UPDATE|INSERT|ALTER|CREATE|TRUNCATE)\b/i
  ]
  
  for (const pattern of dangerousPatterns) {
    if (pattern.test(sql)) {
      throw new Error('Potentially dangerous SQL command detected')
    }
  }
  
  return sql.trim()
}
```

## Performance Optimization

### Connection Pooling (Future)

```typescript
import { Pool } from 'pg'

class ConnectionPoolManager {
  private pools = new Map<string, Pool>()
  
  getPool(config: DatabaseConfig): Pool {
    const key = `${config.host}:${config.port}:${config.database}`
    
    if (!this.pools.has(key)) {
      const pool = new Pool({
        ...config,
        max: 10, // maximum number of clients
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000
      })
      
      this.pools.set(key, pool)
    }
    
    return this.pools.get(key)!
  }
}
```

### Query Caching (Future)

```typescript
import LRU from 'lru-cache'

const queryCache = new LRU<string, any>({
  max: 500,
  ttl: 1000 * 60 * 5  // 5 minutes
})

const getCacheKey = (dataSourceId: string, sql: string): string => {
  return `${dataSourceId}:${crypto.createHash('md5').update(sql).digest('hex')}`
}
```

## Deployment Considerations

### Production Build

```bash
# Build for production
yarn build

# Package plugin
yarn pack

# Install in production NocoBase
yarn pm add @my-project/plugin-postgres-connector
yarn pm enable @my-project/plugin-postgres-connector
```

### Environment Variables

```bash
# Production environment
DB_CONNECTION_TIMEOUT=10000
DB_MAX_CONNECTIONS=20
ENCRYPTION_KEY=your-secure-key-here
LOG_LEVEL=info
```

### Monitoring

```typescript
// Health check endpoint
this.app.resourcer.define({
  name: 'postgresConnector:health',
  actions: {
    async check(ctx, next) {
      const healthStatus = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        connections: await this.getConnectionStatus()
      }
      
      ctx.body = healthStatus
    }
  }
})
```

Tech stack này đảm bảo plugin có thể **scale**, **maintain** và **secure** trong môi trường production. 