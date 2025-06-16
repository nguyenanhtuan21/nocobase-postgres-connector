import { Service } from '@nocobase/server';
export interface QueryResult {
    rows: any[];
    rowCount: number;
    fields?: any[];
    executionTime: number;
}
export interface QueryParams {
    [key: string]: any;
}
export declare class SQLExecutor extends Service {
    /**
     * Execute SQL query on specified data source
     */
    execute(dataSourceId: string, sqlQuery: string, params?: QueryParams): Promise<QueryResult>;
    /**
     * Execute query on PostgreSQL
     */
    private executePostgresQuery;
    /**
     * Execute query on MySQL
     */
    private executeMySQLQuery;
    /**
     * Convert named parameters to database-specific format
     */
    private convertNamedParams;
    /**
     * Basic SQL query validation
     */
    private validateQuery;
    /**
     * Remove SQL comments from query
     */
    private removeComments;
    /**
     * Execute stored procedure (future enhancement)
     */
    executeStoredProcedure(dataSourceId: string, procedureName: string, params?: QueryParams): Promise<QueryResult>;
    /**
     * Execute function (future enhancement)
     */
    executeFunction(dataSourceId: string, functionName: string, params?: QueryParams): Promise<QueryResult>;
    /**
     * Explain query execution plan (future enhancement)
     */
    explainQuery(dataSourceId: string, sqlQuery: string): Promise<any>;
}
//# sourceMappingURL=SQLExecutor.d.ts.map