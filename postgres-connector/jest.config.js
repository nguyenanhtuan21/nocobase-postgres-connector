module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testPathIgnorePatterns: ['/node_modules/', '/lib/'],
  collectCoverage: true,
  collectCoverageFrom: ['src/**/*.ts'],
  coveragePathIgnorePatterns: ['/node_modules/', '/lib/', '/dist/'],
  coverageReporters: ['text', 'lcov'],
  testTimeout: 30000,
}; 