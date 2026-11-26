import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// Basispfad für GitHub Pages: aus dem Repository-Namen ableiten
// (gschmalzhaf-cell/Lieder-Editor -> /Lieder-Editor/). Lokal bleibt es '/'.
const repoName = process.env.GITHUB_REPOSITORY?.split('/')[1];
const base = repoName ? `/${repoName}/` : '/';

export default defineConfig({
  base,
  plugins: [react()],
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx'],
  },
});
