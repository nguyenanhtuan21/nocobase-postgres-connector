# Lộ trình kỹ thuật phát triển plugin `postgres-connector` cho NocoBase

Dựa trên kế hoạch tổng thể trong file `planning.md`, tài liệu này trình bày lộ trình kỹ thuật chi tiết để phát triển plugin `postgres-connector` cho NocoBase trong vòng 3 tuần.

## Cấu trúc thư mục plugin

Plugin sẽ được tổ chức theo cấu trúc thư mục chuẩn của NocoBase:

```
/postgres-connector
  ├── /src
  │   ├── /client                 # Mã nguồn phía client
  │   │   ├── /components         # Các component React
  │   │   │   ├── ConfigForm.tsx  # Form cấu hình kết nối
  │   │   │   ├── SQLEditor.tsx   # Editor SQL
  │   │   │   └── ...
  │   │   ├── /pages              # Các trang UI
  │   │   ├── /hooks              # React hooks
  │   │   └── index.tsx           # Entry point phía client
  │   ├── /server                 # Mã nguồn phía server
  │   │   ├── /collections        # Định nghĩa collections
  │   │   ├── /services           # Các service
  │   │   │   ├── DatabaseService.ts  # Service kết nối DB
  │   │   │   ├── SQLExecutor.ts      # Service thực thi SQL
  │   │   │   └── ...
  │   │   ├── /migrations         # Migrations
  │   │   ├── /actions            # API actions
  │   │   └── index.ts            # Entry point phía server
  │   └── /constants.ts           # Các hằng số dùng chung
  ├── client.js                   # Client entry
  ├── server.js                   # Server entry
  ├── package.json                # Thông tin package
  └── README.md                   # Tài liệu
```

## Tuần 1: Thiết lập cơ bản và kết nối cơ sở dữ liệu

### Ngày 1-2: Khởi tạo cấu trúc plugin và thiết lập môi trường

1. **Khởi tạo plugin**
   - Sử dụng lệnh `yarn pm create @my-project/plugin-postgres-connector` để tạo cấu trúc plugin cơ bản
   - Cấu hình `package.json` với các dependencies cần thiết:
     ```json
     "dependencies": {
       "pg": "^8.11.3",
       "mysql2": "^3.6.5",
       "node-cron": "^3.0.3"
     }
     ```
   - Kích hoạt plugin trong môi trường phát triển: `yarn pm enable @my-project/plugin-postgres-connector`

2. **Định nghĩa collections**
   - Tạo collection `DataSources` để lưu thông tin kết nối:
     ```typescript
     // src/server/collections/data-sources.ts
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
     ```

   - Tạo collection `ScheduledQueries` để lưu các truy vấn tự động:
     ```typescript
     // src/server/collections/scheduled-queries.ts
     import { defineCollection } from '@nocobase/database';
     
     export default defineCollection({
       name: 'postgresConnector:scheduledQueries',
       fields: [
         { type: 'string', name: 'title', required: true },
         { type: 'belongsTo', name: 'dataSource', target: 'postgresConnector:dataSources', required: true },
         { type: 'text', name: 'sqlQuery', required: true },
         { type: 'string', name: 'cronExpression' },
         { type: 'string', name: 'triggerType', defaultValue: 'schedule' }, // schedule, event
         { type: 'string', name: 'triggerEvent' }, // Nếu triggerType là event
         { type: 'boolean', name: 'enabled', defaultValue: true },
         { type: 'jsonb', name: 'lastResult' },
         { type: 'datetime', name: 'lastExecutedAt' },
       ],
     });
     ```

### Ngày 3-4: Xây dựng service kết nối cơ sở dữ liệu

1. **Tạo DatabaseService**
   - Xây dựng service quản lý kết nối đến PostgreSQL và MySQL:
     ```typescript
     // src/server/services/DatabaseService.ts
     import { Client } from 'pg';
     import mysql from 'mysql2/promise';
     import { Service } from '@nocobase/server';
     
     export class DatabaseService extends Service {
       async connect(config) {
         if (config.type === 'postgres') {
           return this.connectPostgres(config);
         } else if (config.type === 'mysql') {
           return this.connectMySQL(config);
         }
         throw new Error(`Unsupported database type: ${config.type}`);
       }
       
       async connectPostgres(config) {
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
         return client;
       }
       
       async connectMySQL(config) {
         const connection = await mysql.createConnection({
           host: config.host,
           port: config.port,
           database: config.database,
           user: config.username,
           password: config.password,
           ssl: config.ssl,
           ...config.options,
         });
         
         return connection;
       }
       
       // Các phương thức khác: disconnect, testConnection, etc.
     }
     ```

