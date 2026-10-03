// Combattimento: punto d'ingresso unico che raccoglie i pezzi, ognuno nel suo file.
//   enemies.js   movimento e attacchi dei nemici
//   shooting.js  spari di torre e colleghi
//   fence.js     recinto elettrico
//   damage.js    danni, morti, trasformazione dei boss
export { updateEnemies, updateEnemyShots } from './enemies.js';
export { updateTower, updateShots, pickTargets, fire } from './shooting.js';
export { updateFence, FENCE } from './fence.js';
export { dealDamage, damageTower } from './damage.js';
