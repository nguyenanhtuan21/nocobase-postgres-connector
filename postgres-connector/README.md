# PostgreSQL Connector Plugin for NocoBase

## Overview

This plugin enables NocoBase to connect to external PostgreSQL and MySQL databases, execute SQL queries, and automate database operations through scheduling.

## Features

- **Database Connection Management**: Configure and manage multiple PostgreSQL/MySQL connections
- **SQL Query Execution**: Execute SQL queries directly from NocoBase interface
- **Stored Procedures Support**: Call stored procedures and functions
- **Query Scheduling**: Automate SQL execution with cron-based scheduling
- **Security**: Encrypted connection strings and SQL injection prevention

## Installation

1. Install the plugin:
```bash
yarn add @my-project/plugin-postgres-connector
```

2. Enable the plugin in your NocoBase application:
```bash
yarn pm enable @my-project/plugin-postgres-connector
```

3. Start your NocoBase application:
```bash
yarn start
```

## Development

### Prerequisites

- Node.js >= 16
- NocoBase development environment
- PostgreSQL and/or MySQL databases for testing

### Setup

1. Clone the repository
2. Install dependencies:
```bash
yarn install
```

3. Build the plugin:
```bash
yarn build
```

4. Run tests:
```bash
yarn test
```

## Development Progress

- [x] Project structure initialization
- [x] Database collections definition
- [x] Plugin skeleton creation
- [ ] Database service implementation
- [ ] SQL executor service
- [ ] UI components
- [ ] Scheduling system
- [ ] Testing and documentation

## Architecture

```
/postgres-connector
  ├── /src
  │   ├── /client          # React components and UI
  │   ├── /server          # Node.js services and API
  │   │   ├── /collections # Database schema definitions
  │   │   ├── /services    # Business logic services
  │   │   └── /actions     # API endpoints
  │   └── /shared          # Common types and utilities
  ├── client.js            # Client entry point
  ├── server.js            # Server entry point
  └── package.json
```

## Next Steps

1. Implement DatabaseService for connection management
2. Create SQLExecutor service for query execution
3. Build React components for UI
4. Add scheduling capabilities
5. Implement security measures
6. Write comprehensive tests

## License

MIT 