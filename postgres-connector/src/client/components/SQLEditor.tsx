import React, { useState } from 'react';
import { Button, Card, Space, message, Spin, Table, Tabs } from 'antd';
import { useTranslation } from 'react-i18next';
import { useAPIClient } from '@nocobase/client';
import CodeMirror from '@uiw/react-codemirror';
import { sql } from '@codemirror/lang-sql';
import { dracula } from '@uiw/codemirror-theme-dracula';

interface SQLEditorProps {
  dataSourceId: string;
  initialValue?: string;
  onExecute?: (results: any) => void;
}

export const SQLEditor: React.FC<SQLEditorProps> = ({
  dataSourceId,
  initialValue = '',
  onExecute,
}) => {
  const { t } = useTranslation();
  const api = useAPIClient();
  const [sqlQuery, setSqlQuery] = useState(initialValue);
  const [executing, setExecuting] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('editor');
  
  const handleExecute = async () => {
    if (!sqlQuery.trim()) {
      message.error(t('SQL query cannot be empty'));
      return;
    }
    
    setExecuting(true);
    setError(null);
    
    try {
      const response = await api.request({
        url: 'postgresConnector:execute:execute',
        method: 'post',
        data: {
          dataSourceId,
          sql: sqlQuery,
        },
      });
      
      const result = response.data;
      setResults(result);
      setActiveTab('results');
      
      if (onExecute) {
        onExecute(result);
      }
      
      message.success(t('Query executed successfully'));
    } catch (err: any) {
      console.error('SQL execution error:', err);
      setError(err.response?.data?.error || err.message || t('Query execution failed'));
      setActiveTab('results');
      message.error(t('Query execution failed'));
    } finally {
      setExecuting(false);
    }
  };
  
  const renderResults = () => {
    if (error) {
      return (
        <div className="sql-error">
          <h3>{t('Error')}</h3>
          <pre>{error}</pre>
        </div>
      );
    }
    
    if (!results) {
      return (
        <div className="sql-no-results">
          <p>{t('No results yet. Execute a query to see results.')}</p>
        </div>
      );
    }
    
    if (!results.rows || !results.rows.length) {
      return (
        <div className="sql-empty-results">
          <p>
            {t('Query executed successfully. No rows returned.')}
            {results.rowCount !== undefined && (
              <span> {t('Affected rows')}: {results.rowCount}</span>
            )}
          </p>
          <p>
            {t('Execution time')}: {results.executionTime}ms
          </p>
        </div>
      );
    }
    
    // Extract columns from the first row
    const columns = Object.keys(results.rows[0]).map(key => ({
      title: key,
      dataIndex: key,
      key,
      render: (text: any) => {
        if (text === null) return <span className="null-value">NULL</span>;
        if (typeof text === 'object') return JSON.stringify(text);
        return String(text);
      },
    }));
    
    return (
      <div className="sql-results">
        <div className="sql-results-meta">
          <p>
            {t('Rows')}: {results.rows.length}
            {results.rowCount !== undefined && results.rowCount !== results.rows.length && (
              <span> ({t('Total')}: {results.rowCount})</span>
            )}
            <span> | {t('Execution time')}: {results.executionTime}ms</span>
          </p>
        </div>
        
        <Table
          columns={columns}
          dataSource={results.rows.map((row: any, index: number) => ({ ...row, key: index }))}
          scroll={{ x: 'max-content' }}
          size="small"
          pagination={{ pageSize: 50 }}
        />
      </div>
    );
  };
  
  return (
    <Card bordered={false}>
      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <Tabs.TabPane tab={t('Editor')} key="editor">
          <div className="sql-editor-container">
            <CodeMirror
              value={sqlQuery}
              height="300px"
              extensions={[sql()]}
              theme={dracula}
              onChange={(value) => setSqlQuery(value)}
            />
            
            <div className="sql-editor-actions" style={{ marginTop: 16 }}>
              <Space>
                <Button
                  type="primary"
                  onClick={handleExecute}
                  loading={executing}
                >
                  {t('Execute')}
                </Button>
                <Button
                  onClick={() => setSqlQuery('')}
                  disabled={!sqlQuery}
                >
                  {t('Clear')}
                </Button>
              </Space>
            </div>
          </div>
        </Tabs.TabPane>
        
        <Tabs.TabPane tab={t('Results')} key="results">
          {executing ? (
            <div className="sql-loading">
              <Spin tip={t('Executing query...')} />
            </div>
          ) : (
            renderResults()
          )}
        </Tabs.TabPane>
      </Tabs>
    </Card>
  );
}; 