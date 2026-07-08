'use strict';
const { Engine } = require('./src/engine');
const { ARCHETYPES } = require('./src/archetypes');
const { mulberry32, hashSeed } = require('./src/rng');
module.exports = { Engine, ARCHETYPES, mulberry32, hashSeed, VERSION:'0.1.0' };
