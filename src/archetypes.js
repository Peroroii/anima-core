'use strict';
// Seven behavioral archetypes as parameter bundles.
// init: symptomatic anchor (crisis-level); theta_irr: irruption threshold.
//
// v0.2.0 — recalibrated for Opción C (equation change in engine.js):
//   P update now uses -0.06*elaboration*(1-P_init) instead of -0.08*elaboration,
//   decoupling the elaboration drain from the ceiling that P can reach.
//   theta_irr values were recalibrated empirically (100 sessions × 20 turns,
//   clinical-range signals) to produce clinically plausible irruption frequencies.
//   esquizofrenia init.A and init.G were raised to reflect structural anxiety/jouissance.
//
// v0.2.3 — added kRho and rho_floor (dual Durcharbeitung register, hallazgo 4):
//   kRho: modulates the speed of progressive rho erosion by archetype.
//     Higher = faster erosion (more labile fantasy structure).
//   rho_floor: asymptotic minimum rho under sustained elaboration WHILE
//     PRESSURE STAYS ABOVE ZERO. The fantasy flexibilizes but never
//     dissolves — each structure has a minimum rigidity consistent with
//     its clinical organization.
//
//   CORRECTED (v0.4.1, found while stress-testing the engine): the
//   erosion term is proportional to `_lastP` (previous turn's
//   pressure) — no pressure, no erosion, by design (working-through has
//   nothing to work against if there's no tension). This means "pure
//   elaboration" — elaboration with no agendaGap ever — drains P to a
//   hard 0 within ~5 turns (elaboration's own drain on P outpaces
//   nothing replenishing it), which then freezes rho far from the
//   floor (margin of 0.21-0.42 across archetypes, confirmed at 5000
//   turns) — NOT convergence. The floor is only reached when elaboration
//   is sustained ALONGSIDE enough agendaGap to keep P from collapsing
//   to zero (verified exactly at 20,000 turns, all 7 archetypes, once
//   agendaGap clears the archetype-specific equilibrium threshold
//   ≈0.6·(1−init.P)). The previous version of this comment claimed
//   convergence under "pure elaboration (no defense)" — that was never
//   actually re-verified after later equation changes and was false as
//   stated; corrected here with the exact condition under which the
//   claim does hold.
//
//   FOUND VIA SYSTEMATIC SWEEP (v0.6.0, src/phase_sweep.js): the floor
//   only bounds the ELABORATION-DRIVEN erosion term. It is NOT an
//   absolute floor on rho — irruption's own, separate rho reduction
//   (`-0.06*irrGen` in the rho equation) has no floor protection at
//   all and will drive rho arbitrarily below the declared floor given
//   enough repeated irruptions, even with elaboration at 0 the whole
//   time (confirmed: a signal combo with elaboration=0 sustained,
//   agendaGap=0.5, crossed histeria's 0.35 floor by turn 65 and kept
//   falling with each subsequent irruption, no erosion involved at
//   all).
//
//   RESOLVED (v0.6.0, same day): this is correct as designed, not a
//   gap to close. The floor describes a minimum reachable through
//   gradual working-through (elaboration eroding a rigid structure
//   over time) — it was never meant to describe a hard ceiling on how
//   far a genuinely disruptive event can go. Irruption is a return of
//   the repressed; letting it rupture even the structure's nominal
//   minimum rigidity is theoretically consistent, not a bug. The
//   equation stays unchanged. rho_floor should be read as "the floor
//   under gradual erosion", not "the floor, full stop" — the name is
//   slightly optimistic but changing it now would be more disruptive
//   than clarifying the comment.
const ARCHETYPES = {
  histeria:      { init:{E:.55,T:.35,A:.40,C:.20,G:.30,P:.25,rho:.75}, theta_irr:.375, kC:1.0, kRho:1.3, rho_floor:0.35 },
  obsesion:      { init:{E:.48,T:.45,A:.38,C:.42,G:.35,P:.30,rho:.78}, theta_irr:.625, kC:1.4, kRho:0.6, rho_floor:0.55 },
  fobia:         { init:{E:.50,T:.42,A:.55,C:.30,G:.28,P:.28,rho:.72}, theta_irr:.475, kC:1.1, kRho:0.9, rho_floor:0.40 },
  melancolia:    { init:{E:.22,T:.65,A:.45,C:.70,G:.18,P:.35,rho:.72}, theta_irr:.500, kC:1.5, kRho:0.8, rho_floor:0.45 },
  paranoia:      { init:{E:.38,T:.55,A:.42,C:.12,G:.55,P:.38,rho:.85}, theta_irr:.425, kC:0.6, kRho:0.5, rho_floor:0.60 },
  esquizofrenia: { init:{E:.30,T:.50,A:.48,C:.10,G:.55,P:.40,rho:.80}, theta_irr:.350, kC:0.5, kRho:1.1, rho_floor:0.30 },
  perversion:    { init:{E:.45,T:.40,A:.25,C:.15,G:.60,P:.30,rho:.82}, theta_irr:.625, kC:0.7, kRho:0.7, rho_floor:0.50 },
};
module.exports = { ARCHETYPES };
