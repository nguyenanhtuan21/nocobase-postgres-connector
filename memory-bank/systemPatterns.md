# System Patterns: PostgreSQL Connector Plugin

## Kiến trúc tổng thể

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    NocoBase Platform                        │
├─────────────────────────────────────────────────────────────┤
│  PostgreSQL Connector Plugin                               │
│  ┌─────────────────┐    ┌─────────────────────────────────┐ │
│  │   Client Side   │    │        Server Side              │ │
│  │   (React/TS)    │◄──►│       (Node.js/TS)             │ │
│  └─────────────────┘    └─────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────┐
│              External Databases                             │
│  ┌─────────────────┐              ┌─────────────────┐      │
│  │   PostgreSQL    │              │      MySQL      │      │
│  │   Database      │              │    Database     │      │
│  └─────────────────┘              └─────────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

### Plugin Structure Pattern

Plugin tuân theo **NocoBase Plugin Architecture** với separation of concerns:

```
/postgres-connector/
  ├── /src/
  │   ├── /client/           # Frontend React components
  │   ├── /server/           # Backend Node.js services
  │   └── /shared/           # Common types và constants
  ├── client.js              # Client entry point
  ├── server.js              # Server entry point
  └── package.json
```

## Core Design Patterns

### 1. Service Layer Pattern

**Tại sao**: Tách biệt business logic khỏi API controllers

```typescript
// DatabaseService: Quản lý connections
// SQLExecutor: Thực thi queries
// SchedulerService: Quản lý automated tasks

abstract class BaseService {
  constructor(protected app: Application) {}
}

class DatabaseService extends BaseService {
  async connect(config: DatabaseConfig): Promise<DatabaseClient>
  async disconnect(client: DatabaseClient): Promise<void>
  async testConnection(config: DatabaseConfig): Promise<boolean>
}
```

### 2. Factory Pattern

**Tại sao**: Hỗ trợ multiple database types (PostgreSQL, MySQL)

```typescript
interface DatabaseClient {
  query(sql: string, params?: any[]): Promise<QueryResult>
  disconnect(): Promise<void>
}

class DatabaseClientFactory {
  static create(config: DatabaseConfig): DatabaseClient {
    switch(config.type) {
      case 'postgres': return new PostgresClient(config)
      case 'mysql': return new MySQLClient(config)
      default: throw new Error(`Unsupported database: ${config.type}`)
    }
  }
}
```

### 3. Repository Pattern

**Tại sao**: Standardize data access layer

```typescript
// NocoBase Collections as repositories
const dataSourceRepo = app.db.getRepository('postgresConnector:dataSources')
const scheduledQueriesRepo = app.db.getRepository('postgresConnector:scheduledQueries')

// Standard CRUD operations
await dataSourceRepo.create({ values: dataSourceData })
await dataSourceRepo.findOne({ filter: { id: dataSourceId } })
```

### 4. Observer Pattern (Scheduler)

**Tại sao**: Automated task execution với loose coupling

```typescript
class SchedulerService {
  private jobs = new Map<string, CronJob>()
  
  scheduleQuery(query: ScheduledQuery) {
    const job = new CronJob(query.cronExpression, async () => {
      await this.executeScheduledQuery(query)
    })
    this.jobs.set(query.id, job)
  }
}
```

## Data Flow Patterns

### 1. Request-Response Flow

```
User Input → React Component → API Call → Server Controller → Service Layer → Database → Response
```

**Cụ thể cho SQL Execution**:
```
SQL Editor → SQLExecutor Component → /execute API → ExecuteController → SQLExecutor Service → External DB → Results Table
```

### 2. Configuration Flow

```
Config Form → Validation → Test Connection → Save to NocoBase DB → Available for Use
```

### 3. Scheduled Execution Flow

```
Cron Trigger → SchedulerService → SQLExecutor Service → External DB → Log Results → Update Status
```

## Database Design Patterns

### Collections Schema

**DataSources Collection**: Central registry của database connections
```typescript
{
  name: 'postgresConnector:dataSources',
  fields: [
    { type: 'string', name: 'title' },        // User-friendly name
    { type: 'string', name: 'type' },         // postgres/mysql
    { type: 'string', name: 'host' },         // Connection details
    { type: 'integer', name: 'port' },
    { type: 'string', name: 'database' },
    { type: 'string', name: 'username' },
    { type: 'password', name: 'password' },   // Encrypted storage
    { type: 'jsonb', name: 'options' },       // Additional config
    { type: 'boolean', name: 'enabled' }      // Enable/disable
  ]
}
```

**ScheduledQueries Collection**: Automated task definitions
```typescript
{
  name: 'postgresConnector:scheduledQueries',
  fields: [
    { type: 'belongsTo', name: 'dataSource' }, // Reference to DataSource
    { type: 'text', name: 'sqlQuery' },        // SQL command
    { type: 'string', name: 'cronExpression' }, // Schedule pattern
    { type: 'jsonb', name: 'lastResult' },     // Execution results
    { type: 'datetime', name: 'lastExecutedAt' }
  ]
}
```

## Security Patterns

### 1. Connection String Security

