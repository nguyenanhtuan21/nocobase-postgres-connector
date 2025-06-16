export interface NocoBaseApp {
    db: any;
    logger: any;
    resourcer: any;
    addService(name: string, service: any): void;
    getService(name: string): any;
}
export interface NocoBaseContext {
    app: NocoBaseApp;
    action: {
        params: any;
    };
    body: any;
    status: number;
}
export interface NocoBaseService {
    app: NocoBaseApp;
}
declare global {
    namespace NodeJS {
        interface ProcessEnv {
            NODE_ENV: 'development' | 'production' | 'test';
        }
    }
}
//# sourceMappingURL=types.d.ts.map