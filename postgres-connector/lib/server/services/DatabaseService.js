"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseService = void 0;
const pg_1 = require("pg");
const promise_1 = __importDefault(require("mysql2/promise"));
const server_1 = require("@nocobase/server");
class DatabaseService extends server_1.Service {
    /**
     * Connect to database based on configuration
     */
    async connect(config) {
        if (config.type === 'postgres') {
            return this.connectPostgres(config);
        }
        else if (config.type === 'mysql') {
            return this.connectMySQL(config);
        }
        throw new Error(`Unsupported database type: ${config.type}`);
    }
    /**
     * Connect to PostgreSQL database
     */
    async connectPostgres(config) {
        try {
            const client = new pg_1.Client({
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
        }
        catch (error) {
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
    async connectMySQL(config) {
        try {
            const connection = await promise_1.default.createConnection({
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
        }
        catch (error) {
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
    async disconnect(client, type) {
        try {
            if (client && typeof client.end === 'function') {
                await client.end();
                this.app.logger.info(`${type} connection closed`);
            }
        }
        catch (error) {
            this.app.logger.error(`Error closing ${type} connection`, { error: error.message });
        }
    }
    /**
     * Test database connection
     */
    async testConnection(config) {
        let client = null;
        try {
            client = await this.connect(config);
            return true;
        }
        catch (error) {
            this.app.logger.error('Connection test failed', {
                type: config.type,
                host: config.host,
                error: error.message
            });
            return false;
        }
        finally {
            if (client) {
                await this.disconnect(client, config.type);
            }
        }
    }
    /**
     * Validate database configuration
     */
    validateConfig(config) {
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
exports.DatabaseService = DatabaseService;
//# sourceMappingURL=DatabaseService.js.map