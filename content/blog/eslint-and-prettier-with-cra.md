---
title: Eslint and prettier with CRA
date: 2020-07-26T11:11:16.363Z
tags: react,eslint,prettier
---
## Depencdencies

* husky
* lint-staged
* eslint-config-prettier
* eslint-config-react
* eslint-config-react-app
* eslint-plugin-prettier
* @typescript-eslint/eslint-plugin
* @typescript-eslint/parser
* prettier
* pretty-quick



## Eslint config files

Base eslint file with our common rules and settings:

**.eslintrc.js**

```json
module.exports = {
  parser: '@typescript-eslint/parser',
  extends: [
    'react-app',
    'plugin:@typescript-eslint/recommended',
    'prettier/@typescript-eslint',
    'plugin:prettier/recommended',
  ],
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: 'module',
  },
  rules: {
    'no-unused-vars': 'warn',
    '@typescript-eslint/no-var-requires': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/ban-ts-ignore': 'off',
    '@typescript-eslint/no-empty-interface': 'off',
    'react/prop-types': 'off',
    'react-hooks/exhaustive-deps': [
      'warn',
      {
        additionalHooks: 'useAutorun',
      },
    ],
  },
  ignorePatterns: ['node_modules/', 'build/'],
  settings: {
    react: {
      version: 'detect',
    },
  },
};

```



Then we can create another **.eslintrc.commit.js** which extends our basic rules. 

```json
module.exports = {
  extends: ['.eslintrc.js'],
  rules: {
    'no-console': 'error',
    'no-debugger': 'error',
  },
};

```

This way we can create many different **eslint** configs and extend them as we wish for different purposes.



## Scripts

Add to your `scripts`: 

```
"lint:commit": "tsc --noEmit && eslint \"*/**/*.{js,ts,tsx}\" --fix -c .eslintrc.commit.js"

// You can add different lint commands for different files (styles, files, etc.)
```

Then add this **keys** to your `package.json` file.

```json
"lint-staged": {
    "**/*.(ts|tsx|js)": [
      "pretty-quick --staged",
      "npm run lint:commit",
      "git add"
    ]
  },
  "husky": {
    "hooks": {
      "pre-commit": "tsc --noEmit && lint-staged --debug"
    }
  },
```

## Customize CRA

Add to your **.env.development/local** file `EXTEND_ESLINT=true`. 



That should do the job :)