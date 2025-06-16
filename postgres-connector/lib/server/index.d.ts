import { Plugin } from '@nocobase/server';
export declare class PostgresConnectorPlugin extends Plugin {
    afterAdd(): Promise<void>;
    beforeLoad(): Promise<void>;
    load(): Promise<void>;
    install(): Promise<void>;
    afterEnable(): Promise<void>;
    afterDisable(): Promise<void>;
    remove(): Promise<void>;
}
export default PostgresConnectorPlugin;
//# sourceMappingURL=index.d.ts.map