2. **Tạo SQLExecutor**
   - Xây dựng service thực thi câu lệnh SQL:
     ```typescript
     // src/server/services/SQLExecutor.ts
     import { Service } from '@nocobase/server';
     
     export class SQLExecutor extends Service {
       async execute(dataSourceId, sqlQuery, params = {}) {
         const { database } = this.app.getService('postgresConnector');
         const dataSource = await this.app.db.getRepository('postgresConnector:dataSources').findById(dataSourceId);
         
         if (!dataSource) {
           throw new Error('Data source not found');
         }
         
         const client = await database.connect(dataSource);
         try {
           // Thực thi câu lệnh SQL dựa vào loại database
           if (dataSource.type === 'postgres') {
             const result = await client.query(sqlQuery, Object.values(params));
             return result.rows;
           } else if (dataSource.type === 'mysql') {
             const [rows] = await client.execute(sqlQuery, Object.values(params));
             return rows;
           }
         } finally {
           // Đóng kết nối
           if (dataSource.type === 'postgres') {
             await client.end();
           } else if (dataSource.type === 'mysql') {
             await client.end();
           }
         }
       }
       
       // Các phương thức khác: validateQuery, explainQuery, etc.
     }
     ```

### Ngày 5-7: Xây dựng API endpoints và UI cấu hình cơ bản

1. **Tạo API endpoints**
   - Định nghĩa các endpoints trong plugin server:
     ```typescript
     // src/server/plugin.ts
     import { Plugin } from '@nocobase/server';
     import { DatabaseService } from './services/DatabaseService';
     import { SQLExecutor } from './services/SQLExecutor';
     
     export class PostgresConnectorPlugin extends Plugin {
       async load() {
         // Đăng ký services
         this.app.registerService('postgresConnector:database', new DatabaseService(this.app));
         this.app.registerService('postgresConnector:sqlExecutor', new SQLExecutor(this.app));
         
         // Đăng ký API endpoints
         this.app.resourcer.define({
           name: 'postgresConnector:execute',
           actions: {
             async execute(ctx, next) {
               const { dataSourceId, sql, params } = ctx.action.params;
               const executor = ctx.app.getService('postgresConnector:sqlExecutor');
               
               try {
                 const result = await executor.execute(dataSourceId, sql, params);
                 ctx.body = result;
               } catch (error) {
                 ctx.status = 400;
                 ctx.body = { error: error.message };
               }
               
               await next();
             },
             
             async testConnection(ctx, next) {
               const { config } = ctx.action.params;
               const database = ctx.app.getService('postgresConnector:database');
               
               try {
                 const client = await database.connect(config);
                 await database.disconnect(client, config.type);
                 ctx.body = { success: true };
               } catch (error) {
                 ctx.status = 400;
                 ctx.body = { success: false, error: error.message };
               }
               
               await next();
             },
           },
         });
       }
     }
     ```

