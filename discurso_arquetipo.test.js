'use strict';
const { DISCOURSE_BIAS, discursoDominante, congruencia, verificarPesos } = require('./src/discurso_arquetipo');
const { ROTACION } = require('./src/discursos');
const { mulberry32 } = require('./src/rng');
const { ARCHETYPES } = require('./src/archetypes');

describe('DISCOURSE_BIAS — integridad de datos', () => {
  test('cubre exactamente los 7 arquetipos que existen en ARCHETYPES, ni más ni menos', () => {
    expect(Object.keys(DISCOURSE_BIAS).sort()).toEqual(Object.keys(ARCHETYPES).sort());
  });

  test('cada arquetipo cubre exactamente los 4 discursos y sus pesos suman 1', () => {
    for (const [arquetipo, { pesos }] of Object.entries(DISCOURSE_BIAS)) {
      expect(Object.keys(pesos).sort()).toEqual([...ROTACION].sort());
      const suma = Object.values(pesos).reduce((a, b) => a + b, 0);
      expect(suma).toBeCloseTo(1, 9);
    }
  });

  test('cada arquetipo declara un nivel de confianza -- no todas las correspondencias tienen ' +
       'el mismo respaldo teórico, y el dato lo dice explícitamente en vez de presentar las ' +
       'siete con la misma seguridad', () => {
    for (const { confianza } of Object.values(DISCOURSE_BIAS))
      expect(['alta', 'media', 'baja']).toContain(confianza);
  });

  test('histeria es la única correspondencia de confianza "alta" -- es la que Lacan nombra ' +
       'directamente en el Seminario XVII, el resto son extensiones interpretativas', () => {
    const altas = Object.entries(DISCOURSE_BIAS).filter(([, v]) => v.confianza === 'alta').map(([k]) => k);
    expect(altas).toEqual(['histeria']);
  });

  test('histeria sesga fuertemente hacia el discurso histérico -- la correspondencia que da ' +
       'nombre a la estructura', () => {
    expect(DISCOURSE_BIAS.histeria.pesos.historica).toBeGreaterThan(0.5);
  });

  test('verificarPesos() ya corrió al importar (throw temprano, no silencioso) -- llamarla de ' +
       'nuevo debe seguir devolviendo true sin efectos secundarios', () => {
    expect(verificarPesos()).toBe(true);
  });
});

describe('discursoDominante — muestreo ponderado determinístico', () => {
  test('mismo seed produce la misma secuencia exacta de discursos, siempre', () => {
    const rng1 = mulberry32('reproducibilidad-42');
    const rng2 = mulberry32('reproducibilidad-42');
    const seq1 = Array.from({ length: 20 }, () => discursoDominante('obsesion', rng1));
    const seq2 = Array.from({ length: 20 }, () => discursoDominante('obsesion', rng2));
    expect(seq1).toEqual(seq2);
  });

  test('sobre 2000 muestras, la frecuencia observada de cada discurso está cerca de su peso ' +
       'declarado (±5 puntos porcentuales) -- el muestreo respeta el sesgo, no es uniforme', () => {
    const rng = mulberry32('estadistica-1');
    const counts = { amo: 0, universitario: 0, analista: 0, historica: 0 };
    const N = 2000;
    for (let i = 0; i < N; i++) counts[discursoDominante('paranoia', rng)]++;
    for (const discurso of ROTACION) {
      const esperado = DISCOURSE_BIAS.paranoia.pesos[discurso];
      const observado = counts[discurso] / N;
      expect(Math.abs(observado - esperado)).toBeLessThan(0.05);
    }
  });

  test('arquetipo desconocido tira error explícito, no un discurso arbitrario', () => {
    expect(() => discursoDominante('inexistente', mulberry32('x'))).toThrow(/arquetipo desconocido/);
  });

  test('requiere una función rng explícita -- no genera aleatoriedad propia ni usa Math.random, ' +
       'preservando la disciplina de reproducibilidad del resto del motor', () => {
    expect(() => discursoDominante('histeria')).toThrow(/rng/);
  });
});

describe('congruencia — misma fuente de verdad que DISCOURSE_BIAS, sin fórmula nueva', () => {
  test('congruencia(arquetipo, discurso) es exactamente el peso declarado, no un cálculo derivado', () => {
    for (const [arquetipo, { pesos }] of Object.entries(DISCOURSE_BIAS))
      for (const discurso of ROTACION)
        expect(congruencia(arquetipo, discurso)).toBe(pesos[discurso]);
  });

  test('discurso desconocido tira error explícito', () => {
    expect(() => congruencia('histeria', 'inexistente')).toThrow(/discurso desconocido/);
  });
});
