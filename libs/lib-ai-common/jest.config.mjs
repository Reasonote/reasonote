// Add any custom config to be passed to Jest
/** @type {import('jest').Config} */
const config = {
  // Add more setup options before each test is run
  // setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
 
  testEnvironment: 'node',
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.[jt]s?(x)', '**/?(*.)+(spec|test).[tj]s?(x)'],
  // moduleNameMapper: {
  //   '^eventsource-parser/stream$': '<rootDir>/__mocks__/eventsource-parser-stream-mock.js',
  // },
}
 
// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
export default {
  ...config,
  // Add any custom config here
  // For example, you can ignore some tests
  // testPathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/.next/'],
}