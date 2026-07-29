'use strict';
// Read the version from package.json rather than a hardcoded literal --
// this is the exact same bug class already found and fixed twice this
// session in sibling packages: anima-eval's anima_eval_version drifted
// six releases behind package.json before anyone checked it (v0.17.0
// fix), and anima-trace's ENGINE_VERSION was hardcoded so badly its own
// version-mismatch check could never fire (v1.0.1 fix). Here the drift
// was only avoided so far because every release this session included
// a manual `sed` to keep VERSION in sync by hand -- fragile, and the
// third instance of the same root cause across the three packages.
const { version: PACKAGE_VERSION } = require('./package.json');
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
  VERSION: PACKAGE_VERSION,
};
