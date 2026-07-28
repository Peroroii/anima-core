'use strict';
// ── Cruce discurso × arquetipo ──
// Item pendiente desde que se implementaron los cuatro discursos
// (v0.3.0): los discursos (dinámicos, por turno) y los arquetipos
// (estables, por sesión) son dos ejes ortogonales que hasta ahora
// convivían sin cruzarse. Este módulo implementa la propuesta original
// del manifiesto: tratar el arquetipo como un PRIOR que sesga qué
// discurso es más probable que ocupe — sesgo, no destino. Un arquetipo
// histérico puede hablar, en un turno dado, desde el discurso del Amo;
// esto solo dice qué es más frecuente, no qué es necesario.
//
// Disciplina de honestidad teórica, explícita en los datos, no solo en
// el comentario: cada entrada de DISCOURSE_BIAS lleva un campo
// `confianza` porque las siete correspondencias NO tienen el mismo
// respaldo. El discurso de la histérica es UNA CORRESPONDENCIA DIRECTA
// que Lacan nombra así en el Seminario XVII — no es una hipótesis de
// este programa. El resto son extensiones interpretativas, con más o
// menos anclaje en la clínica lacaniana establecida, y la marca de
// confianza lo dice sin ambigüedad en vez de presentar las siete con la
// misma seguridad.
const { DISCURSOS, ROTACION } = require('./discursos');
const { mulberry32 } = require('./rng');

// alta: correspondencia directa nombrada por Lacan.
// media: lectura clínica bien establecida (dominio/intelectualización
//   obsesiva, objeto fóbico como significante ancla), pero es una
//   extensión interpretativa, no una correspondencia que Lacan formalizó
//   él mismo como hizo con la histeria.
// baja: genuinamente especulativo. El marco de los cuatro discursos
//   presupone un sujeto barrado ($, castración) — extenderlo a
//   estructuras psicótico-adyacentes (paranoia, esquizofrenia), donde
//   el concepto lacaniano relevante es la forclusión y no la represión,
//   estira el marco más allá de donde Lacan lo aplicó. Incluido para
//   completar el modelo y volverlo testeable/falsable, no presentado
//   como teoría establecida.
const DISCOURSE_BIAS = Object.freeze({
  histeria: {
    confianza: 'alta',
    pesos: Object.freeze({ historica: 0.55, amo: 0.15, universitario: 0.15, analista: 0.15 }),
  },
  obsesion: {
    confianza: 'media',
    pesos: Object.freeze({ universitario: 0.40, amo: 0.35, historica: 0.15, analista: 0.10 }),
  },
  fobia: {
    confianza: 'media',
    pesos: Object.freeze({ amo: 0.45, universitario: 0.20, historica: 0.20, analista: 0.15 }),
  },
  melancolia: {
    confianza: 'baja',
    pesos: Object.freeze({ analista: 0.35, historica: 0.25, universitario: 0.20, amo: 0.20 }),
  },
  paranoia: {
    confianza: 'baja',
    pesos: Object.freeze({ universitario: 0.35, amo: 0.30, historica: 0.20, analista: 0.15 }),
  },
  esquizofrenia: {
    confianza: 'baja',
    pesos: Object.freeze({ analista: 0.30, historica: 0.25, amo: 0.25, universitario: 0.20 }),
  },
  perversion: {
    confianza: 'baja',
    pesos: Object.freeze({ analista: 0.40, amo: 0.25, universitario: 0.20, historica: 0.15 }),
  },
});

// Chequeo de consistencia en runtime, mismo patrón que discursos.js:
// cada arquetipo debe cubrir los 4 discursos y sumar 1 — falla rápido
// al importar en vez de quedar silenciosamente mal calibrado.
function verificarPesos() {
  for (const [arquetipo, { pesos }] of Object.entries(DISCOURSE_BIAS)) {
    const claves = Object.keys(pesos).sort();
    const esperadas = [...ROTACION].sort();
    if (JSON.stringify(claves) !== JSON.stringify(esperadas)) {
      throw new Error(`${arquetipo}: DISCOURSE_BIAS no cubre exactamente los 4 discursos`);
    }
    const suma = Object.values(pesos).reduce((a, b) => a + b, 0);
    if (Math.abs(suma - 1) > 1e-9) {
      throw new Error(`${arquetipo}: los pesos de DISCOURSE_BIAS suman ${suma}, no 1`);
    }
  }
  return true;
}
verificarPesos(); // corre al importar — mismo principio que verificarConsistencia() en discursos.js

// Muestreo ponderado determinístico de qué discurso domina para un
// arquetipo dado, en un turno dado. Reutiliza mulberry32 (el mismo PRNG
// que ya usa engine.js para la irrupción) — mismo criterio de
// reproducibilidad: mismo seed, misma secuencia, siempre.
function discursoDominante(arquetipo, rng) {
  if (!DISCOURSE_BIAS[arquetipo]) throw new Error(`arquetipo desconocido: ${arquetipo}`);
  if (typeof rng !== 'function') throw new Error('discursoDominante requiere una función rng (ver mulberry32)');
  const pesos = DISCOURSE_BIAS[arquetipo].pesos;
  const r = rng();
  let acumulado = 0;
  for (const discurso of ROTACION) {
    acumulado += pesos[discurso];
    if (r < acumulado) return discurso;
  }
  return ROTACION[ROTACION.length - 1]; // borde de redondeo flotante
}

// Congruencia arquetipo↔discurso: qué tan "en su lugar" está un
// arquetipo ocupando un discurso dado — el peso mismo del sesgo, 0 a 1.
// Deliberadamente NO se inventa una fórmula nueva: la congruencia es el
// propio dato de DISCOURSE_BIAS, para no crear dos fuentes de verdad
// sobre lo mismo.
function congruencia(arquetipo, discurso) {
  if (!DISCOURSE_BIAS[arquetipo]) throw new Error(`arquetipo desconocido: ${arquetipo}`);
  if (!DISCURSOS[discurso]) throw new Error(`discurso desconocido: ${discurso}`);
  return DISCOURSE_BIAS[arquetipo].pesos[discurso];
}

module.exports = {
  DISCOURSE_BIAS, discursoDominante, congruencia, verificarPesos,
};
