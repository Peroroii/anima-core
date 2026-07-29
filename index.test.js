const { Engine, ARCHETYPES, mulberry32, hashSeed } = require('./index.js');
const fs = require('fs');
const path = require('path');

describe('RNG determinism', () => {
  test('same seed → identical sequence', () => {
    const a = mulberry32('x'), b = mulberry32('x');
    for (let i=0;i<100;i++) expect(a()).toBe(b());
  });
  test('different seeds → different sequences', () => {
    const a = mulberry32('x'), b = mulberry32('y');
    let diff = false;
    for (let i=0;i<10;i++) if (a()!==b()) diff = true;
    expect(diff).toBe(true);
  });
  test('numeric and string seeds both work', () => {
    expect(typeof mulberry32(42)()).toBe('number');
    expect(typeof mulberry32('str')()).toBe('number');
    expect(hashSeed('abc')).toBe(hashSeed('abc'));
  });
  test('RNG output in [0,1)', () => {
    const r = mulberry32('range');
    for (let i=0;i<1000;i++){ const v=r(); expect(v).toBeGreaterThanOrEqual(0); expect(v).toBeLessThan(1); }
  });
});

describe('Engine construction', () => {
  test('all 7 archetypes construct', () => {
    for (const a of Object.keys(ARCHETYPES)) {
      expect(() => new Engine({archetype:a, seed:'s'})).not.toThrow();
    }
  });
  test('unknown archetype throws', () => {
    expect(() => new Engine({archetype:'nope'})).toThrow(/unknown archetype/);
  });
  test('default archetype works', () => {
    expect(() => new Engine({seed:'s'})).not.toThrow();
  });
  test('initial state matches archetype anchor', () => {
    const e = new Engine({archetype:'paranoia', seed:'s'});
    expect(e.state.rho).toBe(ARCHETYPES.paranoia.init.rho);
  });
});

describe('state domain invariant', () => {
  test('all state vars stay in [0,1] over 200 turns, all archetypes, adversarial signals', () => {
    for (const arch of Object.keys(ARCHETYPES)) {
      const e = new Engine({archetype:arch, seed:'stress-'+arch});
      for (let t=0;t<200;t++){
        const s = e.step({aperture:1, closure:1, fantasy:1, elaboration:1, symptom:1, agendaGap:1});
        for (const k of ['E','T','A','C','G','P','rho']) {
          expect(s[k]).toBeGreaterThanOrEqual(0);
          expect(s[k]).toBeLessThanOrEqual(1);
          expect(Number.isNaN(s[k])).toBe(false);
        }
      }
    }
  });
});

describe('reproducibility (the core promise)', () => {
  test('same seed + same inputs → byte-identical trajectory', () => {
    const run = () => {
      const e = new Engine({archetype:'paranoia', seed:'repro-42'});
      const traj = [];
      for (let t=0;t<30;t++) traj.push(e.step({fantasy:t%2, agendaGap:0.7, closure:0.3}));
      return JSON.stringify(traj);
    };
    expect(run()).toBe(run());
  });
  test('reseed changes trajectory', () => {
    const e1 = new Engine({archetype:'histeria', seed:'a'});
    const e2 = new Engine({archetype:'histeria', seed:'a'});
    e2.reseed('b');
    const s1=[], s2=[];
    for (let t=0;t<20;t++){ s1.push(e1.step({fantasy:1,agendaGap:0.9})); s2.push(e2.step({fantasy:1,agendaGap:0.9})); }
    expect(JSON.stringify(s1)).not.toBe(JSON.stringify(s2));
  });
  test('snapshot is serializable and complete', () => {
    const e = new Engine({archetype:'obsesion', seed:'snap'});
    e.step({agendaGap:0.5});
    const snap = e.snapshot();
    expect(snap).toHaveProperty('archetype','obsesion');
    expect(snap).toHaveProperty('seed','snap');
    expect(snap).toHaveProperty('turn',1);
    expect(JSON.parse(JSON.stringify(snap))).toEqual(snap);
  });
});

describe('irruption mechanism', () => {
  test('no irruption below threshold', () => {
    const e = new Engine({archetype:'obsesion', seed:'i'});
    e.S.P = 0.1;
    expect(e._checkIrruption()).toBe(false);
  });
  test('irruption possible above threshold with high A+G', () => {
    const e = new Engine({archetype:'esquizofrenia', seed:'i2'});
    let fired = false;
    for (let i=0;i<50;i++){ e.S.P=0.99; e.S.A=0.9; e.S.G=0.9; if(e._checkIrruption()) fired=true; }
    expect(fired).toBe(true);
  });
});

describe('discurso × arquetipo — wired at the top-level package export (v0.4.0)', () => {
  const anima = require('./index');
  test('discursoDominante and congruencia are exposed and usable for every archetype the ' +
       'package actually defines, not just a subset', () => {
    const rng = anima.mulberry32('integracion');
    for (const arquetipo of Object.keys(anima.ARCHETYPES)){
      const d = anima.discursoDominante(arquetipo, rng);
      expect(anima.ROTACION).toContain(d);
      expect(typeof anima.congruencia(arquetipo, d)).toBe('number');
    }
  });
});

describe('version consistency (P3 of the architecture roadmap) — same guard pattern already ' +
         'proven in anima-eval v0.17.0 and anima-trace v1.0.1, ported here before this package ' +
         'accumulates the same silent drift', () => {
  test('VERSION is read from package.json, not a hardcoded literal that can drift -- every ' +
       'release this session kept them in sync by hand with sed, which is exactly the fragile ' +
       'process this guard exists to make unnecessary', () => {
    const pkg = require('./package.json');
    const anima = require('./index');
    expect(anima.VERSION).toBe(pkg.version);
  });

  test('CHANGELOG.md\'s newest entry states the current package version -- same discipline as ' +
       'the fix above, applied to prose documentation instead of code, so the changelog cannot ' +
       'silently claim to be current when it is not', () => {
    const pkg = require('./package.json');
    const changelog = fs.readFileSync(path.join(__dirname, 'CHANGELOG.md'), 'utf8');
    const firstEntry = changelog.split(/^## /m)[1]; // primera entrada real, después del título "# Changelog"
    expect(firstEntry).toMatch(new RegExp(`core — ${pkg.version.replace(/\./g, '\\.')} `));
  });
});
