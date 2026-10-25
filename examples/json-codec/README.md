# Example: JSON encoder speedup

A small, complete LedgerEvolve experiment that runs anywhere Node 20+
runs, in minutes per iteration.

- `target/codec.js`: a correct but deliberately slow JSON encoder.
- `target/bench.mjs`: two gates (the encoder may not call the built-in
  serializer, which the script traps; output byte-identical to
  `JSON.stringify` on all 14 corpus entries) and the score (wall time for 200 passes over the
  corpus, 5-run geometric mean).
- `evolve.md`: goal, metric, gates, termination, models, empty ledger.

## Run

```sh
sh setup.sh ~/json-codec-run   # copies the example, makes target/ a git repo, prints the baseline
cd ~/json-codec-run
pi                             # then: /evolve
```

`setup.sh` exists because iterations create branches inside
`target/`, so `target/` must be its own repository, not a folder
inside this one.

The baseline scores about 36.5 ms on an Apple M-series laptop; a
straightforward hand-optimized encoder reaches about 10.5 ms. The
termination rules stop the run after 12 rows, after four rows without
improvement, or early at 10 ms.
