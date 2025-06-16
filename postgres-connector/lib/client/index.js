"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PostgresConnectorClient = void 0;
const client_1 = require("@nocobase/client");
class PostgresConnectorClient extends client_1.Plugin {
    async load() {
        // Register client-side components, pages, and routes
        console.log('PostgreSQL Connector Client Plugin loaded');
    }
}
exports.PostgresConnectorClient = PostgresConnectorClient;
exports.default = PostgresConnectorClient;
//# sourceMappingURL=index.js.map