"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SQLExecutor = void 0;
const server_1 = require("@nocobase/server");
class SQLExecutor extends server_1.Service {
    /**
     * Execute SQL query on specified data source
     */
    async execute(dataSourceId, sqlQuery, params = {}) {
        const startTime = Date.now();
        try {
            // Get data source configuration
            const dataSource = await this.app.db
                .getRepository('postgresConnector:dataSources')
                .findById(dataSourceId);
            if (!dataSource) {
                throw new Error('Data source not found');
            }
            if (!dataSource.enabled) {
                throw new Error('Data source is disabled');
            }
            // Get database service
            const databaseService = this.app.getService('postgresConnector:database');
            // Validate and sanitize SQL query
            this.validateQuery(sqlQuery);
            // Connect to database
            const client = await databaseService.connect(dataSource);
            try {
                let result;
                // Execute query based on database type
                if (dataSource.type === 'postgres') {
                    result = await this.executePostgresQuery(client, sqlQuery, params);
                }
                else if (dataSource.type === 'mysql') {
                    result = await this.executeMySQLQuery(client, sqlQuery, params);
                }
                else {
                    throw new Error(`Unsupported database type: ${dataSource.type}`);
                }
                const executionTime = Date.now() - startTime;
                this.app.logger.info('SQL query executed successfully', {
                    dataSourceId,
                    queryLength: sqlQuery.length,
                    rowCount: result.rowCount,
                    executionTime
                });
                return {
                    rows: result.rows,
                    rowCount: result.rowCount,
                    fields: result.fields,
                    executionTime
                };
            }
            finally {
                // Always close connection
                await databaseService.disconnect(client, dataSource.type);
            }
        }
        catch (error) {
            const executionTime = Date.now() - startTime;
            this.app.logger.error('SQL query execution failed', {
                dataSourceId,
                queryLength: sqlQuery.length,
                executionTime,
                error: error.message
            });
            throw new Error(`Query execution failed: ${error.message}`);
        }
    }
    /**
     * Execute query on PostgreSQL
     */
    async executePostgresQuery(client, sqlQuery, params) {
        // Convert named parameters to positional parameters for PostgreSQL
        const { query, values } = this.convertNamedParams(sqlQuery, params, 'postgres');
        const result = await client.query(query, values);
        return {
            rows: result.rows,
            rowCount: result.rowCount,
            fields: result.fields
        };
    }
    /**
     * Execute query on MySQL
     */
    async executeMySQLQuery(client, sqlQuery, params) {
        // Convert named parameters to ? placeholders for MySQL
        const { query, values } = this.convertNamedParams(sqlQuery, params, 'mysql');
        const [rows, fields] = await client.execute(query, values);
        return {
            rows: Array.isArray(rows) ? rows : [rows],
            rowCount: Array.isArray(rows) ? rows.length : 1,
            fields: fields
        };
    }
    /**
     * Convert named parameters to database-specific format
     */
    convertNamedParams(query, params, dbType) {
        const values = [];
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
    /**
     * Basic SQL query validation
     */
    validateQuery(sqlQuery) {
        if (!sqlQuery || typeof sqlQuery !== 'string') {
            throw new Error('SQL query must be a non-empty string');
        }
        const trimmedQuery = sqlQuery.trim();
        if (trimmedQuery.length === 0) {
            throw new Error('SQL query cannot be empty');
        }
        // Remove comments and check for dangerous commands
        const cleanQuery = this.removeComments(trimmedQuery);
        // Basic security check - allow only SELECT statements for now
        // This can be made configurable based on user permissions
        const dangerousPatterns = [
            /\b(DROP|DELETE|UPDATE|INSERT|ALTER|CREATE|TRUNCATE|GRANT|REVOKE)\b/i
        ];
        for (const pattern of dangerousPatterns) {
            if (pattern.test(cleanQuery)) {
                throw new Error('Potentially dangerous SQL command detected. Only SELECT statements are allowed.');
            }
        }
    }
    /**
     * Remove SQL comments from query
     */
    removeComments(query) {
        // Remove single-line comments (-- comment)
        query = query.replace(/--.*$/gm, '');
        // Remove multi-line comments (/* comment */)
        query = query.replace(/\/\*[\s\S]*?\*\//g, '');
        return query.trim();
    }
    /**
     * Execute stored procedure (future enhancement)
     */
    async executeStoredProcedure(dataSourceId, procedureName, params = {}) {
        // This will be implemented in later phases
        throw new Error('Stored procedure execution not yet implemented');
    }
    /**
     * Execute function (future enhancement)
     */
    async executeFunction(dataSourceId, functionName, params = {}) {
        // This will be implemented in later phases
        throw new Error('Function execution not yet implemented');
    }
    /**
     * Explain query execution plan (future enhancement)
     */
    async explainQuery(dataSourceId, sqlQuery) {
        // This will be implemented in later phases
        throw new Error('Query explanation not yet implemented');
    }
}
exports.SQLExecutor = SQLExecutor;
//# sourceMappingURL=SQLExecutor.js.map