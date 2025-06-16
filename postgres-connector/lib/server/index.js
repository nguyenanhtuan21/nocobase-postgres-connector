"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PostgresConnectorPlugin = void 0;
const server_1 = require("@nocobase/server");
const path_1 = __importDefault(require("path"));
const DatabaseService_1 = require("./services/DatabaseService");
const SQLExecutor_1 = require("./services/SQLExecutor");
class PostgresConnectorPlugin extends server_1.Plugin {
    async afterAdd() {
        // Register collections
        await this.app.db.import({
            directory: path_1.default.resolve(__dirname, 'collections'),
        });
    }
    async beforeLoad() {
        // Initialize services before loading
    }
    async load() {
        // Register services
        this.app.addService('postgresConnector:database', new DatabaseService_1.DatabaseService(this.app));
        this.app.addService('postgresConnector:sqlExecutor', new SQLExecutor_1.SQLExecutor(this.app));
        // Register API endpoints
        this.app.resourcer.define({
            name: 'postgresConnector:execute',
            actions: {
                async execute(ctx, next) {
                    const { dataSourceId, sql, params } = ctx.action.params;
                    const executor = ctx.app.getService('postgresConnector:sqlExecutor');
                    try {
                        const result = await executor.execute(dataSourceId, sql, params);
                        ctx.body = result;
                    }
                    catch (error) {
                        ctx.status = 400;
                        ctx.body = { error: error.message };
                    }
                    await next();
                },
                async testConnection(ctx, next) {
                    const { config } = ctx.action.params;
                    const database = ctx.app.getService('postgresConnector:database');
                    try {
                        const isConnected = await database.testConnection(config);
                        ctx.body = { success: isConnected };
                    }
                    catch (error) {
                        ctx.status = 400;
                        ctx.body = { success: false, error: error.message };
                    }
                    await next();
                },
            },
        });
        // Load services, actions, and middleware
        this.app.logger.info('PostgreSQL Connector Plugin loaded successfully');
    }
    async install() {
        // Run installation tasks
        this.app.logger.info('PostgreSQL Connector Plugin installed');
    }
    async afterEnable() {
        // Tasks after plugin is enabled
        this.app.logger.info('PostgreSQL Connector Plugin enabled');
    }
    async afterDisable() {
        // Cleanup tasks after plugin is disabled
        this.app.logger.info('PostgreSQL Connector Plugin disabled');
    }
    async remove() {
        // Remove plugin data
        this.app.logger.info('PostgreSQL Connector Plugin removed');
    }
}
exports.PostgresConnectorPlugin = PostgresConnectorPlugin;
exports.default = PostgresConnectorPlugin;
//# sourceMappingURL=index.js.map