# Evolve: json-codec-speedup

## Goal

Make `encode` in `target/codec.js` as fast as possible. The baseline
is a correct but deliberately naive manual JSON serializer. Any
technique is allowed as long as every gate passes.

## Metric

- Primary: codec (ms, wall time for 200 corpus passes, 5-rep geomean), lower is better

Run `node bench.mjs` inside `target/`; it prints `SCORE codec <ms>`.

## Base

main

## Gates

- Gate exact-match: `node bench.mjs` exits 0 (`GATE exact-match PASS`
  on all 14 corpus entries, byte-identical to native `JSON.stringify`).
- Gate no-deps: `target/package.json` gains no dependencies. Node
  builtins only.

## Termination

- Stop after 12 ledger rows.
- Stop early when a row scores at most 27 ms (25% under the ~36.5 ms base).
- Run at least 4 iterations before any other condition fires.
- Stop if the top score has not improved in 4 consecutive rows.

## Models

Cheap high-throughput models first (any OpenCode Go flash-class
model); escalate to a frontier model when the top score stalls for 2
rows. Pi's model router recommended so a dead provider pauses nothing.

## Inspiration

Fast paths for short strings, join batching instead of `+=`, number
formatting without intermediate arrays, lookup tables for escapes.
(none beyond that.)

## Ledger

| Branch | Parents | Score | Idea |
|--------|---------|-------|------|