2. **Xây dựng UI cấu hình cơ bản**
   - Tạo component ConfigForm:
     ```tsx
     // src/client/components/ConfigForm.tsx
     import React from 'react';
     import { Form, Input, InputNumber, Select, Switch } from 'antd';
     
     export const ConfigForm = ({ initialValues, onFinish }) => {
       return (
         <Form
           initialValues={initialValues}
           onFinish={onFinish}
           labelCol={{ span: 6 }}
           wrapperCol={{ span: 18 }}
         >
           <Form.Item
             name="title"
             label="Tên kết nối"
             rules={[{ required: true }]}
           >
             <Input />
           </Form.Item>
           
           <Form.Item
             name="type"
             label="Loại database"
             rules={[{ required: true }]}
           >
             <Select>
               <Select.Option value="postgres">PostgreSQL</Select.Option>
               <Select.Option value="mysql">MySQL</Select.Option>
             </Select>
           </Form.Item>
           
           <Form.Item
             name="host"
             label="Host"
             rules={[{ required: true }]}
           >
             <Input />
           </Form.Item>
           
           <Form.Item
             name="port"
             label="Port"
           >
             <InputNumber />
           </Form.Item>
           
           <Form.Item
             name="database"
             label="Database"
             rules={[{ required: true }]}
           >
             <Input />
           </Form.Item>
           
           <Form.Item
             name="username"
             label="Username"
             rules={[{ required: true }]}
           >
             <Input />
           </Form.Item>
           
           <Form.Item
             name="password"
             label="Password"
             rules={[{ required: true }]}
           >
             <Input.Password />
           </Form.Item>
           
           <Form.Item
             name="ssl"
             label="SSL"
             valuePropName="checked"
           >
             <Switch />
           </Form.Item>
         </Form>
       );
     };
     ```

## Tuần 2: Thực thi SQL và giao diện người dùng

### Ngày 8-10: Xây dựng giao diện thực thi SQL

1. **Tạo SQLEditor component**
   - Xây dựng editor SQL với syntax highlighting:
     ```tsx
     // src/client/components/SQLEditor.tsx
     import React, { useState } from 'react';
     import { Button, Space, message } from 'antd';
     import { useAPIClient } from '@nocobase/client';
     import CodeMirror from '@uiw/react-codemirror';
     import { sql } from '@codemirror/lang-sql';
     
     export const SQLEditor = ({ dataSourceId }) => {
       const [sqlQuery, setSqlQuery] = useState('');
       const [results, setResults] = useState(null);
       const [loading, setLoading] = useState(false);
       const api = useAPIClient();
       
       const handleExecute = async () => {
         if (!sqlQuery.trim()) {
           return message.error('SQL query cannot be empty');
         }
         
         setLoading(true);
         try {
           const response = await api.request({
             url: 'postgresConnector:execute:execute',
             method: 'POST',
             data: {
               dataSourceId,
               sql: sqlQuery,
             },
           });
           
           setResults(response.data);
         } catch (error) {
           message.error(error.message || 'Failed to execute SQL query');
         } finally {
           setLoading(false);
         }
       };
       
       return (
         <div>
           <CodeMirror
             value={sqlQuery}
             height="200px"
             extensions={[sql()]}
             onChange={(value) => setSqlQuery(value)}
           />
           
           <Space style={{ marginTop: 16, marginBottom: 16 }}>
             <Button type="primary" onClick={handleExecute} loading={loading}>
               Execute
             </Button>
           </Space>
           
           {results && (
             <div>
               {/* Hiển thị kết quả dưới dạng bảng */}
             </div>
           )}
         </div>
       );
     };
     ```

2. **Tạo ResultsTable component**
   - Hiển thị kết quả truy vấn SQL:
     ```tsx
     // src/client/components/ResultsTable.tsx
     import React from 'react';
     import { Table } from 'antd';
     
     export const ResultsTable = ({ results }) => {
       if (!results || !results.length) {
         return <div>No results</div>;
       }
       
       // Tạo columns từ keys của row đầu tiên
       const columns = Object.keys(results[0]).map(key => ({
         title: key,
         dataIndex: key,
         key,
         render: (text) => {
           if (text === null) return 'NULL';
           if (typeof text === 'object') return JSON.stringify(text);
           return String(text);
         },
       }));
       
       return (
         <Table
           dataSource={results.map((row, index) => ({ ...row, key: index }))}
           columns={columns}
           scroll={{ x: 'max-content' }}
           pagination={{ pageSize: 10 }}
         />
       );
     };
     ```

### Ngày 11-12: Xây dựng tính năng hỗ trợ procedure, view, function

