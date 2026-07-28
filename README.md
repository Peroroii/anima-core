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

## Testeo a fondo del motor (`engine.stress.test.js`, v0.4.1)

Además de los tests unitarios, una suite de estrés que prueba
invariantes del sistema completo, no funciones aisladas: límites de
`S(t)` bajo señales al máximo sostenidas 2000 turnos, determinismo y
diferenciación real entre los 7 arquetipos, robustez ante entradas
malformadas (NaN, strings, negativos, `undefined`), copias defensivas
en `snapshot()`/`state`/`step()`, y alcanzabilidad de los 7 `theta_irr`.

**Un hallazgo real, no solo cobertura añadida**: el comentario de
`rho_floor` en `archetypes.js` afirmaba que "todos los arquetipos
convergen a su floor bajo 500 turnos de elaboración pura" — probado a
fondo, es falso. La erosión de `rho` es proporcional a `_lastP`
(presión del turno anterior); "elaboración pura" sin `agendaGap` drena
`P` a 0 en ~5 turnos, lo que **congela la erosión** muy lejos del floor
(margen de 0,21–0,42 según el arquetipo, confirmado a 3000 turnos).
Verificado también lo que sí funciona: con `agendaGap` suficiente para
sostener `P>0`, `rho` converge **exactamente** al floor (confirmado a
20.000 turnos, los 7 arquetipos). El comentario quedó corregido con la
condición real, no con lo que se asumía que pasaba.

## Los cuatro discursos (Lacan, Seminario XVII)

    const { DISCURSOS, siguienteDiscurso, posicionesDe } = require('anima-core');
    posicionesDe('amo');          // { agente:'S1', otro:'S2', verdad:'$', produccion:'a' }
    siguienteDiscurso('amo');     // 'universitario'

Matriz formal de cuatro posiciones estructurales fijas (agente, otro,
verdad, producción), ocupadas rotativamente por cuatro términos (S1
significante amo, S2 saber, $ sujeto dividido, a objeto). Codificada como
lookup verificado (`src/discursos.js`) — la regla de rotación se comprobó
algebraicamente contra la tabla del Seminario XVII antes de escribir la
estructura, no se derivó de memoria.

**Dato no obvio, verificado en código**: el orden real de rotación bajo
el operador de cuartos de giro es `amo → universitario → analista →
historica → amo` — **no** el orden en que suelen listarse (amo,
universitario, histérica, analista), que no cierra consistentemente bajo
ese operador.

**Discurso ≠ arquetipo clínico.** Los cuatro discursos describen qué
función ocupa qué lugar en un intercambio dado — son dinámicos, cambian
turno a turno. Los siete arquetipos de este mismo paquete (`ARCHETYPES`)
describen cómo se habita esa posición — son más estables, parametrizan
`theta_irr`/`kC`/`kRho`. Son dos ejes ortogonales, pensados para cruzarse
(un arquetipo histérico puede hablar, en un turno dado, desde el discurso
del Amo), no dos taxonomías compitiendo por el mismo objeto — el cruce
entre ambos ejes está implementado en `src/discurso_arquetipo.js`, ver
la sección siguiente.

## Cruce discurso × arquetipo (`src/discurso_arquetipo.js`, v0.4.0)

    const { discursoDominante, congruencia, mulberry32 } = require('anima-core');
    const rng = mulberry32('sesion-1');
    discursoDominante('histeria', rng);      // discurso más probable, ponderado
    congruencia('histeria', 'historica');    // 0.55 — qué tan "en su lugar" está

El arquetipo funciona como **prior que sesga** qué discurso es más
probable que ocupe un hablante — sesgo, no destino. `discursoDominante`
hace un muestreo ponderado determinístico (reutiliza `mulberry32`, el
mismo PRNG que ya usa `engine.js` para la irrupción — mismo criterio de
reproducibilidad). `congruencia(arquetipo, discurso)` devuelve el propio
peso del sesgo — deliberadamente no se inventa una fórmula nueva para no
crear dos fuentes de verdad sobre lo mismo.

**Disciplina de honestidad teórica, en los datos, no solo en el
comentario**: cada una de las siete correspondencias arquetipo→discurso
lleva un campo `confianza` (`alta`/`media`/`baja`) porque no tienen el
mismo respaldo. Histeria es la única con confianza `alta` — es
literalmente el discurso que Lacan nombra así en el Seminario XVII, no
una hipótesis de este programa. Obsesión y fobia son `media` — lecturas
clínicas bien establecidas (dominio/intelectualización obsesiva, objeto
fóbico como significante ancla) pero extensiones interpretativas, no
correspondencias que Lacan formalizó él mismo. Melancolía, paranoia,
esquizofrenia y perversión son `baja` — genuinamente especulativas: el
marco de los cuatro discursos presupone un sujeto barrado (castración),
y extenderlo a estructuras psicótico-adyacentes, donde el concepto
lacaniano relevante es la forclusión y no la represión, estira el marco
más allá de donde Lacan lo aplicó. Incluidas para volver el modelo
completo y testeable, no presentadas como teoría establecida.

**Todavía no conectado al motor de estado** (`engine.js`): este cruce
vive como módulo independiente, consultable pero no cableado a las
ecuaciones de actualización de `S(t)`. Conectarlo — por ejemplo, que una
baja congruencia module la presión `P` como tensión estructural de
ocupar una posición discursiva ajena al arquetipo — es el próximo paso
natural, no resuelto en esta versión.

## Cruce cableado al motor (v0.5.0)

    const e = new Engine({ archetype: 'histeria', seed: 's1' });
    e.step({ agendaGap: 0.2, discurso: 'universitario' }); // discurso ajeno a histeria -> más tensión
    e.step({ agendaGap: 0.2, discurso: 'historica' });     // discurso propio -> menos tensión

`signals.discurso` es un campo **opcional** del vector de señal (uno de
los 4 discursos, o ausente/`null`). Cuando está presente,
`(1 - congruencia(arquetipo, discurso))` — la discordancia entre el
arquetipo y el discurso efectivamente ocupado ese turno — suma tensión
a `P`, con el mismo patrón de headroom proporcional que ya usa
`agendaGap` (`kDiscurso·discordancia·(1-P)`, `kDiscurso=0.03`) — no se
inventó un mecanismo nuevo, se reutilizó el que ya existía. Sin
`discurso`, el comportamiento es idéntico al de antes de esta versión:
`discordanciaDiscursiva` es 0 y no aporta nada — cada llamador anterior
sigue funcionando exactamente igual. Un nombre de discurso inválido
tampoco rompe nada: contribuye discordancia 0, mismo criterio de
robustez que el resto del motor ante entradas malformadas (verificado
en `engine.stress.test.js`, incluido el peor caso: discurso más
incongruente + señales al máximo sostenidas 2000 turnos, los 7
arquetipos, sin salirse de `[0,1]`).

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
