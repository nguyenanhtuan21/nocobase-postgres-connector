import React, { useState, useEffect } from 'react';
import { useTranslation, useAPIClient } from '@nocobase/client';
import { SQLEditor } from '../components';
import { Card, Select, Alert, Typography, Spin } from 'antd';

const { Title } = Typography;

const QueryEditorPage = () => {
  const { t } = useTranslation();
  const api = useAPIClient();
  
  const [loading, setLoading] = useState(false);
  const [dataSources, setDataSources] = useState<any[]>([]);
  const [selectedDataSource, setSelectedDataSource] = useState<string | null>(null);
  
  // Fetch data sources
  useEffect(() => {
    const fetchDataSources = async () => {
      setLoading(true);
      
      try {
        const response = await api.resource('postgresConnector:dataSources').list({
          filter: {
            enabled: true,
          },
        });
        
        if (response.data && response.data.data) {
          setDataSources(response.data.data);
          
          // Auto-select the first data source if available
          if (response.data.data.length > 0 && !selectedDataSource) {
            setSelectedDataSource(response.data.data[0].id);
          }
        }
      } catch (error) {
        console.error('Error fetching data sources:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDataSources();
  }, [api, t]);
  
  const handleDataSourceChange = (value: string) => {
    setSelectedDataSource(value);
  };
  
  return (
    <Card title={t('SQL Query Editor')}>
      <div style={{ marginBottom: 16 }}>
        <Title level={5}>{t('Select Data Source')}</Title>
        <Select
          placeholder={t('Select a data source')}
          style={{ width: '100%', maxWidth: 400 }}
          onChange={handleDataSourceChange}
          value={selectedDataSource}
          loading={loading}
        >
          {dataSources.map((ds: any) => (
            <Select.Option key={ds.id} value={ds.id}>
              {ds.title} ({ds.type === 'postgres' ? 'PostgreSQL' : 'MySQL'})
            </Select.Option>
          ))}
        </Select>
      </div>
      
      {loading ? (
        <div style={{ padding: '40px 0', textAlign: 'center' }}>
          <Spin tip={t('Loading data sources...')} />
        </div>
      ) : dataSources.length === 0 ? (
        <Alert
          message={t('No Data Sources Available')}
          description={t('Please create a data source first before using the query editor.')}
          type="info"
          showIcon
        />
      ) : selectedDataSource ? (
        <SQLEditor
          dataSourceId={selectedDataSource}
          initialValue="SELECT * FROM "
        />
      ) : (
        <Alert
          message={t('Select a Data Source')}
          description={t('Please select a data source to start querying.')}
          type="info"
          showIcon
        />
      )}
    </Card>
  );
};

export default QueryEditorPage; 