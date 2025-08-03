const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './'
})

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  setupFiles: ['<rootDir>/jest.env.ts'],
  
  testEnvironment: 'node',
  maxWorkers: 1,
  
  moduleNameMapper: {
    '^@/components/(.*)$': '<rootDir>/components/$1',
    '^@/pages/(.*)$': '<rootDir>/pages/$1',
    '^@/lib/(.*)$': '<rootDir>/lib/$1',
    '^@/models/(.*)$': '<rootDir>/models/$1'
  },
  
  testMatch: [
    '**/__tests__/**/*.(test|spec).(js|jsx|ts|tsx)',
    '**/__tests__/**/*-tests.(js|jsx|ts|tsx)'
  ],
  
  collectCoverage: true,
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'pages/api/**/*.{js,ts}',
    'lib/**/*.{js,ts}',
    'models/**/*.{js,ts}',
    '!**/*.d.ts'
  ],
  
  coverageThreshold: {
    global: {
      statements: 25,
      branches: 25,
      functions: 25,
      lines: 25
    }
  },
  
  testTimeout: 60000,
  
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest'
  },
  
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json']
}

module.exports = createJestConfig(customJestConfig)