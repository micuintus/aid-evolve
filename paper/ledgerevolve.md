# Ledger-Guided Code Evolution on a Single Workstation

Technical Report — LedgerEvolve

Michael Voigt (micu)

## Abstract

We describe a lightweight evolutionary loop for code optimization
in which an LLM judges and decides each step: it refines the best
row, combines two rows, or diverges somewhere new, over a
human-readable ledger of lineages. An experiment is one Markdown
file; each iteration is one subagent run producing one git branch
and one ledger row. Gates precede benchmarks; failed variants are
retained as evidence. The system was validated on a synthetic
benchmark and deployed on a production audio renderer (17 ledger
rows, measured speedups with quality held). Total cost is bounded by
iteration count times single-model calls, a fraction of
population-based runs.

## The problem

Evolutionary code optimization works, but its packaging assumes a
lab. FunSearch runs a distributed system: a programs database, 15
LLM samplers, and evaluators communicating asynchronously. AlphaEvolve
orchestrates an ensemble of Gemini Flash (breadth) and Gemini Pro
(depth) through staged evaluation gates, tracked as a persistent
server-side campaign resource. OpenEvolve, its open reimplementation,
keeps the shape: a 500-program database across 5 islands, an LLM
ensemble proposing edits, an evaluator pool scoring them, an async
controller maximizing throughput (460 generations for circle packing
n=26). ShinkaEvolve (Sakana AI, ICLR 2026) cuts the sample cost to
150 samples for the same problem, but keeps the harness:
bandit-based ensemble selection, novelty rejection sampling,
parent-sampling schedules. All of them optimize the *search*, and all
of them need operating. This system ran 17 ledger rows to a
production renderer speedup with one subagent at a time on one
workstation.

A single developer with one workstation needs the opposite trade:
almost no infrastructure, full inspectability, and the human setting
the fitness function. That is this system.

## Related work

**Program evolution with LLMs.** FunSearch (DeepMind, Nature 2023)
evolves programs against an `evaluate` function from a seed, sampling
high scorers from a programs database into the next prompt. AlphaEvolve
scales this to whole codebases with an LLM ensemble and staged
evaluation gates. OpenEvolve reimplements it openly (islands, program
database, async controller). ShinkaEvolve adds sample efficiency
(parent sampling, novelty rejection, bandit ensemble choice).

**Reflection over scalars.** GEPA (Berkeley, ICLR 2026) observes that
classical optimizers collapse traces into one number; it has the LLM
read full execution traces to diagnose *why* a candidate failed. This
system's ledger rows do the same job in prose: each row records what
was tried, what it measured, and what was refuted.

**Self-improving agents.** Darwin-Gödel Machine evolves the agent
itself rather than a target program. Karpathy's `autoresearch` gives
one agent one file, one GPU, one metric (`val_bpb`), overnight. The
closest Pi-native relative is `pi-evo-research`, which keeps an
explicit population of hypotheses with novelty injection against
stagnation.

**Position.** This system sits between Karpathy's single-file loop and
OpenEvolve's population machinery: multi-file real codebases explored
as a network of lineages rather than islands, steered by LLM
judgement rather than a genetic algorithm, with shell-measured
benchmarks instead of an evaluator pool and a Markdown ledger instead
of a program database. Nothing here is novel in isolation. The
combination, and the token bill, is the point.

## Method

