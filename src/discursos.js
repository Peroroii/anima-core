'use strict';
// ── Los cuatro discursos (Lacan, Seminario XVII) ──
// Matriz formal de cuatro posiciones estructurales fijas (agente, otro,
// verdad, producción), ocupadas rotativamente por cuatro términos
// (S1 significante amo, S2 saber, $ sujeto dividido, a objeto).
//
// Distinción de diseño (CSD/ANIMA, jul 2026): discurso ≠ arquetipo
// clínico. Los cuatro discursos describen QUÉ FUNCIÓN ocupa QUÉ LUGAR en
// un intercambio dado — son dinámicos, cambian turno a turno. Los siete
// arquetipos clínicos de este mismo paquete (ARCHETYPES en
// archetypes.js) describen CÓMO se habita esa posición — son más
// estables, parametrizan theta_irr/kC/kRho. Son dos ejes ortogonales,
// no dos taxonomías compitiendo por el mismo objeto: un arquetipo
// histérico puede hablar, en un turno dado, desde el discurso del Amo.
//
// Codificado como LOOKUP verificado, no como generador — la regla de
// rotación se comprobó algebraicamente contra la tabla del Seminario
// XVII antes de escribir esta estructura, en vez de derivarla de
// memoria y arriesgar una permutación mal construida. El generador
// (TERM_CYCLE + rotarTermino) queda como chequeo de consistencia
// interno, no como fuente de verdad — DISCURSOS es la fuente de verdad.

const TERM_CYCLE = ['S1', 'S2', 'a', '$'];

function rotarTermino(term) {
  const i = TERM_CYCLE.indexOf(term);
  if (i === -1) throw new Error(`término desconocido: ${term}`);
  return TERM_CYCLE[(i + 1) % TERM_CYCLE.length];
}

const DISCURSOS = Object.freeze({
  amo:           Object.freeze({ agente: 'S1', otro: 'S2', verdad: '$',  produccion: 'a'  }),
  universitario: Object.freeze({ agente: 'S2', otro: 'a',  verdad: 'S1', produccion: '$'  }),
  analista:      Object.freeze({ agente: 'a',  otro: '$',  verdad: 'S2', produccion: 'S1' }),
  historica:     Object.freeze({ agente: '$',  otro: 'S1', verdad: 'a',  produccion: 'S2' }),
});

// Orden real de rotación, verificado algebraicamente (no es el orden en
// que Lacan los presenta habitualmente — Amo, Universitario, Histérica,
// Analista — que NO es un ciclo consistente bajo el operador de rotación
// de cuartos de giro; el ciclo que sí cierra es Amo→Universitario→
// Analista→Histérica→Amo).
const ROTACION = ['amo', 'universitario', 'analista', 'historica'];

function siguienteDiscurso(nombre) {
  if (!DISCURSOS[nombre]) throw new Error(`discurso desconocido: ${nombre}`);
  const i = ROTACION.indexOf(nombre);
  return ROTACION[(i + 1) % ROTACION.length];
}

function anteriorDiscurso(nombre) {
  if (!DISCURSOS[nombre]) throw new Error(`discurso desconocido: ${nombre}`);
  const i = ROTACION.indexOf(nombre);
  return ROTACION[(i - 1 + ROTACION.length) % ROTACION.length];
}

// Verifica, en runtime, que DISCURSOS es efectivamente cerrado bajo la
// rotación de cuartos de giro (cada posición avanza un paso en
// TERM_CYCLE al pasar de un discurso al siguiente en ROTACION). Si esto
// alguna vez falla, la tabla o el orden de rotación tienen un error —
// mejor un throw temprano que una matriz silenciosamente inconsistente.
function verificarConsistencia() {
  for (let k = 0; k < ROTACION.length; k++) {
    const actual = DISCURSOS[ROTACION[k]];
    const siguiente = DISCURSOS[ROTACION[(k + 1) % ROTACION.length]];
    for (const pos of ['agente', 'otro', 'verdad', 'produccion']) {
      if (rotarTermino(actual[pos]) !== siguiente[pos]) {
        throw new Error(
          `inconsistencia de rotación: ${ROTACION[k]}.${pos}=${actual[pos]} ` +
          `no rota a ${siguiente[pos]} (esperado ${rotarTermino(actual[pos])})`
        );
      }
    }
  }
  return true;
}
verificarConsistencia(); // corre al importar el módulo — falla rápido, no en silencio

// Qué término ocupa el lugar de agente (lo enunciado) y cuál el de
// verdad (lo no reconocido pero determinante) para un discurso dado.
function posicionesDe(nombre) {
  if (!DISCURSOS[nombre]) throw new Error(`discurso desconocido: ${nombre}`);
  return { ...DISCURSOS[nombre] };
}

module.exports = {
  DISCURSOS, ROTACION, TERM_CYCLE,
  rotarTermino, siguienteDiscurso, anteriorDiscurso,
  posicionesDe, verificarConsistencia,
};
