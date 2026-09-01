import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';
import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';

// eslint-config-next já é flat config nativo, mas com `files` genéricos
// (**/*.tsx, etc.) — precisa ser restrito a apps/web/, senão as regras de
// React/Next (e o parser Babel do primeiro bloco) vazam pro resto do monorepo.
function scopedToWeb(configs) {
  return configs.map((c) => {
    if (c.ignores && !c.files) {
      return { ...c, ignores: c.ignores.map((p) => `apps/web/${p}`) };
    }
    return { ...c, files: (c.files ?? ['**/*']).map((f) => `apps/web/${f}`) };
  });
}

export default tseslint.config(
  {
    ignores: ['**/dist/**', '**/.next/**', '**/node_modules/**', '**/coverage/**'],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...scopedToWeb(nextCoreWebVitals),
  prettier,
  {
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },
  {
    // App Router puro, sem pages/ — a regra assume Pages Router e erra
    // procurando esse diretório a partir do cwd (raiz do monorepo).
    files: ['apps/web/**'],
    rules: {
      '@next/next/no-html-link-for-pages': 'off',
    },
  },
);
