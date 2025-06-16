import { Plugin } from '@nocobase/client';
import { DataSourceForm, SQLEditor } from './components';
import React from 'react';

export class PostgresConnectorClient extends Plugin {
  async load() {
    this.app.addRoutes([
      {
        path: '/admin/postgres-connector/data-sources',
        Component: () => {
          const DataSourcesPage = React.lazy(() => import('./pages/DataSourcesPage'));
          return <DataSourcesPage />;
        },
      },
      {
        path: '/admin/postgres-connector/scheduled-queries',
        Component: () => {
          const ScheduledQueriesPage = React.lazy(() => import('./pages/ScheduledQueriesPage'));
          return <ScheduledQueriesPage />;
        },
      },
      {
        path: '/admin/postgres-connector/query-editor',
        Component: () => {
          const QueryEditorPage = React.lazy(() => import('./pages/QueryEditorPage'));
          return <QueryEditorPage />;
        },
      },
    ]);

    // Register settings
    this.app.addSettings({
      'postgres-connector': {
        title: 'PostgreSQL/MySQL Connector',
        icon: 'DatabaseOutlined',
        tabs: {
          dataSources: {
            title: 'Data Sources',
            path: '/admin/postgres-connector/data-sources',
          },
          scheduledQueries: {
            title: 'Scheduled Queries',
            path: '/admin/postgres-connector/scheduled-queries',
          },
          queryEditor: {
            title: 'Query Editor',
            path: '/admin/postgres-connector/query-editor',
          },
        },
      },
    });

    // Register components
    this.app.addComponents({
      'PostgresConnector.DataSourceForm': DataSourceForm,
      'PostgresConnector.SQLEditor': SQLEditor,
    });
  }
}

export default PostgresConnectorClient; 