1. **Mở rộng SQLExecutor**
   - Thêm hỗ trợ cho procedure, view, function:
     ```typescript
     // src/server/services/SQLExecutor.ts (mở rộng)
     
     export class SQLExecutor extends Service {
       // ... code hiện tại
       
       async executeStoredProcedure(dataSourceId, procedureName, params = {}) {
         const dataSource = await this.app.db.getRepository('postgresConnector:dataSources').findById(dataSourceId);
         const client = await this.app.getService('postgresConnector:database').connect(dataSource);
         
         try {
           if (dataSource.type === 'postgres') {
             // PostgreSQL CALL syntax
             const paramPlaceholders = Object.keys(params).map((_, index) => `$${index + 1}`).join(', ');
             const query = `CALL ${procedureName}(${paramPlaceholders})`;
             const result = await client.query(query, Object.values(params));
             return result.rows;
           } else if (dataSource.type === 'mysql') {
             // MySQL CALL syntax
             const paramPlaceholders = Object.keys(params).map(() => '?').join(', ');
             const query = `CALL ${procedureName}(${paramPlaceholders})`;
             const [rows] = await client.execute(query, Object.values(params));
             return rows;
           }
         } finally {
           // Đóng kết nối
           if (dataSource.type === 'postgres') {
             await client.end();
           } else if (dataSource.type === 'mysql') {
             await client.end();
           }
         }
       }
       
       async executeFunction(dataSourceId, functionName, params = {}) {
         const dataSource = await this.app.db.getRepository('postgresConnector:dataSources').findById(dataSourceId);
         const client = await this.app.getService('postgresConnector:database').connect(dataSource);
         
         try {
           if (dataSource.type === 'postgres') {
             // PostgreSQL function call
             const paramPlaceholders = Object.keys(params).map((_, index) => `$${index + 1}`).join(', ');
             const query = `SELECT * FROM ${functionName}(${paramPlaceholders})`;
             const result = await client.query(query, Object.values(params));
             return result.rows;
           } else if (dataSource.type === 'mysql') {
             // MySQL function call
             const paramPlaceholders = Object.keys(params).map(() => '?').join(', ');
             const query = `SELECT ${functionName}(${paramPlaceholders}) AS result`;
             const [rows] = await client.execute(query, Object.values(params));
             return rows;
           }
         } finally {
           // Đóng kết nối
           if (dataSource.type === 'postgres') {
             await client.end();
           } else if (dataSource.type === 'mysql') {
             await client.end();
           }
         }
       }
     }
     ```

2. **Mở rộng API endpoints**
   - Thêm endpoints cho procedure và function:
     ```typescript
     // src/server/plugin.ts (mở rộng)
     
     this.app.resourcer.define({
       name: 'postgresConnector:procedure',
       actions: {
         async execute(ctx, next) {
           const { dataSourceId, procedureName, params } = ctx.action.params;
           const executor = ctx.app.getService('postgresConnector:sqlExecutor');
           
           try {
             const result = await executor.executeStoredProcedure(dataSourceId, procedureName, params);
             ctx.body = result;
           } catch (error) {
             ctx.status = 400;
             ctx.body = { error: error.message };
           }
           
           await next();
         },
       },
     });
     
     this.app.resourcer.define({
       name: 'postgresConnector:function',
       actions: {
         async execute(ctx, next) {
           const { dataSourceId, functionName, params } = ctx.action.params;
           const executor = ctx.app.getService('postgresConnector:sqlExecutor');
           
           try {
             const result = await executor.executeFunction(dataSourceId, functionName, params);
             ctx.body = result;
           } catch (error) {
             ctx.status = 400;
             ctx.body = { error: error.message };
           }
           
           await next();
         },
       },
     });
     ```

### Ngày 13-14: Xây dựng tính năng tự động thực thi SQL