An experiment is one file, `evolve.md`: Goal, Metric (one primary,
direction-tagged), Base branch, Gates (cheapest and most likely to
fail first; each a shell command, an LLM judgement, or a manual
check), Termination (user's own words, judged each iteration),
Inspiration, and a Ledger table (`Branch | Parents | Score | Idea`).

Each iteration is one subagent run, one git branch
(`dacmicu/evolve/vN/<slug>`, N always equal to the ledger row ID),
one idea pursued to completion: study the ledger, branch, change,
gate on this variant only, benchmark once, append exactly one row,
self-terminate. Failed iterations stay as `GATE_FAILED` rows; a crash
that appends nothing pauses the loop instead of racing ahead. The
orchestrator never evolves anything itself; it judges termination and
spawns.

Three rules carry the design: gates before benchmarks (a variant that
fails correctness never spends benchmark time), one shot per idea (no
mid-iteration chasing), and full traceability (every row maps to one
inspectable git branch).

Three principles, stated plainly. First, one user, one workstation:
no island farm, no evaluator pool, no persistent campaign server.
Second, many minds over a network of lineages: each iteration sees
every prior idea, score, and refutation, and the LLM decides whether
to refine the best row, combine two rows, or diverge somewhere
entirely new. This is judgement, not a genetic operator and not
hill-climbing: hill-climbing alone narrows the search to whatever
worked first, so the loop prompts for the unrelated idea on purpose. Third, measured judgement over scalars: gates and
benchmarks are shell-measured where possible, LLM-judged where not,
and the ledger records prose reasons next to numbers.

A fourth element is model diversity per iteration. In the renderer
runs, weaker and differently shaped models repeatedly contributed
approaches the frontier model did not produce. The loop therefore
accepts a configured model set (`## Models` in `evolve.md`: an
ordered list plus a selection note, e.g. round-robin with
frontier-model bias) and varies the worker per row. Pi's model
router is the recommended selection layer: it continues to the next
chain link on a blocked model, an exhausted subscription, or a
tight budget, so a dead provider pauses nothing.

## Evidence

**Prime counting (May 2026).** Trial division baseline (~13.8 s) to
optimized pure-Python sieve variants, with gates before scoring and a
fresh-subprocess anti-memoization metric. Established the loop
mechanics.

**proprietary real-time renderer (Jun–Oct 2026).** A production
component under hard constraints (no MSAA, no QML layers, no
compute/geometry/tessellation shaders). Seventeen ledger rows across
two runs. Measured outcomes: worst-frame zoom-in 3.56 ms to 1.62 ms
(v16 crossing-fold), GL pan cell 0.496 ms to 0.281 ms (v7
envelope-ring), quality anchors at 1.0000 against the frozen truth
throughout, refuted ideas recorded alongside wins (per-knot interior
varying, classify-first fetch skipping, fixed edge padding). One row
aborted on provider failure mid-profile and says so. Runs used a mix
of frontier models for hard iterations and cheap high-throughput
models (e.g. GLM-5.3-Flash class) for the rest, all on one developer
workstation. Exact token totals were not metered; iteration counts
(17 and ~22 rows) and the model mix bound the cost at a fraction of a
population run.

## The metric is the project

The transferable artifact is not its code (proprietary) but
its metric design, which took longer to build than any single
variant. The rules, each paid for in failed rows: two flanks that
cannot be traded silently (3% faster with quality held, or 0.5%
better with speed held); frozen ground truth with a selection plus
**holdout** split; a null protocol (base against itself scores
0.976 to 1.013, so anything inside that band is noise); a
quiet-machine rule with `LOADED` marks that soften numbers instead
of hiding them; environment failures recorded as environment (a
security-service-slowed launch is the machine's, not the variant's); and
an explicit byte-identity-doesn't-matter rule, because pixel diffs
are not regressions. Any team adopting the loop should budget more
time for the metric than for the first ten iterations.

## Limits

This is directed evolution, not open-ended evolution: one lineage,
one human-set metric, no novelty pressure beyond the Inspiration
section. It inherits Goodhart risk from any metric loop (the metric
v2 redesign mid-project is documented in the ledger's history). Gates
are only as honest as their author. Provider failures abort rows, and
the loop pauses rather than healing.

## Engines, declared not assumed

Neither loop pretends to engine-independence. The TODO loop actuates
tintinweb's `manage_todo_list` tool by name and shape; the evolve loop
spawns through `subagent`/`subagent_resume` and its prompts assume
HazAT-style self-closing lifecycles (tested with `edxeth/pi-subagents`).
Both prompts check for their engine first and stop loudly when it is
missing instead of stalling silently. The engine choices, and why
(inspectability, parent-model inheritance, self-termination), are
argued in the Pi ecosystem subagent survey, not here.

## Scope

This paper covers the evolve loop only. The deterministic TODO loop
ships separately. Ralph-loop drivers and FABRIC-style bash empowerment
are out of scope for this package.
