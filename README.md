# anima-core

![CI](https://github.com/Peroroii/anima-core/actions/workflows/ci.yml/badge.svg) ![npm](https://img.shields.io/npm/v/anima-core) ![license](https://img.shields.io/badge/license-MIT-green) ![node](https://img.shields.io/badge/node-%3E%3D16-brightgreen)


The deterministic psychodynamic engine at the heart of ANIMA. Computes a
seven-dimensional state vector per turn from structural archetype parameters
and update equations. Zero LLM calls, seeded RNG, byte-reproducible.

This is the engine as a library: `anima-eval` and other tools depend on it.

## Install
    npm install anima-core

## Quick start
    const { Engine, ARCHETYPES } = require('anima-core');
    const eng = new Engine({ archetype: 'paranoia', seed: 'demo-42' });
    const state = eng.step({ aperture: 0.3, closure: 0.6, fantasy: 1 });
    console.log(state);   // { E, T, A, C, G, P, rho, irruption }

## State vector S(t) ∈ [0,1]⁷
    E   Eros          — libidinal bond
    T   Thanatos      — death drive / resistance
    A   Anxiety       — alarm signal
    C   Guilt         — superego pressure
    G   Jouissance    — drive satisfaction
    P   Pressure      — irruption motor (unconscious pressure)
    rho Rigidity      — fantasy defense impermeability

## Reproducibility
Every Engine is seeded. Same seed + same inputs → byte-identical trajectory.
    eng.reseed('other-seed');
    eng.snapshot();   // serializable state for audit / replay
