'use strict';
// Deterministic seeded RNG (mulberry32) + string hashing.
function hashSeed(str){
  let h = 1779033703 ^ String(str).length;
  for (let i=0;i<String(str).length;i++){
    h = Math.imul(h ^ String(str).charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return (h ^ (h >>> 16)) >>> 0;
}
function mulberry32(seed){
  let s = (typeof seed === 'number') ? seed >>> 0 : hashSeed(seed);
  return function(){
    s |= 0; s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
module.exports = { mulberry32, hashSeed };