1. **Tạo SchedulerService**
   - Xây dựng service quản lý lịch thực thi SQL:
     ```typescript
     // src/server/services/SchedulerService.ts
     import { Service } from '@nocobase/server';
     import cron from 'node-cron';
     
     export class SchedulerService extends Service {
       private jobs = new Map();
       
       async load() {
         // Tải tất cả các scheduled queries từ database
         const scheduledQueries = await this.app.db
           .getRepository('postgresConnector:scheduledQueries')
           .find({
             filter: {
               enabled: true,
               triggerType: 'schedule',
             },
           });
         
         // Khởi tạo các cron jobs
         for (const query of scheduledQueries) {
           this.scheduleQuery(query);
         }
       }
       
       scheduleQuery(query) {
         if (!query.cronExpression || !cron.validate(query.cronExpression)) {
           this.app.logger.error(`Invalid cron expression: ${query.cronExpression}`);
           return;
         }
         
         // Hủy job cũ nếu có
         if (this.jobs.has(query.id)) {
           this.jobs.get(query.id).stop();
         }
         
         // Tạo job mới
         const job = cron.schedule(query.cronExpression, async () => {
           try {
             const executor = this.app.getService('postgresConnector:sqlExecutor');
             const result = await executor.execute(query.dataSource.id, query.sqlQuery);
             
             // Cập nhật kết quả và thời gian thực thi
             await this.app.db
               .getRepository('postgresConnector:scheduledQueries')
               .update({
                 filterByTk: query.id,
                 values: {
                   lastResult: result,
                   lastExecutedAt: new Date(),
                 },
               });
           } catch (error) {
             this.app.logger.error(`Error executing scheduled query ${query.id}: ${error.message}`);
             
             // Cập nhật lỗi
             await this.app.db
               .getRepository('postgresConnector:scheduledQueries')
               .update({
                 filterByTk: query.id,
                 values: {
                   lastResult: { error: error.message },
                   lastExecutedAt: new Date(),
                 },
               });
           }
         });
         
         this.jobs.set(query.id, job);
       }
       
       stopQuery(queryId) {
         if (this.jobs.has(queryId)) {
           this.jobs.get(queryId).stop();
           this.jobs.delete(queryId);
           return true;
         }
         return false;
       }
       
       async reload() {
         // Dừng tất cả các jobs
         for (const job of this.jobs.values()) {
           job.stop();
         }
         this.jobs.clear();
         
         // Tải lại
         await this.load();
       }
     }
     ```

2. **Tạo UI quản lý scheduled queries**
   - Xây dựng giao diện quản lý các truy vấn tự động:
     ```tsx
     // src/client/components/ScheduledQueriesManager.tsx
     import React, { useState, useEffect } from 'react';
     import { Table, Button, Modal, Form, Input, Select, Switch, message } from 'antd';
     import { useAPIClient } from '@nocobase/client';
     import { SQLEditor } from './SQLEditor';
     
     export const ScheduledQueriesManager = () => {
       const [queries, setQueries] = useState([]);
       const [loading, setLoading] = useState(false);
       const [modalVisible, setModalVisible] = useState(false);
       const [form] = Form.useForm();
       const [dataSources, setDataSources] = useState([]);
       const api = useAPIClient();
       
       const fetchQueries = async () => {
         setLoading(true);
         try {
           const response = await api.request({
             url: 'postgresConnector:scheduledQueries:list',
           });
           setQueries(response.data.data);
         } catch (error) {
           message.error('Failed to fetch scheduled queries');
         } finally {
           setLoading(false);
         }
       };
       
       const fetchDataSources = async () => {
         try {
           const response = await api.request({
             url: 'postgresConnector:dataSources:list',
           });
           setDataSources(response.data.data);
         } catch (error) {
           message.error('Failed to fetch data sources');
         }
       };
       
       useEffect(() => {
         fetchQueries();
         fetchDataSources();
       }, []);
       
       const handleCreate = async (values) => {
         try {
           await api.request({
             url: 'postgresConnector:scheduledQueries:create',
             method: 'POST',
             data: values,
           });
           message.success('Scheduled query created successfully');
           setModalVisible(false);
           form.resetFields();
           fetchQueries();
         } catch (error) {
           message.error('Failed to create scheduled query');
         }
       };
       
       const columns = [
         {
           title: 'Title',
           dataIndex: 'title',
           key: 'title',
         },
         {
           title: 'Data Source',
           dataIndex: ['dataSource', 'title'],
           key: 'dataSource',
         },
         {
           title: 'Cron Expression',
           dataIndex: 'cronExpression',
           key: 'cronExpression',
         },
         {
           title: 'Enabled',
           dataIndex: 'enabled',
           key: 'enabled',
           render: (enabled) => (enabled ? 'Yes' : 'No'),
         },
         {
           title: 'Last Executed',
           dataIndex: 'lastExecutedAt',
           key: 'lastExecutedAt',
           render: (date) => date ? new Date(date).toLocaleString() : 'Never',
         },
         {
           title: 'Actions',
           key: 'actions',
           render: (_, record) => (
             <Button
               onClick={() => {
                 // Hiển thị modal chỉnh sửa
               }}
             >
               Edit
             </Button>
           ),
         },
       ];
       
       return (
         <div>
           <Button
             type="primary"
             onClick={() => setModalVisible(true)}
             style={{ marginBottom: 16 }}
           >
             Create Scheduled Query
           </Button>
           
           <Table
             loading={loading}
             dataSource={queries}
             columns={columns}
             rowKey="id"
           />
           
           <Modal
             title="Create Scheduled Query"
             visible={modalVisible}
             onCancel={() => setModalVisible(false)}
             footer={null}
             width={800}
           >
             <Form
               form={form}
               onFinish={handleCreate}
               layout="vertical"
             >
               <Form.Item
                 name="title"
                 label="Title"
                 rules={[{ required: true }]}
               >
                 <Input />
               </Form.Item>
               
               <Form.Item
                 name="dataSourceId"
                 label="Data Source"
                 rules={[{ required: true }]}
               >
                 <Select>
                   {dataSources.map((ds) => (
                     <Select.Option key={ds.id} value={ds.id}>
                       {ds.title}
                     </Select.Option>
                   ))}
                 </Select>
               </Form.Item>
               
               <Form.Item
                 name="sqlQuery"
                 label="SQL Query"
                 rules={[{ required: true }]}
               >
                 <Input.TextArea rows={6} />
               </Form.Item>
               
               <Form.Item
                 name="cronExpression"
                 label="Cron Expression"
                 rules={[{ required: true }]}
               >
                 <Input placeholder="*/5 * * * *" />
               </Form.Item>
               
               <Form.Item
                 name="enabled"
                 label="Enabled"
                 valuePropName="checked"
                 initialValue={true}
               >
                 <Switch />
               </Form.Item>
               
               <Form.Item>
                 <Button type="primary" htmlType="submit">
                   Create
                 </Button>
               </Form.Item>
             </Form>
           </Modal>
         </div>
       );
     };
     ```

