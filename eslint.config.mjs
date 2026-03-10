import { defineConfig } from 'eslint/config';
import globals from 'globals';
import js from '@eslint/js';
import ts from 'typescript-eslint';
import astro from 'eslint-plugin-astro';
import prettier from 'eslint-plugin-prettier';
import perfectionist from 'eslint-plugin-perfectionist'

const tsParser = ts.parser;
const astroParser = astro.parser;

export default defineConfig([
	{
		languageOptions: {
			globals: {
				...globals.browser,
				...globals.node,
			},
		},
	},

	js.configs.recommended,
	...ts.configs.recommended,
	{
		plugins: {
			prettier: prettier,
			perfectionist
		},
		rules: {
			'prettier/prettier': 'warn',
		},
	},
	astro.configs.recommended,
	astro.configs['jsx-a11y-recommended'],
	{
		files: ['**/*.astro', '*/*.js', '**/*.ts'],
		languageOptions: {
			parser: astroParser,
			parserOptions: {
				parser: tsParser,
				extraFileExtensions: ['.astro'],
				sourceType: 'module',
				ecmaVersion: 'latest',
				project: './tsconfig.json',
			},
		},
		rules: {
			'no-undef': 'off',
			'@typescript-eslint/no-explicit-any': 'off',
			'perfectionist/sort-imports': 'error',

		},
	},
	{
		ignores: ['dist/**', '**/*.d.ts', 'node_modules'],
	},
]);
