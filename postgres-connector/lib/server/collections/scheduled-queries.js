"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("@nocobase/database");
exports.default = (0, database_1.defineCollection)({
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
//# sourceMappingURL=scheduled-queries.js.map