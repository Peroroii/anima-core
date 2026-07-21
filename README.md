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

## Signal vector σ(t)
Inputs to `step()`, all optional (default 0). These mirror the outputs of
a discourse/semiotic structure engine (DSE) — `anima-eval` is the reference
implementation.

    aperture     σ_aper  — opens/loosens the libidinal bond (feeds E)
    closure      σ_cie   — defensive foreclosure (feeds T, defense)
    fantasy      σ_fan   — fantasmatic support present (0/1, feeds E, A)
    elaboration  σ_elab  — working-through / Durcharbeitung (feeds T, C, G, P, ρ)
    symptom      σ_sint  — compromise formation active (feeds A, G)
    agendaGap    d_agenda — unacknowledged rupture of the agent's own prior
                            directed commitment (feeds P only)

`agendaGap` was an accepted-but-unproduced input through v0.2.x — no DSE
implementation computed it. As of `anima-eval` v0.3.0, `agenda_gap` is
produced deterministically (lexical commitment tracking — commissive
utterances, polarity, addressivity, persistent decaying tension until
explicit revision). See `anima-eval`'s README for the full method and its
theoretical grounding (Ley IV, Cognición Semiótica Dinámica: ineludibility
is constituted at the directed utterance, not at the interlocutor's reply).

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

**Important:** the seeded RNG is consumed *conditionally* — `_rng()` is called
only when `S.P >= theta_irr` (the necessary condition for an irruption). This
has two practical consequences:

- **When P never reaches the threshold** (e.g. low-pressure signal sequences),
  the seed has no effect on the trajectory. Two instances with different seeds
  but identical signals will produce identical results. This is correct and
  expected — the update equations are fully deterministic in that regime.

- **Reproducibility is guaranteed only when input signals are identical across
  runs.** If signal sequences differ between two runs (causing P to cross
  `theta_irr` at different turns), the RNG is consumed at different points and
  trajectories will diverge from there, even with the same seed.

Use `anima-trace` to record and verify reproducibility: it re-runs the engine
with the stored signal sequence and confirms byte-identical output.
