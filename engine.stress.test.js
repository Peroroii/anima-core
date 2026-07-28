'use strict';
// Suite de estrés del motor (`engine.stress.test.js`) — no son tests de
// una función aislada, son invariantes del sistema completo, probados
// bajo condiciones que el desarrollo normal no ejercita: señales al
// máximo sostenidas miles de turnos, entradas malformadas, y la
// pregunta que motivó todo esto ("¿la afirmación del comentario sobre
// rho_floor es cierta?" — no lo era, ver más abajo).
const { Engine } = require('./src/engine');
const { ARCHETYPES } = require('./src/archetypes');
const { DISCOURSE_BIAS } = require('./src/discurso_arquetipo');

const TODOS_LOS_ARQUETIPOS = Object.keys(ARCHETYPES);

describe('invariante de límites — S(t) nunca sale de [0,1], bajo ninguna condición', () => {
  test('señales al máximo sostenidas 2000 turnos, los 7 arquetipos, sin NaN ni fuera de rango', () => {
    for (const arch of TODOS_LOS_ARQUETIPOS){
      const e = new Engine({ archetype: arch, seed: 'stress-' + arch });
      for (let t = 0; t < 2000; t++){
        const r = e.step({ aperture: 1, closure: 1, fantasy: 1, elaboration: 1, symptom: 1, agendaGap: 1 });
        for (const k of ['E', 'T', 'A', 'C', 'G', 'P', 'rho']){
          expect(Number.isNaN(r[k])).toBe(false);
          expect(r[k]).toBeGreaterThanOrEqual(0);
          expect(r[k]).toBeLessThanOrEqual(1);
        }
      }
    }
  });
});

describe('rho_floor — corregido (v0.4.1): la afirmación original del comentario era falsa como ' +
         'estaba escrita, encontrado al hacer estrés real del motor, no asumido', () => {
  test('"elaboración pura" (sin agendaGap) NO converge al floor -- drena P a 0 en ~5 turnos, lo ' +
       'que congela la erosión (proporcional a _lastP) muy lejos del floor declarado, en los 7 ' +
       'arquetipos', () => {
    for (const arch of TODOS_LOS_ARQUETIPOS){
      const floor = ARCHETYPES[arch].rho_floor;
      const e = new Engine({ archetype: arch, seed: 'no-conv-' + arch });
      let minRho = 1;
      for (let t = 0; t < 3000; t++){
        const r = e.step({ elaboration: 1 });
        if (r.rho < minRho) minRho = r.rho;
      }
      // el margen real es de 0.21-0.42 según el arquetipo -- exigimos
      // al menos 0.15 para dejar margen sin ser fráfil ante recalibraciones menores
      expect(minRho - floor).toBeGreaterThan(0.15);
    }
  });

  test('elaboración CON agendaGap suficiente para sostener P>0 sí converge exactamente al floor ' +
       '-- verificado en los 7 arquetipos a 20.000 turnos, con el umbral de equilibrio real ' +
       '(~0.6·(1-init.P)) más un margen', () => {
    for (const arch of TODOS_LOS_ARQUETIPOS){
      const initP = ARCHETYPES[arch].init.P;
      const floor = ARCHETYPES[arch].rho_floor;
      const agUmbral = 0.6 * (1 - initP) + 0.05;
      const e = new Engine({ archetype: arch, seed: 'conv-' + arch });
      let minRho = 1;
      for (let t = 0; t < 20000; t++){
        const r = e.step({ elaboration: 1, agendaGap: agUmbral });
        if (r.rho < minRho) minRho = r.rho;
      }
      expect(minRho).toBeCloseTo(floor, 2);
    }
  });
});

