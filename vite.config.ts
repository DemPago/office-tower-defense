import { defineConfig, Plugin } from 'vite';
import { resolve, dirname } from 'path';
import { existsSync } from 'fs';
import { fileURLToPath } from 'url';

// Durante la migrazione incrementale a TypeScript, i file .js importano ancora
// altri moduli con estensione .js anche se sono stati rinominati in .ts.
// Questo plugin intercetta queste richieste e le reindirizza al .ts corrispondente.
function resolveJsToTs(): Plugin {
  return {
    name: 'resolve-js-to-ts',
    resolveId(source, importer) {
      if (!source.endsWith('.js') || !importer) return null;
      const importerDir = dirname(importer.startsWith('file://') ? fileURLToPath(importer) : importer);
      const tsPath = resolve(importerDir, source.replace(/\.js$/, '.ts'));
      return existsSync(tsPath) ? tsPath : null;
    },
  };
}

export default defineConfig({
  base: '/office-tower-defense/',
  plugins: [resolveJsToTs()],
  build: {
    target: 'es2022',
    assetsInlineLimit: 0, // non inlineare mai i file — il video deve restare un file separato
  },
});
