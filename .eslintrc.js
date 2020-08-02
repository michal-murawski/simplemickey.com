module.exports = {
  extends: ['eslint:recommended', 'plugin:prettier/recommended', 'preact'],
  rules: {
    // 'no-console': 'error',
    'no-unused-vars': 'error',
    'no-var-requires': 'off',
    'explicit-function-return-type': 'off',
    'react/prop-types': 'off',
    'react-hooks/exhaustive-deps': ['warn'],
  },
  ignorePatterns: ['node_modules/', 'build/'],
};
