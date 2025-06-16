// Simplified base service for testing business logic
export class SimpleService {
  constructor(protected app?: any) {}
  
  protected get logger() {
    return {
      info: (message: string, data?: any) => console.log('INFO:', message, data),
      error: (message: string, data?: any) => console.error('ERROR:', message, data),
      warn: (message: string, data?: any) => console.warn('WARN:', message, data),
    };
  }
} 