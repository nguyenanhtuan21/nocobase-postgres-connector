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

export class DatabaseService extends Service {
  
  /**
   * Connect to database based on configuration
   */
  async connect(config: DatabaseConfig): Promise<DatabaseClient> {
    if (config.type === 'postgres') {
      return this.connectPostgres(config);
    } else if (config.type === 'mysql') {
      return this.connectMySQL(config);
    }
    throw new Error(`Unsupported database type: ${config.type}`);
  }
  
  /**
   * Connect to PostgreSQL database
   */
  async connectPostgres(config: DatabaseConfig): Promise<Client> {
    try {
      const client = new Client({
        host: config.host,
        port: config.port,
        database: config.database,
        user: config.username,
        password: config.password,
        ssl: config.ssl,
        ...config.options,
      });
      
      await client.connect();
      
      // Test connection with simple query
      await client.query('SELECT 1');
      
      this.app.logger.info('PostgreSQL connection established', { 
        host: config.host, 
        database: config.database 
      });
      
      return client;
    } catch (error) {
      this.app.logger.error('PostgreSQL connection failed', { 
        host: config.host, 
        database: config.database,
        error: error.message 
      });
      throw new Error(`PostgreSQL connection failed: ${error.message}`);
    }
  }
  
  /**
   * Connect to MySQL database
   */
  async connectMySQL(config: DatabaseConfig): Promise<mysql.Connection> {
    try {
      const connection = await mysql.createConnection({
        host: config.host,
        port: config.port,
        database: config.database,
        user: config.username,
        password: config.password,
        ssl: config.ssl,
        ...config.options,
      });
      
      // Test connection with simple query
      await connection.execute('SELECT 1');
      
      this.app.logger.info('MySQL connection established', { 
        host: config.host, 
        database: config.database 
      });
      
      return connection;
    } catch (error) {
      this.app.logger.error('MySQL connection failed', { 
        host: config.host, 
        database: config.database,
        error: error.message 
      });
      throw new Error(`MySQL connection failed: ${error.message}`);
    }
  }
  
  /**
   * Disconnect from database
   */
  async disconnect(client: DatabaseClient, type: string): Promise<void> {
    try {
      if (client && typeof client.end === 'function') {
        await client.end();
        this.app.logger.info(`${type} connection closed`);
      }
    } catch (error) {
      this.app.logger.error(`Error closing ${type} connection`, { error: error.message });
    }
  }
  
  /**
   * Test database connection
   */
  async testConnection(config: DatabaseConfig): Promise<boolean> {
    let client: DatabaseClient | null = null;
    
    try {
      client = await this.connect(config);
      return true;
    } catch (error) {
      this.app.logger.error('Connection test failed', { 
        type: config.type,
        host: config.host,
        error: error.message 
      });
      return false;
    } finally {
      if (client) {
        await this.disconnect(client, config.type);
      }
    }
  }
  
  /**
   * Validate database configuration
   */
  validateConfig(config: DatabaseConfig): void {
    const required = ['type', 'host', 'port', 'database', 'username', 'password'];
    
    for (const field of required) {
      if (!config[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }
    
    if (!['postgres', 'mysql'].includes(config.type)) {
      throw new Error(`Unsupported database type: ${config.type}`);
    }
    
    if (config.port < 1 || config.port > 65535) {
      throw new Error(`Invalid port number: ${config.port}`);
    }
  }
} 