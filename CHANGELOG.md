# Changelog

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
