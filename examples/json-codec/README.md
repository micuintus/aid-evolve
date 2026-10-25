# json-codec-speedup example

The try-it-now example for LedgerEvolve. A naive but correct manual
JSON serializer (`target/codec.js`) plus a gate plus benchmark
(`target/bench.mjs`), a fixed 14-entry corpus, and an `evolve.md`
with metric, gates, termination, and a Models section.

Run it:

1. `cd examples/json-codec` (the `target/` layout is required).
2. Ask Pi to prepare the run (evolve-init skill), or read `evolve.md`.
3. `/evolve` to start, `/evolve stop` to stop.

Baseline on the author's machine: gate passes 14/14, score ~36.5 ms.
A good run finds 25%+ within the 12-row budget.
