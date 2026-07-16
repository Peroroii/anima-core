'use strict';
// Seven behavioral archetypes as parameter bundles.
// init: symptomatic anchor (crisis-level); theta_irr: irruption threshold.
//
// v0.2.0 — recalibrated for Opción C (equation change in engine.js):
//   P update now uses -0.06*elaboration*(1-P_init) instead of -0.08*elaboration,
//   decoupling the elaboration drain from the ceiling that P can reach.
//   theta_irr values were recalibrated empirically (100 sessions × 20 turns,
//   clinical-range signals) to produce clinically plausible irruption frequencies:
//     histeria: 1–3/session, obsesion: 0–1, fobia: 1–2, melancolia: 1–2,
//     paranoia: 1–3, esquizofrenia: ~3/session (ceiling at 3 given 20-turn session),
//     perversion: 0–1.
//   esquizofrenia init.A and init.G were raised (0.30→0.48, 0.45→0.55) to reflect
//   the structural level of anxiety and unmediated jouissance in S2 — the previous
//   values placed A+G at 0.75, below the logistic threshold (thetaAG=0.90), making
//   irruption nearly impossible regardless of theta_irr.
const ARCHETYPES = {
  histeria:      { init:{E:.55,T:.35,A:.40,C:.20,G:.30,P:.25,rho:.75}, theta_irr:.375, kC:1.0 },
  obsesion:      { init:{E:.48,T:.45,A:.38,C:.42,G:.35,P:.30,rho:.78}, theta_irr:.625, kC:1.4 },
  fobia:         { init:{E:.50,T:.42,A:.55,C:.30,G:.28,P:.28,rho:.72}, theta_irr:.475, kC:1.1 },
  melancolia:    { init:{E:.22,T:.65,A:.45,C:.70,G:.18,P:.35,rho:.72}, theta_irr:.500, kC:1.5 },
  paranoia:      { init:{E:.38,T:.55,A:.42,C:.12,G:.55,P:.38,rho:.85}, theta_irr:.425, kC:0.6 },
  esquizofrenia: { init:{E:.30,T:.50,A:.48,C:.10,G:.55,P:.40,rho:.80}, theta_irr:.350, kC:0.5 },
  perversion:    { init:{E:.45,T:.40,A:.25,C:.15,G:.60,P:.30,rho:.82}, theta_irr:.625, kC:0.7 },
};
module.exports = { ARCHETYPES };
