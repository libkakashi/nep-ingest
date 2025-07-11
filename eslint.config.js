import {dirname} from 'path';
import {fileURLToPath} from 'url';
import {FlatCompat} from '@eslint/eslintrc';
// eslint-disable-next-line n/no-extraneous-import
import js from '@eslint/js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
});

const eslintConfig = [
  {
    ignores: ['.next/**'],
  },
  ...compat.extends('./node_modules/gts/'),
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
];

export default eslintConfig;
