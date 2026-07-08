const { Engine } = require('./index.js');
const e = new Engine({ archetype: 'paranoia', seed: 'demo-42' });
console.log('anima-core demo — paranoid agent under mounting pressure\n');
console.log('turn |    P    |   rho   |  irrupt');
for (let t=0; t<12; t++){
  const s = e.step({ fantasy: 1, agendaGap: 0.9, closure: 0.2 });
  console.log(`  ${String(t+1).padStart(2)} |  ${s.P.toFixed(3)}  |  ${s.rho.toFixed(3)}  |  ${s.irruption?'★ YES':'  no'}`);
}
