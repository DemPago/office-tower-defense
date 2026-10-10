import { defineConfig } from 'vite';

export default defineConfig({
  base: '/office-tower-defense/',
  build: {
    target: 'es2022',
    assetsInlineLimit: 0, // non inlineare mai i file — il video deve restare un file separato
  },
});
