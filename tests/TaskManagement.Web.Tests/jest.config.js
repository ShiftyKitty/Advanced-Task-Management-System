const path = require('path');

module.exports = {
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.(js|jsx)$': 'babel-jest'
  },
  moduleNameMapper: {
    '^react$': path.resolve(__dirname, '../../src/TaskManagement.Web/node_modules/react'),
    '^react-dom$': path.resolve(__dirname, '../../src/TaskManagement.Web/node_modules/react-dom'),
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|webp|svg)$': '<rootDir>/__mocks__/fileMock.js'
  },
  setupFilesAfterEnv: ['<rootDir>/setupJest.js'],
  testPathIgnorePatterns: ['/node_modules/']
};
