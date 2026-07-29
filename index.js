'use strict';
const { Engine } = require('./src/engine');
const { ARCHETYPES } = require('./src/archetypes');
const { mulberry32, hashSeed } = require('./src/rng');
const { DISCURSOS, ROTACION, TERM_CYCLE, rotarTermino, siguienteDiscurso,
  anteriorDiscurso, posicionesDe, verificarConsistencia } = require('./src/discursos');
const { DISCOURSE_BIAS, discursoDominante, congruencia } = require('./src/discurso_arquetipo');
const { barrerArquetipo, barrerTodosLosArquetipos } = require('./src/phase_sweep');
module.exports = {
  Engine, ARCHETYPES, mulberry32, hashSeed,
  DISCURSOS, ROTACION, TERM_CYCLE, rotarTermino, siguienteDiscurso,
  anteriorDiscurso, posicionesDe, verificarConsistencia,
  DISCOURSE_BIAS, discursoDominante, congruencia,
  barrerArquetipo, barrerTodosLosArquetipos,
  VERSION:'0.6.0',
};
