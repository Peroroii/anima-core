'use strict';
// ── Barrido sistemático del espacio de señales ──
// P2 de la hoja de ruta de arquitectura (revisión post-v0.5.0): los
// hallazgos de hoy (el bug de rho_floor, la dirección del término de
// discordancia discursiva) se encontraron con scripts sueltos escritos
// a mano para esa pregunta puntual, no con nada reusable. Este módulo
// reemplaza esos scripts por una herramienta permanente: recorre una
// grilla del espacio de señales por arquetipo, deja correr cada
// combinación a régimen, y chequea invariantes concretos y ya
// justificados por la propia historia del proyecto — no "cualquier
// cosa que se vea rara", que es indetectable en general, sino las tres
// preguntas que YA demostraron dar sorpresas reales:
//
//   1. límites — S(t) nunca sale de [0,1] (ya se verificaba a mano en
//      engine.stress.test.js; acá se generaliza a una grilla completa
//      en vez de un puñado de casos elegidos)
//   2. estabilización — ¿la trayectoria se asienta dentro del
//      horizonte dado, o sigue cambiando sin converger? (pregunta
//      nueva, nunca antes chequeada sistemáticamente)
//   3. rho_floor — ¿rho cruza alguna vez por DEBAJO del floor
//      declarado del arquetipo? (RESUELTO v0.6.0, mismo día: sí, a
//      propósito, vía irrupción — el floor solo protege la erosión por
//      elaboración, no rho en general. cruceDeFloor sigue reportado
//      como observabilidad de ese comportamiento esperado, no como
//      sospecha de bug — ver el comentario de rho_floor en
//      archetypes.js para el razonamiento completo)
//
// Deliberadamente NO intenta detectar "comportamiento inesperado" en
// abstracto — cada chequeo tiene una razón concreta de por qué importa,
// documentada arriba de su implementación.
const { Engine } = require('./engine');
const { ARCHETYPES } = require('./archetypes');

const NIVELES = [0, 0.5, 1]; // grilla por señal: bajo/medio/alto
const SEÑALES_NUMERICAS = ['aperture', 'closure', 'fantasy', 'elaboration', 'symptom', 'agendaGap'];

// Genera todas las combinaciones de NIVELES para las 6 señales numéricas
// (3^6 = 729 combinaciones). fantasy se trata igual que las demás acá
// (0/0.5/1) aunque en el signal vector real suele ser binaria — el
// barrido cubre el espacio continuo completo, no solo el uso típico.
function* combinacionesDeSeñales(){
  const n = SEÑALES_NUMERICAS.length;
  const total = NIVELES.length ** n;
  for (let i = 0; i < total; i++){
    const combo = {};
    let resto = i;
    for (let j = 0; j < n; j++){
      combo[SEÑALES_NUMERICAS[j]] = NIVELES[resto % NIVELES.length];
      resto = Math.floor(resto / NIVELES.length);
    }
    yield combo;
  }
}

// Corre una combinación de señales a régimen (maxTurns) y devuelve la
// trayectoria completa + si se estabilizó dentro del horizonte.
// "Estabilizado" = las últimas VENTANA_ESTABILIZACION lecturas de cada
// variable de estado varían menos que EPSILON entre sí.
const VENTANA_ESTABILIZACION = 20;
const EPSILON_ESTABILIZACION = 0.001;

function correrARegimen(archetype, señales, maxTurns, seed){
  const e = new Engine({ archetype, seed });
  const trayectoria = [];
  for (let t = 0; t < maxTurns; t++) trayectoria.push(e.step(señales));

  const ultimos = trayectoria.slice(-VENTANA_ESTABILIZACION);
  let estabilizado = ultimos.length === VENTANA_ESTABILIZACION;
  if (estabilizado){
    for (const k of ['E','T','A','C','G','P','rho']){
      const valores = ultimos.map(s => s[k]);
      const rango = Math.max(...valores) - Math.min(...valores);
      if (rango > EPSILON_ESTABILIZACION) { estabilizado = false; break; }
    }
  }
  return { trayectoria, estabilizado };
}

// Barre un arquetipo completo: 729 combinaciones, cada una a régimen.
// maxTurns bajo por defecto (300) para que el barrido completo (7
// arquetipos × 729 combos) termine en segundos, no minutos — subible
// vía opciones si hace falta más resolución temporal para un hallazgo
// específico.
function barrerArquetipo(archetype, { maxTurns = 300, seedBase = 'barrido' } = {}){
  if (!ARCHETYPES[archetype]) throw new Error(`arquetipo desconocido: ${archetype}`);
  const floor = ARCHETYPES[archetype].rho_floor;
  const hallazgos = { limites: [], noEstabiliza: [], cruceDeFloor: [] };
  let combosCorridos = 0;

  for (const señales of combinacionesDeSeñales()){
    combosCorridos++;
    const seed = `${seedBase}-${archetype}-${combosCorridos}`;
    const { trayectoria, estabilizado } = correrARegimen(archetype, señales, maxTurns, seed);

    for (const estado of trayectoria){
      for (const k of ['E','T','A','C','G','P','rho']){
        if (Number.isNaN(estado[k]) || estado[k] < 0 || estado[k] > 1){
          hallazgos.limites.push({ señales, turno: estado.turn, variable: k, valor: estado[k] });
        }
      }
      // el floor solo debe respetarse cuando hay elaboración activa —
      // sin elaboración no hay erosión, así que rho nunca debería NI
      // ACERCARSE al floor por otra vía; cruzarlo ahí sería un bug
      // distinto (erosión disparándose sin la señal que la motiva).
      if (estado.rho < floor - 1e-9){
        hallazgos.cruceDeFloor.push({ señales, turno: estado.turn, rho: estado.rho, floor });
      }
    }

    if (!estabilizado) hallazgos.noEstabiliza.push({ señales, ultimoEstado: trayectoria[trayectoria.length-1] });
  }

  return { archetype, combosCorridos, ...hallazgos };
}

function barrerTodosLosArquetipos(opciones){
  const resultados = {};
  for (const archetype of Object.keys(ARCHETYPES)) resultados[archetype] = barrerArquetipo(archetype, opciones);
  return resultados;
}

module.exports = {
  NIVELES, SEÑALES_NUMERICAS, VENTANA_ESTABILIZACION, EPSILON_ESTABILIZACION,
  combinacionesDeSeñales, correrARegimen, barrerArquetipo, barrerTodosLosArquetipos,
};
