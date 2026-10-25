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

- Gate hand-written: the encoder is written by hand. It never uses
  the built-in JSON serializer, directly or indirectly (`bench.mjs`
  traps it and fails the row if it is called).
- Gate exact-match: `node bench.mjs` exits 0; output is
  byte-identical to `JSON.stringify` on all 14 corpus entries.
- Gate no-deps: `target/package.json` gains no dependencies. Node
  builtins only.

## Termination

- Stop after 12 ledger rows.
- Stop early when a row scores at most 10 ms (3.5x faster than the ~36.5 ms base).
- Run at least 4 iterations before any other condition fires.
- Stop if the top score has not improved in 4 consecutive rows.

## Models

Edit this list to models you have (`pi --list-models`), or delete the
section to run every iteration on the session's model.

- opencode-go/glm-5.3-flash
- opencode-go/mimo-v2.6-pro
- anthropic/claude-opus-5-5

Selection: round-robin over the first two; use the last one when the
top score has not improved for two rows.

## Inspiration

The baseline is slow on purpose in a few places (escaping, number
formatting, string building). Finding them is part of the exercise.

## Ledger

| Branch | Parents | Score | Idea | Model |
|--------|---------|-------|------|-------|
