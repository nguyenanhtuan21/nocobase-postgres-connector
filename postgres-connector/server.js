const { Plugin } = require('@nocobase/server');
const PostgresConnectorPlugin = require('./lib/server').default;

module.exports = PostgresConnectorPlugin; 