## Tuần 3: Hoàn thiện và kiểm thử

### Ngày 15-17: Tích hợp với NocoBase UI và hoàn thiện

1. **Tích hợp với Settings Manager**
   - Đăng ký plugin settings:
     ```typescript
     // src/client/index.tsx
     import { Plugin } from '@nocobase/client';
     import { SettingsPage } from './pages/SettingsPage';
     
     export class PostgresConnectorClient extends Plugin {
       async load() {
         this.app.pluginSettingsManager.add('postgres-connector', {
           title: 'PostgreSQL Connector',
           icon: 'DatabaseOutlined',
           Component: SettingsPage,
         });
       }
     }
     ```

   - Tạo SettingsPage:
     ```tsx
     // src/client/pages/SettingsPage.tsx
     import React from 'react';
     import { Tabs } from 'antd';
     import { DataSourcesManager } from '../components/DataSourcesManager';
     import { ScheduledQueriesManager } from '../components/ScheduledQueriesManager';
     
     export const SettingsPage = () => {
       return (
         <Tabs defaultActiveKey="dataSources">
           <Tabs.TabPane key="dataSources" tab="Data Sources">
             <DataSourcesManager />
           </Tabs.TabPane>
           <Tabs.TabPane key="scheduledQueries" tab="Scheduled Queries">
             <ScheduledQueriesManager />
           </Tabs.TabPane>
         </Tabs>
       );
     };
     ```

