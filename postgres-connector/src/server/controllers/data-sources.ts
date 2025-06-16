// Define types locally instead of importing
type Context = {
  action: {
    params: any;
  };
  throw: (status: number, message: string) => void;
  body: any;
  status: number;
  app: {
    getService: (name: string) => any;
  };
};

type Next = () => Promise<void>;

// Import local service
import { DatabaseService } from '../services/DatabaseService';

/**
 * Controller for DataSources resource
 */
export class DataSourcesController {
  database: any;
  
  constructor(database: any) {
    this.database = database;
  }

  /**
   * List all data sources with pagination and filtering
   */
  async list(ctx: Context, next: Next) {
    const { page = 1, pageSize = 20, filter, sort } = ctx.action.params;
    
    const query = {
      filter,
      sort,
      page,
      pageSize,
    };
    
    const repository = this.database.getRepository('postgresConnector:dataSources');
    const results = await repository.find(query);
    
    ctx.body = results;
    await next();
  }

  /**
   * Get a single data source by ID
   */
  async get(ctx: Context, next: Next) {
    const { filterByTk } = ctx.action.params;
    
    if (!filterByTk) {
      ctx.throw(400, 'ID is required');
      return;
    }
    
    const repository = this.database.getRepository('postgresConnector:dataSources');
    const dataSource = await repository.findOne({
      filterByTk,
    });
    
    if (!dataSource) {
      ctx.throw(404, 'Data source not found');
      return;
    }
    
    ctx.body = dataSource;
    await next();
  }

  /**
   * Create a new data source
   */
  async create(ctx: Context, next: Next) {
    const { values } = ctx.action.params;
    
    if (!values) {
      ctx.throw(400, 'Values are required');
      return;
    }
    
    try {
      const repository = this.database.getRepository('postgresConnector:dataSources');
      const dataSource = await repository.create({
        values,
      });
      
      ctx.body = dataSource;
      ctx.status = 201;
      await next();
    } catch (error: any) {
      ctx.throw(400, error.message);
      // Don't call next() when there's an error
    }
  }

  /**
   * Update an existing data source
   */
  async update(ctx: Context, next: Next) {
    const { filterByTk, values } = ctx.action.params;
    
    if (!filterByTk) {
      ctx.throw(400, 'ID is required');
      return;
    }
    
    if (!values) {
      ctx.throw(400, 'Values are required');
      return;
    }
    
    try {
      const repository = this.database.getRepository('postgresConnector:dataSources');
      const dataSource = await repository.update({
        filterByTk,
        values,
      });
      
      ctx.body = dataSource;
      await next();
    } catch (error: any) {
      ctx.throw(400, error.message);
      // Don't call next() when there's an error
    }
  }

  /**
   * Delete a data source
   */
  async destroy(ctx: Context, next: Next) {
    const { filterByTk } = ctx.action.params;
    
    if (!filterByTk) {
      ctx.throw(400, 'ID is required');
      return;
    }
    
    try {
      const repository = this.database.getRepository('postgresConnector:dataSources');
      await repository.destroy({
        filterByTk,
      });
      
      ctx.status = 204;
      await next();
    } catch (error: any) {
      ctx.throw(400, error.message);
      // Don't call next() when there's an error
    }
  }

  /**
   * Test connection to a data source
   */
  async testConnection(ctx: Context, next: Next) {
    const { values } = ctx.action.params;
    
    if (!values) {
      ctx.throw(400, 'Connection configuration is required');
      return;
    }
    
    try {
      const databaseService = ctx.app.getService('postgresConnector:database') as DatabaseService;
      
      // Validate configuration
      databaseService.validateConfig(values);
      
      // Test connection
      const connected = await databaseService.testConnection(values);
      
      ctx.body = {
        success: connected,
        message: connected ? 'Connection successful' : 'Connection failed',
      };
      await next();
    } catch (error: any) {
      ctx.body = {
        success: false,
        message: error.message,
      };
      await next();
    }
  }
} 