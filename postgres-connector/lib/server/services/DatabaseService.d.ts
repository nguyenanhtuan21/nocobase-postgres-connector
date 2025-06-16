import { Client } from 'pg';
import mysql from 'mysql2/promise';
import { Service } from '@nocobase/server';
export interface DatabaseConfig {
    type: 'postgres' | 'mysql';
    host: string;
    port: number;
    database: string;
    username: string;
    password: string;
    ssl?: boolean | object;
    schema?: string;
    options?: any;
}
export interface DatabaseClient {
    query?(sql: string, params?: any[]): Promise<any>;
    execute?(sql: string, params?: any[]): Promise<any>;
    end(): Promise<void>;
}
export declare class DatabaseService extends Service {
    /**
     * Connect to database based on configuration
     */
    connect(config: DatabaseConfig): Promise<DatabaseClient>;
    /**
     * Connect to PostgreSQL database
     */
    connectPostgres(config: DatabaseConfig): Promise<Client>;
    /**
     * Connect to MySQL database
     */
    connectMySQL(config: DatabaseConfig): Promise<mysql.Connection>;
    /**
     * Disconnect from database
     */
    disconnect(client: DatabaseClient, type: string): Promise<void>;
    /**
     * Test database connection
     */
    testConnection(config: DatabaseConfig): Promise<boolean>;
    /**
     * Validate database configuration
     */
    validateConfig(config: DatabaseConfig): void;
}
//# sourceMappingURL=DatabaseService.d.ts.map