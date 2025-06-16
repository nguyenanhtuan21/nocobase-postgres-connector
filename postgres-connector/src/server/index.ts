import { Plugin } from '@nocobase/server';
import path from 'path';
import { DatabaseService } from './services/DatabaseService';
import { SQLExecutor } from './services/SQLExecutor';
import { DataSourcesController, ScheduledQueriesController } from './controllers';

export class PostgresConnectorPlugin extends Plugin {
  async afterAdd() {
    // Register collections
    await this.app.db.import({
      directory: path.resolve(__dirname, 'collections'),
    });
  }

  async beforeLoad() {
    // Initialize services before loading
  }

  async load() {
    // Register services
    this.app.addService('postgresConnector:database', new DatabaseService(this.app));
    this.app.addService('postgresConnector:sqlExecutor', new SQLExecutor(this.app));
    
    // Register controllers
    const dataSourcesController = new DataSourcesController(this.app.db);
    const scheduledQueriesController = new ScheduledQueriesController(this.app.db);
    
    // Register API resources
    
    // Data Sources API
    this.app.resourcer.define({
      name: 'postgresConnector:dataSources',
      actions: {
        list: dataSourcesController.list.bind(dataSourcesController),
        get: dataSourcesController.get.bind(dataSourcesController),
        create: dataSourcesController.create.bind(dataSourcesController),
        update: dataSourcesController.update.bind(dataSourcesController),
        destroy: dataSourcesController.destroy.bind(dataSourcesController),
        testConnection: dataSourcesController.testConnection.bind(dataSourcesController),
      },
    });
    
    // Scheduled Queries API
    this.app.resourcer.define({
      name: 'postgresConnector:scheduledQueries',
      actions: {
        list: scheduledQueriesController.list.bind(scheduledQueriesController),
        get: scheduledQueriesController.get.bind(scheduledQueriesController),
        create: scheduledQueriesController.create.bind(scheduledQueriesController),
        update: scheduledQueriesController.update.bind(scheduledQueriesController),
        destroy: scheduledQueriesController.destroy.bind(scheduledQueriesController),
        execute: scheduledQueriesController.execute.bind(scheduledQueriesController),
      },
    });
    
    // SQL execution API
    this.app.resourcer.define({
      name: 'postgresConnector:execute',
      actions: {
        async execute(ctx, next) {
          const { dataSourceId, sql, params } = ctx.action.params;
          const executor = ctx.app.getService('postgresConnector:sqlExecutor');
          
          try {
            const result = await executor.execute(dataSourceId, sql, params);
            ctx.body = result;
          } catch (error: any) {
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
          } catch (error: any) {
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

export default PostgresConnectorPlugin; 