describe('determinismo y diferenciación real entre arquetipos', () => {
  test('mismo seed + misma secuencia de señales -> resultado byte-idéntico, los 7 arquetipos', () => {
    const signals = Array.from({ length: 100 }, (_, i) => ({
      aperture: (i * 7) % 10 / 10, closure: (i * 3) % 10 / 10, fantasy: i % 2,
      elaboration: (i * 5) % 10 / 10, symptom: (i * 11) % 10 / 10, agendaGap: (i * 13) % 10 / 10,
    }));
    for (const arch of TODOS_LOS_ARQUETIPOS){
      const e1 = new Engine({ archetype: arch, seed: 'det-' + arch });
      const e2 = new Engine({ archetype: arch, seed: 'det-' + arch });
      const t1 = signals.map(s => e1.step(s));
      const t2 = signals.map(s => e2.step(s));
      expect(t1).toEqual(t2);
    }
  });

  test('los 7 arquetipos producen trayectorias distintas entre sí bajo la MISMA secuencia de ' +
       'señales -- confirma que theta_irr/kC/kRho realmente diferencian el comportamiento, no ' +
       'son parámetros decorativos', () => {
    const signals = Array.from({ length: 60 }, (_, i) => ({
      aperture: .5, closure: .3, fantasy: i % 3 === 0 ? 1 : 0, elaboration: .2, symptom: .1, agendaGap: .4,
    }));
    const trayectorias = {};
    for (const arch of TODOS_LOS_ARQUETIPOS){
      const e = new Engine({ archetype: arch, seed: 'diff-common' });
      trayectorias[arch] = signals.map(s => e.step(s));
    }
    for (let i = 0; i < TODOS_LOS_ARQUETIPOS.length; i++)
      for (let j = i + 1; j < TODOS_LOS_ARQUETIPOS.length; j++)
        expect(trayectorias[TODOS_LOS_ARQUETIPOS[i]]).not.toEqual(trayectorias[TODOS_LOS_ARQUETIPOS[j]]);
  });

  test('reseed() reproduce exactamente la secuencia del RNG original', () => {
    const e1 = new Engine({ archetype: 'paranoia', seed: 'A' });
    e1.S.P = 0.99; e1.S.A = 0.9; e1.S.G = 0.9;
    const seq1 = Array.from({ length: 10 }, () => e1._checkIrruption());

    const e2 = new Engine({ archetype: 'paranoia', seed: 'B' });
    e2.S.P = 0.99; e2.S.A = 0.9; e2.S.G = 0.9;
    e2.reseed('A');
    const seq2 = Array.from({ length: 10 }, () => e2._checkIrruption());

    expect(seq2).toEqual(seq1);
  });

  test('el RNG NO se consume mientras P<theta_irr, exactamente como promete el comentario de ' +
       '_checkIrruption() -- muchas llamadas por debajo del umbral no deben alterar la secuencia ' +
       'una vez que P lo cruza', () => {
    const e1 = new Engine({ archetype: 'obsesion', seed: 'gate-test' });
    for (let t = 0; t < 50; t++){ e1.S.P = 0.01; e1._checkIrruption(); }
    e1.S.P = 0.99; e1.S.A = 0.9; e1.S.G = 0.9;
    const r1 = Array.from({ length: 5 }, () => e1._checkIrruption());

    const e2 = new Engine({ archetype: 'obsesion', seed: 'gate-test' });
    e2.S.P = 0.99; e2.S.A = 0.9; e2.S.G = 0.9;
    const r2 = Array.from({ length: 5 }, () => e2._checkIrruption());

    expect(r1).toEqual(r2);
  });
});

describe('robustez ante entradas malformadas — nunca NaN, nunca fuera de [0,1]', () => {
  const casos = {
    'valores negativos': { aperture: -5, closure: -1 },
    'valores mayores a 1': { aperture: 999, elaboration: 50 },
    'strings no numéricos': { aperture: 'hola', closure: 'nada' },
    'NaN explícito': { aperture: NaN, symptom: NaN },
    'null/undefined en campos': { aperture: null, closure: undefined },
    'objeto vacío': {},
    'sin argumento': undefined,
  };
  for (const [nombre, signal] of Object.entries(casos)){
    test(nombre, () => {
      const e = new Engine({ archetype: 'histeria', seed: 'malformado' });
      const r = e.step(signal);
      for (const k of ['E', 'T', 'A', 'C', 'G', 'P', 'rho']){
        expect(Number.isNaN(r[k])).toBe(false);
        expect(r[k]).toBeGreaterThanOrEqual(0);
        expect(r[k]).toBeLessThanOrEqual(1);
      }
    });
  }
});

describe('copias defensivas — mutar un resultado no debe corromper el estado interno', () => {
  test('mutar snapshot().state no afecta el estado real', () => {
    const e = new Engine({ archetype: 'histeria', seed: 'copia' });
    e.step({ elaboration: 0.5 });
    const snap = e.snapshot();
    snap.state.E = 999;
    expect(e.S.E).not.toBe(999);
  });

  test('mutar el getter .state no afecta el estado real', () => {
    const e = new Engine({ archetype: 'histeria', seed: 'copia2' });
    e.step({});
    const st = e.state;
    st.rho = -50;
    expect(e.S.rho).not.toBe(-50);
  });

  test('mutar el resultado de step() no afecta el próximo step()', () => {
    const e = new Engine({ archetype: 'histeria', seed: 'copia3' });
    const r = e.step({});
    r.P = 12345;
    const r2 = e.step({});
    expect(r2.P).not.toBe(12345);
  });
});

