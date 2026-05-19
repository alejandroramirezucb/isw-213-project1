module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  collectCoverage: true,
  collectCoverageFrom: [
    'server/**/*.js',
    '!server/index.js',
    '!server/db.js',
    '!server/utils.js',
    '!server/repositorios/**',
    '!server/servicios/**',
    '!server/controladores/**'
  ],
  coveragePathIgnorePatterns: ['/node_modules/', '/tests/'],
  coverageReporters: ['text', 'text-summary', 'html', 'lcov', 'json'],
  coverageDirectory: './coverage'
};
