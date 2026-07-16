'use strict';
const { mulberry32 } = require('./rng');
const { ARCHETYPES } = require('./archetypes');

const clip = x => Math.max(0, Math.min(1, x));

// Signal vector σ(t) — inputs to the update equations (all optional, default 0).
// Mirrors the DSE outputs: aperture, closure, fantasy, elaboration, symptom, agendaGap.
function normSignals(s = {}){
  return {
    aperture:    +s.aperture    || 0,  // σ_aper
    closure:     +s.closure     || 0,  // σ_cie
    fantasy:     +s.fantasy     || 0,  // σ_fan (0/1)
    elaboration: +s.elaboration || 0,  // σ_elab
    symptom:     +s.symptom     || 0,  // σ_sint
    agendaGap:   +s.agendaGap   || 0,  // d_agenda
  };
}

class Engine {
  constructor(opts = {}){
    const arch = opts.archetype || 'histeria';
    if (!ARCHETYPES[arch]) throw new Error(`unknown archetype: ${arch}`);
    this.archetype = arch;
    this.params = ARCHETYPES[arch];
    this._seed = opts.seed != null ? opts.seed : 'anima-default';
    this._rng = mulberry32(this._seed);
    this.turn = 0;
    // state vector S(t)
    const i = this.params.init;
    this.S = { E:i.E, T:i.T, A:i.A, C:i.C, G:i.G, P:i.P, rho:i.rho };
    this._lastP = i.P;
  }

  reseed(seed){ this._seed = seed; this._rng = mulberry32(seed); return this; }

  // deterministic irruption check: necessary (P≥θ) + stochastic sufficient
  _checkIrruption(){
    if (this.S.P < this.params.theta_irr) return false;
    const k = 6, thetaAG = 0.9;
    const p = 1 / (1 + Math.exp(-k * (this.S.A + this.S.G - thetaAG)));
    return this._rng() < p;
  }

  // one turn: apply update equations, return new state + events
  step(signals = {}){
    const s = normSignals(signals);
    const S = this.S, p = this.params;
    const irr = this._checkIrruption();
    const irrGen = irr ? 1 : 0;
    const defense = (!irr && s.closure > 0.5) ? 1 : 0;

    const next = {
      E:   clip(S.E + 0.12*s.aperture*(1-S.rho) - 0.10*s.closure*S.T - 0.08*s.fantasy*S.A),
      T:   clip(S.T + 0.10*s.closure*S.rho - 0.09*s.elaboration*S.E),
      // v0.2.1: symptom now also reduces A proportionally to current A level.
      // Previously symptom only affected G (jouissance). Theoretically, the
      // symptom is a compromise formation that also regulates anxiety — it does
      // not eliminate it, but modulates it in proportion to how much is present.
      A:   clip(S.A + 0.12*S.P*s.fantasy - 0.10*defense + 0.05*irr*(1-S.A) - 0.06*s.symptom*S.A),
      C:   clip(S.C + 0.08*irr*p.kC - 0.05*s.elaboration),
      G:   clip(S.G + 0.07*s.symptom - 0.10*irrGen - 0.04*s.elaboration*S.E),
      // pressure with proportional-headroom increment (v6.8 fix)
      // v0.2.0: elaboration drain now proportional to (1-P_init) rather than
      // a flat constant. This decouples the elaboration effect from the ceiling
      // that P can reach: elaboration reduces pressure in proportion to the
      // structural margin above the archetype's baseline, not against the
      // absolute maximum. Previously, -0.08*elaboration compressed P* to ~0.52
      // under typical signals, making irruption unreachable for 6/7 archetypes.
      P:   clip(S.P + 0.10*s.agendaGap*(1-S.P) - 0.06*s.elaboration*(1-this.params.init.P) - 0.25*irr),
      rho: clip(S.rho - 0.06*irrGen - 0.05*s.elaboration*this._lastP + 0.04*defense),
    };
    this._lastP = S.P;
    this.S = next;
    this.turn++;
    return { ...next, irruption: irr, turn: this.turn };
  }

  // serializable snapshot for audit/replay
  snapshot(){
    return { archetype:this.archetype, seed:this._seed, turn:this.turn, state:{...this.S} };
  }
  get state(){ return { ...this.S }; }
}

module.exports = { Engine };
