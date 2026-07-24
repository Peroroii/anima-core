# Changelog

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
