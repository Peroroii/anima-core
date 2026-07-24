'use strict';
const {
  DISCURSOS, ROTACION, TERM_CYCLE, rotarTermino, siguienteDiscurso,
  anteriorDiscurso, posicionesDe, verificarConsistencia,
} = require('./src/discursos');

describe('DISCURSOS — la tabla en sí', () => {
  test('los cuatro discursos existen con sus cuatro posiciones', () => {
    for (const nombre of ['amo', 'universitario', 'analista', 'historica']) {
      expect(DISCURSOS[nombre]).toBeDefined();
      for (const pos of ['agente', 'otro', 'verdad', 'produccion']) {
        expect(TERM_CYCLE).toContain(DISCURSOS[nombre][pos]);
      }
    }
  });

  test('discurso del Amo coincide con el Seminario XVII: S1 agente, S2 otro, $ verdad, a producción', () => {
    expect(DISCURSOS.amo).toEqual({ agente: 'S1', otro: 'S2', verdad: '$', produccion: 'a' });
  });

  test('discurso de la Histérica: $ agente, S1 otro, a verdad, S2 producción', () => {
    expect(DISCURSOS.historica).toEqual({ agente: '$', otro: 'S1', verdad: 'a', produccion: 'S2' });
  });

  test('cada discurso usa cada uno de los cuatro términos exactamente una vez', () => {
    for (const nombre of Object.keys(DISCURSOS)) {
      const usados = Object.values(DISCURSOS[nombre]).slice().sort();
      expect(usados).toEqual([...TERM_CYCLE].sort());
    }
  });

  test('la tabla es inmutable (Object.freeze)', () => {
    expect(() => { DISCURSOS.amo.agente = 'X'; }).toThrow();
    expect(DISCURSOS.amo.agente).toBe('S1');
  });
});

describe('rotarTermino — el ciclo S1→S2→a→$→S1', () => {
  test('rota en el orden correcto', () => {
    expect(rotarTermino('S1')).toBe('S2');
    expect(rotarTermino('S2')).toBe('a');
    expect(rotarTermino('a')).toBe('$');
    expect(rotarTermino('$')).toBe('S1');
  });
  test('cuatro rotaciones vuelven al origen', () => {
    let t = 'S1';
    for (let i = 0; i < 4; i++) t = rotarTermino(t);
    expect(t).toBe('S1');
  });
  test('término desconocido tira error', () => {
    expect(() => rotarTermino('X')).toThrow();
  });
});

describe('verificarConsistencia — la matriz cierra algebraicamente', () => {
  test('no tira error (la tabla es consistente con el operador de rotación)', () => {
    expect(() => verificarConsistencia()).not.toThrow();
    expect(verificarConsistencia()).toBe(true);
  });

  test('detecta una tabla inconsistente si se rompe (prueba negativa directa)', () => {
    // reconstruye la función de verificación con una tabla corrupta a propósito,
    // para probar que el chequeo realmente detecta inconsistencias y no
    // siempre pasa por accidente.
    const rota = (t) => TERM_CYCLE[(TERM_CYCLE.indexOf(t) + 1) % TERM_CYCLE.length];
    const tablaCorrupta = {
      amo: { agente: 'S1', otro: 'S2', verdad: '$', produccion: 'a' },
      universitario: { agente: 'S2', otro: 'a', verdad: 'S1', produccion: 'S1' }, // producción mal
    };
    const rotacionCorrupta = ['amo', 'universitario'];
    function verificarCorrupta(){
      for (let k = 0; k < rotacionCorrupta.length; k++) {
        const actual = tablaCorrupta[rotacionCorrupta[k]];
        const siguiente = tablaCorrupta[rotacionCorrupta[(k + 1) % rotacionCorrupta.length]];
        for (const pos of ['agente','otro','verdad','produccion']) {
          if (rota(actual[pos]) !== siguiente[pos]) throw new Error('inconsistente');
        }
      }
    }
    expect(() => verificarCorrupta()).toThrow();
  });
});

describe('siguienteDiscurso / anteriorDiscurso — el orden real de rotación', () => {
  test('el ciclo verificado es amo → universitario → analista → historica → amo', () => {
    expect(siguienteDiscurso('amo')).toBe('universitario');
    expect(siguienteDiscurso('universitario')).toBe('analista');
    expect(siguienteDiscurso('analista')).toBe('historica');
    expect(siguienteDiscurso('historica')).toBe('amo');
  });

  test('NO es el orden en que suelen listarse (amo, universitario, histérica, analista) — ' +
       'ese orden no cierra bajo el operador de rotación de cuartos de giro', () => {
    expect(siguienteDiscurso('universitario')).not.toBe('historica');
  });

  test('anteriorDiscurso deshace siguienteDiscurso', () => {
    for (const nombre of ROTACION) {
      expect(anteriorDiscurso(siguienteDiscurso(nombre))).toBe(nombre);
      expect(siguienteDiscurso(anteriorDiscurso(nombre))).toBe(nombre);
    }
  });

  test('cuatro pasos hacia adelante vuelven al mismo discurso', () => {
    let d = 'amo';
    for (let i = 0; i < 4; i++) d = siguienteDiscurso(d);
    expect(d).toBe('amo');
  });

  test('discurso desconocido tira error en ambas direcciones', () => {
    expect(() => siguienteDiscurso('inexistente')).toThrow();
    expect(() => anteriorDiscurso('inexistente')).toThrow();
  });
});

describe('posicionesDe', () => {
  test('devuelve una copia, no la referencia interna (no permite mutar DISCURSOS)', () => {
    const p = posicionesDe('amo');
    p.agente = 'X';
    expect(DISCURSOS.amo.agente).toBe('S1');
  });
  test('el lugar de la verdad es lo que el discurso no reconoce como propio', () => {
    // en el discurso del Amo, lo que gobierna (la verdad) es el sujeto
    // dividido $ -- el amo no se sabe dividido, eso es justamente lo reprimido
    expect(posicionesDe('amo').verdad).toBe('$');
    expect(posicionesDe('amo').agente).not.toBe(posicionesDe('amo').verdad);
  });
});
