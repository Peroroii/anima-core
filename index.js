'use strict';
const { Engine } = require('./src/engine');
const { ARCHETYPES } = require('./src/archetypes');
const { mulberry32, hashSeed } = require('./src/rng');
const { DISCURSOS, ROTACION, TERM_CYCLE, rotarTermino, siguienteDiscurso,
  anteriorDiscurso, posicionesDe, verificarConsistencia } = require('./src/discursos');
module.exports = {
  Engine, ARCHETYPES, mulberry32, hashSeed,
  DISCURSOS, ROTACION, TERM_CYCLE, rotarTermino, siguienteDiscurso,
  anteriorDiscurso, posicionesDe, verificarConsistencia,
  VERSION:'0.3.0',
};
