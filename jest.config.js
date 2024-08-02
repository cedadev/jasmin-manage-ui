module.exports = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.jsx?$': 'babel-jest',
    '\\.css(.ts)?$': './cssTransformer.js',
  },
  transformIgnorePatterns: ['[/\\\\]node_modules[/\\\\].+\\.(?!css)$'],
  moduleDirectories: ['node_modules', 'src'],
  moduleNameMapper: {
    '^react-bootstrap-notify$': '<rootDir>/node_modules/react-bootstrap-notify',
  },
};