2. **Tạo Block cho SQL Editor**
   - Đăng ký block type:
     ```typescript
     // src/client/index.tsx (mở rộng)
     import { SQLEditorBlock } from './blocks/SQLEditorBlock';
     
     export class PostgresConnectorClient extends Plugin {
       async load() {
         // ... code hiện tại
         
         this.app.blockRegistryManager.registerBlockType('postgres-connector:sql-editor', {
           title: 'SQL Editor',
           description: 'Execute SQL queries on PostgreSQL or MySQL',
           category: 'data',
           icon: 'CodeOutlined',
           component: SQLEditorBlock,
           properties: {
             dataSourceId: {
               type: 'string',
               title: 'Data Source',
               'x-decorator': 'FormItem',
               'x-component': 'Select',
               'x-component-props': {
                 placeholder: 'Select a data source',
               },
               enum: '{{useDataSources()}}',
             },
           },
         });
       }
     }
     ```

   - Tạo SQLEditorBlock:
     ```tsx
     // src/client/blocks/SQLEditorBlock.tsx
     import React from 'react';
     import { Card } from 'antd';
     import { useBlockProps } from '@nocobase/client';
     import { SQLEditor } from '../components/SQLEditor';
     import { ResultsTable } from '../components/ResultsTable';
     
     export const SQLEditorBlock = () => {
       const { dataSourceId } = useBlockProps();
       const [results, setResults] = useState(null);
       
       return (
         <Card title="SQL Editor">
           <SQLEditor
             dataSourceId={dataSourceId}
             onResults={setResults}
           />
           {results && <ResultsTable results={results} />}
         </Card>
       );
     };
     ```

### Ngày 18-20: Kiểm thử và sửa lỗi

1. **Viết test cases**
   - Tạo test cho DatabaseService:
     ```typescript
     // __tests__/server/services/DatabaseService.test.ts
     import { DatabaseService } from '../../../src/server/services/DatabaseService';
     import { mockApp } from '../../helpers';
     
     describe('DatabaseService', () => {
       let service;
       
       beforeEach(() => {
         service = new DatabaseService(mockApp);
       });
       
       it('should connect to PostgreSQL', async () => {
         // Mock implementation
       });
       
       it('should connect to MySQL', async () => {
         // Mock implementation
       });
       
       it('should throw error for unsupported database type', async () => {
         // Mock implementation
       });
     });
     ```

   - Tạo test cho SQLExecutor:
     ```typescript
     // __tests__/server/services/SQLExecutor.test.ts
     import { SQLExecutor } from '../../../src/server/services/SQLExecutor';
     import { mockApp } from '../../helpers';
     
     describe('SQLExecutor', () => {
       let service;
       
       beforeEach(() => {
         service = new SQLExecutor(mockApp);
       });
       
       it('should execute SQL query on PostgreSQL', async () => {
         // Mock implementation
       });
       
       it('should execute SQL query on MySQL', async () => {
         // Mock implementation
       });
       
       it('should handle errors', async () => {
         // Mock implementation
       });
     });
     ```

2. **Kiểm thử thủ công**
   - Kiểm tra tất cả các tính năng:
     - Thêm/sửa/xóa nguồn dữ liệu
     - Thực thi câu lệnh SQL
     - Thực thi procedure, function
     - Lên lịch và thực thi tự động

3. **Sửa lỗi và tối ưu hóa**
   - Xử lý các lỗi phát hiện trong quá trình kiểm thử
   - Tối ưu hóa hiệu suất
   - Cải thiện UX/UI

### Ngày 21: Hoàn thiện tài liệu và đóng gói

1. **Viết tài liệu hướng dẫn**
   - Tạo README.md với hướng dẫn cài đặt và sử dụng
   - Viết tài liệu API
   - Viết hướng dẫn sử dụng cho người dùng cuối

2. **Đóng gói plugin**
   - Build plugin: `yarn build`
   - Tạo package: `yarn pack`

## Tổng kết

Lộ trình kỹ thuật này cung cấp một kế hoạch chi tiết để phát triển plugin `postgres-connector` cho NocoBase trong vòng 3 tuần. Plugin sẽ cho phép người dùng kết nối và tương tác với các cơ sở dữ liệu PostgreSQL và MySQL, thực thi câu lệnh SQL, procedure, function, và lên lịch thực thi tự động.

Các công nghệ chính được sử dụng:
- **NocoBase Plugin API**: Để tích hợp với nền tảng NocoBase
- **PostgreSQL & MySQL Clients**: Để kết nối và tương tác với cơ sở dữ liệu
- **React & Ant Design**: Để xây dựng giao diện người dùng
- **Node-cron**: Để lên lịch thực thi tự động

Sau khi hoàn thành, plugin này sẽ mở rộng đáng kể khả năng của NocoBase trong việc tích hợp và tương tác với các hệ thống cơ sở dữ liệu bên ngoài.