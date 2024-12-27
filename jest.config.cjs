module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  transform: {
     "^.+\\.jsx?$": "babel-jest"
  },
  transformIgnorePatterns: ['node_modules/(?!@camelcase)/']
};