describe('discurso × arquetipo, cableado al motor (v0.5.0)', () => {
  test('sin discurso (o con discurso omitido) el comportamiento es idéntico al de antes del ' +
       'cableado -- discordanciaDiscursiva es 0 y no contribuye nada a P, preservando cada ' +
       'llamador existente exactamente', () => {
    const e = new Engine({ archetype: 'histeria', seed: 'sin-discurso' });
    const r = e.step({ agendaGap: 0.2 });
    expect(r.discordanciaDiscursiva).toBe(0);
  });

  test('un discurso incongruente con el arquetipo genera más presión que uno congruente, ' +
       'manteniendo todo lo demás igual -- histeria (sesgo fuerte hacia historica) bajo ' +
       'universitario (su discurso menos congruente) acumula más P', () => {
    function correr(discurso){
      const e = new Engine({ archetype: 'histeria', seed: 'wiring-test' });
      let r;
      for (let t = 0; t < 10; t++) r = e.step({ agendaGap: 0.2, discurso });
      return r.P;
    }
    const sinDiscurso = correr(undefined);
    const congruente = correr('historica');
    const incongruente = correr('universitario');
    expect(congruente).toBeGreaterThan(sinDiscurso); // hasta el mejor ajuste (0.55) deja tensión residual
    expect(incongruente).toBeGreaterThan(congruente);
  });

  test('un nombre de discurso inválido no crashea -- contribuye discordancia 0, mismo criterio ' +
       'de robustez que el resto del motor ante entradas malformadas', () => {
    const e = new Engine({ archetype: 'histeria', seed: 'discurso-invalido' });
    const r = e.step({ agendaGap: 0.2, discurso: 'no_existe' });
    expect(r.discordanciaDiscursiva).toBe(0);
    expect(Number.isNaN(r.P)).toBe(false);
  });

  test('determinismo se preserva con discurso variable turno a turno', () => {
    const signals = ['amo', 'universitario', 'analista', 'historica', null, 'amo'];
    const e1 = new Engine({ archetype: 'paranoia', seed: 'det-disc' });
    const e2 = new Engine({ archetype: 'paranoia', seed: 'det-disc' });
    const t1 = signals.map(d => e1.step({ agendaGap: 0.3, discurso: d }));
    const t2 = signals.map(d => e2.step({ agendaGap: 0.3, discurso: d }));
    expect(t1).toEqual(t2);
  });

  test('peor caso: discurso más incongruente de cada arquetipo + señales al máximo sostenidas ' +
       '2000 turnos, S(t) se mantiene en [0,1] sin excepción, los 7 arquetipos', () => {
    for (const arch of TODOS_LOS_ARQUETIPOS){
      const pesos = DISCOURSE_BIAS[arch].pesos;
      const masIncongruente = Object.entries(pesos).sort((a, b) => a[1] - b[1])[0][0];
      const e = new Engine({ archetype: arch, seed: 'peor-' + arch });
      for (let t = 0; t < 2000; t++){
        const r = e.step({ aperture: 1, closure: 1, fantasy: 1, elaboration: 1, symptom: 1,
                            agendaGap: 1, discurso: masIncongruente });
        for (const k of ['E', 'T', 'A', 'C', 'G', 'P', 'rho']){
          expect(Number.isNaN(r[k])).toBe(false);
          expect(r[k]).toBeGreaterThanOrEqual(0);
          expect(r[k]).toBeLessThanOrEqual(1);
        }
      }
    }
  });
});

describe('irrupción — sanidad de la sigmoide y alcanzabilidad de theta_irr', () => {
  function pIrrupcion(A, G){
    const k = 6, thetaAG = 0.9;
    return 1 / (1 + Math.exp(-k * (A + G - thetaAG)));
  }
  test('la sigmoide es monótona creciente y nunca toca exactamente 0 o 1', () => {
    const p0 = pIrrupcion(0, 0), pMid = pIrrupcion(0.45, 0.45), pMax = pIrrupcion(1, 1);
    expect(p0).toBeGreaterThan(0);
    expect(pMax).toBeLessThan(1);
    expect(p0).toBeLessThan(pMid);
    expect(pMid).toBeLessThan(pMax);
    expect(pMid).toBeCloseTo(0.5, 6);
  });

  test('los 7 theta_irr son alcanzables bajo agendaGap sostenido, ninguno es un umbral muerto', () => {
    for (const arch of TODOS_LOS_ARQUETIPOS){
      const theta = ARCHETYPES[arch].theta_irr;
      const e = new Engine({ archetype: arch, seed: 'reach-' + arch });
      let alcanzado = false;
      for (let t = 0; t < 200 && !alcanzado; t++){
        const r = e.step({ agendaGap: 1 });
        if (r.P >= theta) alcanzado = true;
      }
      expect(alcanzado).toBe(true);
    }
  });
});
