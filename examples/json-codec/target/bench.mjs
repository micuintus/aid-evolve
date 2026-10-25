import { readFileSync } from 'node:fs';

const corpus = JSON.parse(readFileSync(new URL('./corpus.json', import.meta.url)));
const expected = corpus.map((entry) => JSON.stringify(entry));

// The encoder must be written by hand: delegating to the built-in serializer
// would pass the exact-match gate trivially. Trap it before codec.js loads, so
// any path to it from codec.js throws instead.
let builtinCalls = 0;
JSON.stringify = () => {
	builtinCalls++;
	throw new Error('codec.js must not use the built-in JSON serializer');
};

const { encode } = await import('./codec.js');

// Gate 1: exact match with the built-in serializer on every corpus entry.
let mismatches = 0;
for (let i = 0; i < corpus.length; i++) {
	let out;
	try {
		out = encode(corpus[i]);
	} catch {
		out = undefined;
	}
	if (out !== expected[i]) mismatches++;
}
if (builtinCalls > 0) {
	console.log('GATE hand-written FAIL (codec.js called the built-in serializer)');
	process.exit(1);
}
console.log('GATE hand-written PASS');
if (mismatches > 0) {
	console.log(`GATE exact-match FAIL (${mismatches}/${corpus.length} differ)`);
	process.exit(1);
}
console.log(`GATE exact-match PASS (${corpus.length}/${corpus.length})`);

// Score: wall time for 200 passes over the corpus, 5 runs, geometric mean.
const times = [];
for (let r = 0; r < 5; r++) {
	const start = performance.now();
	for (let n = 0; n < 200; n++) for (const entry of corpus) encode(entry);
	times.push(performance.now() - start);
}
const geomean = Math.exp(times.reduce((a, t) => a + Math.log(t), 0) / times.length);
console.log(`SCORE codec ${geomean.toFixed(3)} ms`);
