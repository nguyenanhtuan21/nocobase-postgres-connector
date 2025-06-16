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
import { SQLExecutor } from '../services/SQLExecutor';

/**
 * Controller for ScheduledQueries resource
 */
export class ScheduledQueriesController {
  database: any;
  
  constructor(database: any) {
    this.database = database;
  }

  /**
   * List all scheduled queries with pagination and filtering
   */
  async list(ctx: Context, next: Next) {
    const { page = 1, pageSize = 20, filter, sort } = ctx.action.params;
    
    const query = {
      filter,
      sort,
      page,
      pageSize,
      appends: ['dataSource'],
    };
    
    const repository = this.database.getRepository('postgresConnector:scheduledQueries');
    const results = await repository.find(query);
    
    ctx.body = results;
    await next();
  }

  /**
   * Get a single scheduled query by ID
   */
  async get(ctx: Context, next: Next) {
    const { filterByTk } = ctx.action.params;
    
    if (!filterByTk) {
      ctx.throw(400, 'ID is required');
      return;
    }
    
    const repository = this.database.getRepository('postgresConnector:scheduledQueries');
    const scheduledQuery = await repository.findOne({
      filterByTk,
      appends: ['dataSource'],
    });
    
    if (!scheduledQuery) {
      ctx.throw(404, 'Scheduled query not found');
      return;
    }
    
    ctx.body = scheduledQuery;
    await next();
  }

  /**
   * Create a new scheduled query
   */
  async create(ctx: Context, next: Next) {
    const { values } = ctx.action.params;
    
    if (!values) {
      ctx.throw(400, 'Values are required');
      return;
    }
    
    if (!values.dataSourceId) {
      ctx.throw(400, 'Data source is required');
      return;
    }
    
    if (!values.sqlQuery) {
      ctx.throw(400, 'SQL query is required');
      return;
    }
    
    try {
      // Validate the SQL query
      const sqlExecutor = ctx.app.getService('postgresConnector:sqlExecutor') as SQLExecutor;
      sqlExecutor['validateQuery'](values.sqlQuery);
      
      const repository = this.database.getRepository('postgresConnector:scheduledQueries');
      const scheduledQuery = await repository.create({
        values,
      });
      
      ctx.body = scheduledQuery;
      ctx.status = 201;
      await next();
    } catch (error: any) {
      ctx.throw(400, error.message);
      // Don't call next() when there's an error
    }
  }

  /**
   * Update an existing scheduled query
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
      // If SQL query is updated, validate it
      if (values.sqlQuery) {
        const sqlExecutor = ctx.app.getService('postgresConnector:sqlExecutor') as SQLExecutor;
        sqlExecutor['validateQuery'](values.sqlQuery);
      }
      
      const repository = this.database.getRepository('postgresConnector:scheduledQueries');
      const scheduledQuery = await repository.update({
        filterByTk,
        values,
      });
      
      ctx.body = scheduledQuery;
      await next();
    } catch (error: any) {
      ctx.throw(400, error.message);
      // Don't call next() when there's an error
    }
  }

  /**
   * Delete a scheduled query
   */
  async destroy(ctx: Context, next: Next) {
    const { filterByTk } = ctx.action.params;
    
    if (!filterByTk) {
      ctx.throw(400, 'ID is required');
      return;
    }
    
    try {
      const repository = this.database.getRepository('postgresConnector:scheduledQueries');
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
   * Execute a scheduled query manually
   */
  async execute(ctx: Context, next: Next) {
    const { filterByTk, params = {} } = ctx.action.params;
    
    if (!filterByTk) {
      ctx.throw(400, 'ID is required');
      return;
    }
    
    try {
      // Get the scheduled query
      const repository = this.database.getRepository('postgresConnector:scheduledQueries');
      const scheduledQuery = await repository.findOne({
        filterByTk,
        appends: ['dataSource'],
      });
      
      if (!scheduledQuery) {
        ctx.throw(404, 'Scheduled query not found');
        return;
      }
      
      if (!scheduledQuery.dataSource) {
        ctx.throw(400, 'Data source not found');
        return;
      }
      
      // Execute the query
      const sqlExecutor = ctx.app.getService('postgresConnector:sqlExecutor') as SQLExecutor;
      const result = await sqlExecutor.execute(
        scheduledQuery.dataSource.id,
        scheduledQuery.sqlQuery,
        params
      );
      
      // Update the last execution time and result
      await repository.update({
        filterByTk,
        values: {
          lastExecutedAt: new Date(),
          lastResult: result,
        },
      });
      
      ctx.body = result;
      await next();
    } catch (error: any) {
      ctx.body = {
        error: error.message,
      };
      ctx.status = 400;
      await next();
    }
  }
} 