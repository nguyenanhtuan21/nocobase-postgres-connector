import { defineCollection } from '@nocobase/database';

export default defineCollection({
  name: 'postgresConnector:dataSources',
  fields: [
    { type: 'string', name: 'title', required: true },
    { type: 'string', name: 'type', defaultValue: 'postgres' },
    { type: 'string', name: 'host', required: true },
    { type: 'integer', name: 'port', defaultValue: 5432 },
    { type: 'string', name: 'database', required: true },
    { type: 'string', name: 'username', required: true },
    { type: 'password', name: 'password', required: true },
    { type: 'string', name: 'schema', defaultValue: 'public' },
    { type: 'boolean', name: 'ssl', defaultValue: false },
    { type: 'jsonb', name: 'options' },
    { type: 'boolean', name: 'enabled', defaultValue: true },
  ],
}); 