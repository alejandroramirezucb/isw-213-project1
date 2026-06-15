import js from '@eslint/js';
import sonarjs from 'eslint-plugin-sonarjs';

export default [
  {
    ignores: ['node_modules/**', '**/*.min.js', 'dist/**']
  },
  {
    files: ['**/*.js', '**/*.jsx'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        console: 'readonly',
        window: 'readonly',
        document: 'readonly',
        localStorage: 'readonly',
        fetch: 'readonly',
        CustomEvent: 'readonly',
        navigator: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        confirm: 'readonly',
        process: 'readonly',
        require: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly'
      }
    },
    plugins: {
      sonarjs: sonarjs
    },
    rules: {
      ...js.configs.recommended.rules,
      ...sonarjs.configs.recommended.rules,
      'sonarjs/cognitive-complexity': ['warn', 15],
      'sonarjs/no-duplicate-string': ['warn', { threshold: 5 }],
      'sonarjs/no-duplicated-branches': 'warn',
      'sonarjs/no-identical-functions': 'warn',
      'sonarjs/no-inverted-boolean-check': 'warn',
      'sonarjs/no-nested-template-literals': 'warn',
      'sonarjs/no-small-switch': 'warn',
      'sonarjs/no-unused-collection': 'warn',
      'no-var': 'warn',
      'prefer-const': 'warn',
      'no-magic-numbers': ['warn', { ignore: [-1, 0, 1, 2], ignoreArrayIndexes: true }],
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-empty-function': 'warn',
      'complexity': ['warn', 10],
      'max-lines-per-function': ['warn', { max: 50, skipBlankLines: true, skipComments: true }],
      'max-nested-callbacks': ['warn', 3],
      'no-console': 'off',
      'camelcase': ['warn', { properties: 'never' }],
      'id-length': ['warn', { min: 3, exceptions: ['i', 'j', 'k', 'x', 'y', 'z', 'id', 'to', '_', 'a', 'b'] }],
      'max-lines': ['warn', { max: 300, skipBlankLines: true, skipComments: true }],
      'no-commented-out-code': 'off'
    }
  },
  {
    files: ['**/*.test.js', '**/*.spec.js'],
    rules: {
      'no-magic-numbers': 'off',
      'max-lines-per-function': 'off',
      'no-unused-vars': 'off'
    }
  }
];
