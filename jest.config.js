/** @type {import('jest').Config} */
const config = {
  clearMocks: true,
  collectCoverage: true,
  coverageDirectory: "coverage",
  coverageProvider: "v8",
  testEnvironment: "node",
  preset: 'ts-jest',
  moduleDirectories: [
    "node_modules", 
    "<rootDir>",
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^@/lib/(.*)$': '<rootDir>/lib/$1',
    '^@/models$': '<rootDir>/models/index.ts',
    '^@/models/(.*)$': '<rootDir>/models/$1'
  },
  rootDir: ".",
  testMatch: [
    "**/__tests__/**/*.(test|spec).(ts|js)",
    "**/*.(test|spec).(ts|js)"
  ],
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
  setupFilesAfterEnv: ['<rootDir>/__tests__/setup.ts'],
};

module.exports = config;