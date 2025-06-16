// Type definitions for NocoBase plugin development
// These are temporary definitions until proper @nocobase types are available

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

// Extend global types to fix compilation
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: 'development' | 'production' | 'test';
    }
  }
} 