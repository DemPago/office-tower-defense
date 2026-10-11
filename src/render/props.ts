// Re-esportazione barrel: mantiene la compatibilità con tutti gli importatori
// esistenti che usano `import * as P from './props.js'`.
// Le tre dipendenze formano un albero aciclico: base ← items ← italian.
export * from './props_base.js';
export * from './props_items.js';
export * from './props_italian.js';
