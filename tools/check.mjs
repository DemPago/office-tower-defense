// Controllo rapido senza browser:
//  1) sintassi di tutti i file in src/
//  2) ogni nome importato da un altro file deve esserne davvero esportato
//  3) per gli import "* as nome", ogni nome.funzione usata deve esistere
//  4) ogni funzione/costante usata in un file deve essere definita lì o importata
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
  for (const m of src.matchAll(/(?:import|export)\s*\{([^}]*)\}\s*from\s*'(\.[^']+)'/g)) {
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
// 4) nomi usati ma mai definiti né importati nel file (es. funzione spostata in un altro modulo)
const GLOBALS = new Set(('Math JSON Object Array Number String Boolean Date Map Set WeakMap Promise Error TypeError ' +
  'console window document location navigator localStorage performance requestAnimationFrame setTimeout clearTimeout ' +
  'setInterval clearInterval addEventListener removeEventListener innerWidth innerHeight devicePixelRatio matchMedia ' +
  'fetch URL Image AudioContext Uint8ClampedArray Infinity NaN isNaN parseInt parseFloat undefined null true false ' +
  'this new return if else for while do const let var function class extends import export from as of in typeof ' +
  'instanceof void delete throw try catch finally switch case default break continue async await yield super static get set ' +
  'process globalThis').split(' '));
for (const file of files) {
  const src = readFileSync(file, 'utf8')
    .replace(/\/\/.*$/gm, '')                         // commenti di riga
    .replace(/\/\*[\s\S]*?\*\//g, '')                  // commenti a blocco
    .replace(/'(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*"/g, '""')  // stringhe semplici
    .replace(/`(?:\\.|\$\{(?:[^{}]|\{[^{}]*\})*\}|[^`\\])*`/g, m =>            // template: si tengono solo i ${...}
      (m.match(/\$\{((?:[^{}]|\{[^{}]*\})*)\}/g) || []).join(' ; '));
  // nomi definiti nel file: import, const/let/var/function/class, parametri, destrutturazioni
  const defined = new Set();
  for (const m of src.matchAll(/import\s*\{([^}]*)\}/g)) m[1].split(',').forEach(n => { const p = n.trim().split(/\s+as\s+/); if (p[0]) defined.add((p[1] || p[0]).trim()); });
  for (const m of src.matchAll(/import\s*\*\s*as\s+(\w+)/g)) defined.add(m[1]);
  // riesporti: export { a, b } from './file.js' (i nomi passano attraverso, non vanno definiti qui)
  for (const m of src.matchAll(/export\s*\{([^}]*)\}\s*from/g)) m[1].split(',').forEach(n => { const p = n.trim().split(/\s+as\s+/); if (p[0]) defined.add((p[1] || p[0]).trim()); });
  for (const m of src.matchAll(/\b(?:const|let|var|function|class)\s+([A-Za-z_$][\w$]*)/g)) defined.add(m[1]);
  // dichiarazioni multiple: const A = 1, B = 2
  for (const m of src.matchAll(/\b(?:const|let|var)\s+([^;\n]*)/g)) for (const d of m[1].matchAll(/(?:^|,)\s*([A-Za-z_$][\w$]*)\s*=/g)) defined.add(d[1]);
  // metodi negli oggetti: nome(...) {  → non sono chiamate
  for (const m of src.matchAll(/^\s*([A-Za-z_$][\w$]*)\s*\([^)]*\)\s*\{/gm)) defined.add(m[1]);
  for (const m of src.matchAll(/\b(?:const|let|var)\s*[{[]([^}\]=]*)[}\]]/g)) m[1].split(',').forEach(n => { const p = n.split(':').pop().split('=')[0].trim().replace('...', ''); if (p) defined.add(p); });
  for (const m of src.matchAll(/function\s*\w*\s*\(([^)]*)\)/g)) m[1].split(/[,{}[\]=\s:.]+/).forEach(n => n && defined.add(n));
  for (const m of src.matchAll(/(?:\(([^()]*)\)|\b([A-Za-z_$][\w$]*))\s*=>/g)) (m[1] || m[2] || '').split(/[,{}[\]=\s:.]+/).forEach(n => n && defined.add(n));
  for (const m of src.matchAll(/\bfor\s*\(\s*(?:const|let|var)\s*[[{]?([^;)]*?)[\]}]?\s+(?:of|in)\b/g)) m[1].split(/[,\s:]+/).forEach(n => n && defined.add(n));
  for (const m of src.matchAll(/catch\s*\((\w+)\)/g)) defined.add(m[1]);
  // nomi chiamati come funzione o usati come valore "libero" (non dopo un punto, non come chiave)
  const missing = new Set();
  for (const m of src.matchAll(/(?<![\w$.'"`])([A-Za-z_$][\w$]*)\s*\(/g)) if (!defined.has(m[1]) && !GLOBALS.has(m[1])) missing.add(m[1]);
  for (const m of src.matchAll(/(?<![\w$.'"`])([A-Z][A-Z0-9_]{1,})\b(?!\s*:)/g)) if (!defined.has(m[1]) && !GLOBALS.has(m[1])) missing.add(m[1]);
  for (const n of missing) { errors++; console.log(`✗ ${file.replace(root, 'src')}: '${n}' usato ma non definito né importato`); }
}

console.log(errors ? `\n${errors} problemi trovati` : `✓ ${files.length} file controllati, nessun problema`);
process.exit(errors ? 1 : 0);