**Pattern**: Store encrypted credentials
```typescript
// Encrypt sensitive data before storage
const encryptedPassword = encrypt(password, secretKey)

// Decrypt when creating connections
const decryptedPassword = decrypt(storedPassword, secretKey)
```

### 2. SQL Injection Prevention

**Pattern**: Parameterized queries only
```typescript
// Always use parameterized queries
const result = await client.query(
  'SELECT * FROM users WHERE id = $1', 
  [userId]
)

// Validate SQL commands (basic validation)
const isSafeQuery = (sql: string) => {
  // Block dangerous keywords in basic mode
  const dangerousKeywords = ['DROP', 'DELETE', 'UPDATE', 'INSERT']
  // Implementation depends on security requirements
}
```

### 3. Access Control Pattern

**Pattern**: Role-based permissions
```typescript
// Plugin integrates with NocoBase permission system
const hasPermission = await ctx.app.acl.can({
  role: ctx.state.currentRole,
  resource: 'postgresConnector:execute',
  action: 'execute'
})
```

## Error Handling Patterns

### 1. Graceful Degradation

```typescript
class DatabaseService {
  async connect(config: DatabaseConfig): Promise<DatabaseClient> {
    try {
      return await this.createConnection(config)
    } catch (error) {
      // Log error với context
      this.logger.error('Database connection failed', { config, error })
      
      // Throw business-friendly error
      throw new DatabaseConnectionError(`Failed to connect to ${config.title}`)
    }
  }
}
```

### 2. Circuit Breaker Pattern

**Tương lai**: Prevent cascade failures
```typescript
class CircuitBreaker {
  private failures = 0
  private lastFailTime = 0
  private readonly threshold = 5
  private readonly timeout = 30000
  
  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.isOpen()) {
      throw new Error('Circuit breaker is open')
    }
    
    try {
      const result = await operation()
      this.onSuccess()
      return result
    } catch (error) {
      this.onFailure()
      throw error
    }
  }
}
```

## Performance Patterns

### 1. Connection Pooling

**Tương lai enhancement**: Reuse database connections
```typescript
class ConnectionPool {
  private pools = new Map<string, Pool>()
  
  getConnection(dataSourceId: string): Promise<PoolClient> {
    if (!this.pools.has(dataSourceId)) {
      this.pools.set(dataSourceId, this.createPool(dataSourceId))
    }
    return this.pools.get(dataSourceId).connect()
  }
}
```

### 2. Query Result Caching

**Tương lai**: Cache frequent queries
```typescript
const cacheKey = `query:${dataSourceId}:${hashSQL(sql)}`
const cached = await cache.get(cacheKey)
if (cached) return cached

const result = await this.executeQuery(sql)
await cache.set(cacheKey, result, { ttl: 300 }) // 5 minutes
```

## Component Patterns (React)

### 1. Compound Component Pattern

**SQL Editor + Results**: Tightly coupled components
```tsx
<SQLEditor dataSourceId={dataSourceId}>
  <SQLEditor.Editor onExecute={handleExecute} />
  <SQLEditor.Results data={results} loading={loading} />
</SQLEditor>
```

### 2. Render Props Pattern

**Flexible data rendering**:
```tsx
<DataSourceSelector>
  {({ dataSources, selectedId, onSelect }) => (
    <Select value={selectedId} onChange={onSelect}>
      {dataSources.map(ds => (
        <Option key={ds.id} value={ds.id}>{ds.title}</Option>
      ))}
    </Select>
  )}
</DataSourceSelector>
```

### 3. Hook Pattern

**Reusable stateful logic**:
```tsx
const useDataSources = () => {
  const [dataSources, setDataSources] = useState([])
  const [loading, setLoading] = useState(false)
  
  const fetchDataSources = useCallback(async () => {
    // Implementation
  }, [])
  
  return { dataSources, loading, fetchDataSources }
}
```

## Integration Patterns

### 1. Plugin Registration Pattern

```typescript
// Client-side registration
export class PostgresConnectorClient extends Plugin {
  async load() {
    // Register settings page
    this.app.pluginSettingsManager.add('postgres-connector', {
      title: 'PostgreSQL Connector',
      Component: SettingsPage
    })
    
    // Register block types
    this.app.blockRegistryManager.registerBlockType('sql-editor', {
      component: SQLEditorBlock
    })
  }
}
```

### 2. Event-Driven Integration

```typescript
// Listen to NocoBase events
this.app.on('afterStart', async () => {
  await this.schedulerService.initialize()
})

// Emit custom events
this.app.emit('postgresConnector:queryExecuted', {
  dataSourceId,
  query: sql,
  result,
  duration
})
```

## Scalability Considerations

### 1. Modular Service Design
- Easy to add new database types
- Services can be independently scaled
- Clear separation of concerns

### 2. Async Processing
- Non-blocking SQL execution
- Background scheduling service
- Event-driven architecture

### 3. Configuration-Driven
- Database types configurable
- Security policies configurable
- UI components configurable

Những patterns này đảm bảo plugin có thể **maintain**, **extend**, và **scale** theo nhu cầu tương lai. 