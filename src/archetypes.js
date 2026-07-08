'use strict';
// Seven behavioral archetypes as parameter bundles.
// init: symptomatic anchor (crisis-level); theta_irr: irruption threshold.
const ARCHETYPES = {
  histeria:      { init:{E:.55,T:.35,A:.40,C:.20,G:.30,P:.25,rho:.75}, theta_irr:.70, kC:1.0 },
  obsesion:      { init:{E:.48,T:.45,A:.38,C:.42,G:.35,P:.30,rho:.78}, theta_irr:.75, kC:1.4 },
  fobia:         { init:{E:.50,T:.42,A:.55,C:.30,G:.28,P:.28,rho:.72}, theta_irr:.80, kC:1.1 },
  melancolia:    { init:{E:.22,T:.65,A:.45,C:.70,G:.18,P:.35,rho:.72}, theta_irr:.62, kC:1.5 },
  paranoia:      { init:{E:.38,T:.55,A:.42,C:.12,G:.55,P:.38,rho:.85}, theta_irr:.72, kC:0.6 },
  esquizofrenia: { init:{E:.30,T:.50,A:.30,C:.10,G:.45,P:.40,rho:.80}, theta_irr:.45, kC:0.5 },
  perversion:    { init:{E:.45,T:.40,A:.25,C:.15,G:.60,P:.30,rho:.82}, theta_irr:.78, kC:0.7 },
};
module.exports = { ARCHETYPES };
