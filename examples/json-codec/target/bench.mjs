import { readFileSync } from 'node:fs';

const corpus = JSON.parse(readFileSync(new URL('./corpus.json', import.meta.url)));
const { encode } = await import('./codec.js');

// Gate 1: exact match with native JSON.stringify on every corpus entry.
let mismatches = 0;
for (const entry of corpus) {
	if (encode(entry) !== JSON.stringify(entry)) mismatches++;
}
if (mismatches > 0) {
	console.log(`GATE exact-match FAIL (${mismatches}/${corpus.length} differ)`);
	process.exit(1);
}
console.log(`GATE exact-match PASS (${corpus.length}/${corpus.length})`);

// Benchmark: wall time to encode the whole corpus x200, 5 reps, geomean.
const times = [];
for (let r = 0; r < 5; r++) {
	const start = performance.now();
	for (let n = 0; n < 200; n++) for (const entry of corpus) encode(entry);
	times.push(performance.now() - start);
}
const geomean = Math.exp(times.reduce((a, t) => a + Math.log(t), 0) / times.length);
console.log(`SCORE codec ${geomean.toFixed(3)} ms`);
