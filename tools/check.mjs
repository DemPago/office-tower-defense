// Controllo rapido senza browser:
//  1) sintassi di tutti i file in src/
//  2) ogni nome importato da un altro file deve esserne davvero esportato
//  3) per gli import "* as nome", ogni nome.funzione usata deve esistere
//   node tools/check.mjs
import { readFileSync, readdirSync, statSync } from 'fs';
import { execFileSync } from 'child_process';
import { join, dirname, resolve } from 'path';

const root = resolve(dirname(new URL(import.meta.url).pathname), '../src');
const files = [];
(function walk(d) {
  for (const f of readdirSync(d)) {
    const p = join(d, f);
    if (statSync(p).isDirectory()) walk(p);
    else if (p.endsWith('.js')) files.push(p);
  }
})(root);

let errors = 0;
const exportsOf = new Map();
function exportsFor(path) {
  if (!exportsOf.has(path)) {
    const src = readFileSync(path, 'utf8');
    const names = new Set();
    for (const m of src.matchAll(/export\s+(?:async\s+)?(?:function|const|let|class)\s+([A-Za-z_$][\w$]*)/g)) names.add(m[1]);
    for (const m of src.matchAll(/export\s*\{([^}]*)\}/g)) m[1].split(',').forEach(n => n.trim() && names.add(n.trim().split(/\s+as\s+/).pop()));
    exportsOf.set(path, names);
  }
  return exportsOf.get(path);
}

for (const file of files) {
  try {
    execFileSync(process.execPath, ['--check', file], { stdio: 'pipe' });
  } catch (e) {
    errors++;
    console.log(`✗ sintassi: ${file}\n${e.stderr}`);
    continue;
  }
  const src = readFileSync(file, 'utf8');
  for (const m of src.matchAll(/import\s*\{([^}]*)\}\s*from\s*'(\.[^']+)'/g)) {
    const target = resolve(dirname(file), m[2]);
    const names = exportsFor(target);
    for (const raw of m[1].split(',')) {
      const name = raw.trim().split(/\s+as\s+/)[0];
      if (name && !names.has(name)) { errors++; console.log(`✗ ${file.replace(root, 'src')}: '${name}' non è esportato da ${m[2]}`); }
    }
  }
  for (const m of src.matchAll(/import\s*\*\s*as\s+(\w+)\s+from\s*'(\.[^']+)'/g)) {
    const names = exportsFor(resolve(dirname(file), m[2]));
    for (const use of src.matchAll(new RegExp(`(?<![/\\w])${m[1]}\\.(\\w+)`, 'g'))) {
      if (!names.has(use[1])) { errors++; console.log(`✗ ${file.replace(root, 'src')}: '${m[1]}.${use[1]}' non esiste in ${m[2]}`); }
    }
  }
}
console.log(errors ? `\n${errors} problemi trovati` : `✓ ${files.length} file controllati, nessun problema`);
process.exit(errors ? 1 : 0);
