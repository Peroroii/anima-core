# Changelog

## core — 0.6.0 (2026-07-29)

Added: `src/phase_sweep.js` — a systematic signal-space sweep tool
(P2 of the architecture roadmap), replacing the ad-hoc scripts used
to find the rho_floor bug and verify discourse-tension direction. Runs
a 729-combination grid (3 levels × 6 numeric signals) per archetype to
steady state, checking three concrete, historically-justified
invariants: bounds ([0,1], generalized from the stress-test suite to
the full grid), stabilization (does the trajectory settle within the
horizon), and floor-crossing (does rho ever drop below its declared
floor).

Found something real on its first run: the rho floor is **not an
absolute floor** — it only protects against elaboration-driven
erosion. Irruption has its own, separate rho-reduction term
(`-0.06*irrGen`) with no floor protection at all. A signal combo with
`elaboration=0` sustained still crosses histeria's 0.35 floor purely
from repeated irruptions — confirmed turn-by-turn, every rho drop
coincides exactly with `irruption: true`.

Not resolved unilaterally: this is a genuine theoretical question, not
a bug with an obvious answer. Should irruption's rho reduction also
respect the floor (a true floor on rho overall), or is this correct as
designed — irruption representing a return of the repressed able to
rupture even the structure's minimum rigidity? The equation is
unchanged pending that judgment call. Documented in `archetypes.js`'s
`rho_floor` comment and pinned as a regression test so the sweep keeps
detecting it until it's changed on purpose.

75/75 tests passing (9 new).

## core — 0.5.0 (2026-07-28)

Added: the discourse × archetype crossing is now wired into
`engine.js`'s update equations — the explicit next step flagged in
v0.4.0/v0.4.1. `signals.discurso` is an optional field (one of the 4
discourse names, or absent/`null`). When present,
`(1-congruencia(archetype, discurso))` — how foreign the occupied
discourse is to the archetype's resting bias — adds structural tension
to `P`, using the same proportional-headroom pattern already used for
`agendaGap` (`kDiscurso·discordancia·(1-P)`, `kDiscurso=0.03`) rather
than inventing a new mechanism.

Backward compatible by construction: omitting `discurso` (every caller
before this release) makes `discordanciaDiscursiva` exactly 0 — zero
behavior change for existing code, verified by the full 63-test suite
passing unchanged before any new tests were added. An invalid discourse
name doesn't throw either — contributes 0, same robustness standard as
the rest of the engine.

Verified directionally and under stress before trusting it: incongruent
discourse produces measurably more pressure than congruent discourse,
holding everything else equal; determinism holds with `discurso`
varying turn to turn; the worst case (each archetype's LEAST congruent
discourse, combined with maxed-out signals, 2000 turns) stays within
`[0,1]` for all 7 archetypes.

68/68 tests passing (5 new).

## core — 0.4.1 (2026-07-28)

Added: `engine.stress.test.js` — a stress-test suite probing system-wide
invariants rather than isolated functions: state bounds under maxed-out
sustained signals (2000 turns, all 7 archetypes), determinism and real
differentiation between archetypes, robustness against malformed input
(NaN, strings, negatives, `undefined`), defensive copies in
`snapshot()`/`state`/`step()`, and reachability of all 7 `theta_irr`.

Fixed: a real finding, not just added coverage. The `rho_floor` comment
in `archetypes.js` claimed "all archetypes converge to their floor
under 500 turns of pure elaboration" — stress-tested, that's false.
Erosion is proportional to `_lastP` (previous turn's pressure); "pure
elaboration" with no `agendaGap` drains `P` to 0 within ~5 turns, which
**freezes erosion** far from the floor (margin of 0.21-0.42 depending on
archetype, confirmed at 3000 turns). Also verified what actually does
work: with enough `agendaGap` to keep `P>0`, `rho` converges **exactly**
to the floor (confirmed at 20,000 turns, all 7 archetypes). The comment
now states the real condition instead of the assumed one.

63/63 tests passing (19 new).

## core — 0.4.0 (2026-07-28)

Added: the discourse × archetype crossing (`src/discurso_arquetipo.js`),
the item left open when the four discourses shipped in v0.3.0. The
archetype acts as a **bias, not a destiny**, on which discourse a
speaker is likely to occupy: `discursoDominante(archetype, rng)` does
deterministic weighted sampling (reusing `mulberry32`, the same PRNG
`engine.js` already uses for irruption); `congruencia(archetype,
discourse)` returns the bias weight itself — deliberately not a new
formula, to avoid two sources of truth about the same thing.

Theoretical honesty encoded in the data, not just the comment: each of
the seven archetype→discourse correspondences carries a `confianza`
field (`alta`/`media`/`baja`). Only `histeria` is `alta` — it's the
discourse Lacan literally names for that structure in Seminario XVII,
not a hypothesis of this project. `obsesion`/`fobia` are `media` —
well-established clinical readings (obsessional mastery/
intellectualization, the phobic object as an anchoring signifier) that
are still interpretive extensions Lacan didn't formalize himself the
way he did the hysteric's discourse. `melancolia`/`paranoia`/
`esquizofrenia`/`perversion` are `baja` — genuinely speculative: the
four-discourse framework presupposes a barred subject (castration), and
extending it to psychotic-adjacent structures (where foreclosure, not
repression, is the relevant concept) stretches the framework beyond
where Lacan applied it. Included to make the model complete and
testable, not presented as established theory.

Not yet wired into `engine.js`'s update equations — this crossing lives
as a queryable, standalone module for now. Connecting it (e.g. low
congruence modulating pressure `P` as the structural tension of
occupying a discourse foreign to the archetype) is the natural next
step, not resolved in this release.

44/44 tests passing (13 new).

## core — 0.3.0 (2026-07-24)

Added: the four Lacanian discourses (Seminario XVII) as a verified
lookup structure (`src/discursos.js`) — S1/S2/$/a rotating through
agente/otro/verdad/produccion. The rotation rule was verified
algebraically against the seminar's table before being encoded, rather
than derived from memory: the real rotation order under the quarter-turn
operator is `amo → universitario → analista → historica → amo`, not the
order the four discourses are usually listed in (which does not close
consistently under that operator). A runtime `verificarConsistencia()`
check runs on import and throws immediately if the table is ever edited
inconsistently, rather than failing silently.

Explicitly designed as an axis orthogonal to the existing 7 clinical
archetypes (`ARCHETYPES`), not a replacement: discourse describes which
function occupies which position in a given exchange (dynamic, per-turn);
archetype describes how that position is inhabited (stable, parametrizes
theta_irr/kC/kRho). Integration between the two axes is a documented next
step, not resolved in this version.

31/31 tests passing (17 new). Bumped to 0.3.0.

## core — 0.1.0 (2026-07-08)

Initial public release.
