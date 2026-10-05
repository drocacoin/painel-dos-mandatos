// Regras de qualidade de código. Rode com: npm run lint
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import astro from 'eslint-plugin-astro';

export default [
  { ignores: ['dist/', '.astro/', 'coverage/'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...astro.configs.recommended,
  {
    rules: {
      // Acusa espaços invisíveis (NBSP, BOM) também dentro de textos: use códigos como
      // String.fromCharCode(0xa0) ou "\u00A0", nunca o caractere invisível em si.
      'no-irregular-whitespace': ['error', { skipStrings: false, skipTemplates: false }],
    },
  },
];
