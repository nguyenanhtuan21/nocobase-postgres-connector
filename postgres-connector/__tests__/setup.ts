// Test setup file
// Configure global test environment

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn(),
  info: jest.fn(),
  log: jest.fn(),
};

// Set test timeout
jest.setTimeout(10000);

// Mock environment variables for tests
process.env.NODE_ENV = 'test';

// Placeholder test to avoid Jest error
describe('Placeholder test', () => {
  it('should pass', () => {
    expect(true).toBe(true);
  });
}); 