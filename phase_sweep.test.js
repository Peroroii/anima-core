'use strict';
const { barrerArquetipo, barrerTodosLosArquetipos, combinacionesDeSeñales,
  correrARegimen, NIVELES, SEÑALES_NUMERICAS } = require('./src/phase_sweep');
const { ARCHETYPES } = require('./src/archetypes');

describe('combinacionesDeSeñales — cobertura de la grilla', () => {
  test('genera exactamente 3^6 = 729 combinaciones (una por cada señal numérica × 3 niveles)', () => {
    const combos = [...combinacionesDeSeñales()];
    expect(combos.length).toBe(NIVELES.length ** SEÑALES_NUMERICAS.length);
    expect(combos.length).toBe(729);
  });

  test('cada combinación cubre las 6 señales numéricas, sin repetir ni faltar ninguna', () => {
    const combos = [...combinacionesDeSeñales()];
    for (const c of combos) expect(Object.keys(c).sort()).toEqual([...SEÑALES_NUMERICAS].sort());
  });

  test('no hay combinaciones duplicadas', () => {
    const combos = [...combinacionesDeSeñales()];
    const claves = new Set(combos.map(c => JSON.stringify(c)));
    expect(claves.size).toBe(combos.length);
  });
});

describe('barrerArquetipo — invariante de límites, generalizado a toda la grilla', () => {
  test('S(t) nunca sale de [0,1] en ninguna de las 729 combinaciones, los 7 arquetipos', () => {
    for (const archetype of Object.keys(ARCHETYPES)){
      const r = barrerArquetipo(archetype, { maxTurns: 100 });
      expect(r.limites).toEqual([]);
    }
  }, 30000);
});

describe('hallazgo real (v0.6.0): el floor NO protege contra la erosión por irrupción', () => {
  test('un combo con elaboration=0 sostenido igual cruza el floor de histeria, por irrupciones ' +
       'repetidas -- confirma que rho_floor solo protege la erosión vía elaboración, no rho en ' +
       'general', () => {
    const señales = { aperture: 0, closure: 0, fantasy: 0, elaboration: 0, symptom: 0, agendaGap: 0.5 };
    const { trayectoria } = correrARegimen('histeria', señales, 80, 'test-floor-gap');
    const floor = ARCHETYPES.histeria.rho_floor;
    const cruzaFloor = trayectoria.some(s => s.rho < floor - 1e-9);
    expect(cruzaFloor).toBe(true);
    // y confirma que es la irrupción, no la erosión, la causa: cada
    // caída de rho coincide con un turno de irruption=true
    let huboCaidaSinIrrupcion = false;
    for (let i = 1; i < trayectoria.length; i++){
      const cayo = trayectoria[i].rho < trayectoria[i-1].rho - 1e-9;
      if (cayo && !trayectoria[i].irruption) huboCaidaSinIrrupcion = true;
    }
    expect(huboCaidaSinIrrupcion).toBe(false);
  });

  test('la pregunta teórica queda documentada como abierta, no resuelta unilateralmente -- este ' +
       'test existe para que el barrido siga encontrando el mismo comportamiento hasta que se ' +
       'decida y se actualice la ecuación (o el test) a propósito', () => {
    const r = barrerArquetipo('esquizofrenia', { maxTurns: 150 });
    // hoy ESPERAMOS cruces de floor vía irrupción -- si algún día esto
    // da 0, es porque la ecuación cambió (o el barrido), y hay que
    // revisar por qué antes de asumir que es una mejora
    expect(r.cruceDeFloor.length).toBeGreaterThan(0);
  });
});

describe('barrerTodosLosArquetipos — cobertura completa', () => {
  test('devuelve resultados para los 7 arquetipos, ninguno de más ni de menos', () => {
    const r = barrerTodosLosArquetipos({ maxTurns: 50 });
    expect(Object.keys(r).sort()).toEqual(Object.keys(ARCHETYPES).sort());
  });
});
