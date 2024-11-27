// Configuration for Jest tests
module.exports = {
  // Specify file paths Jest will execute after the test env is set up but before code runs
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  // Simulates browser-like environment within Node.js to test React components
  testEnvironment: 'jsdom',
  // Specify how different files should be transformed before being tested so Jest can understand them
  transform: {
    '^.+\\.jsx?$': 'babel-jest', // javascript and react files
    '\\.css(.ts)?$': './cssTransformer.js', // css files
  },
};