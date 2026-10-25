# LedgerEvolve

Judgement-driven code evolution for [Pi](https://pi.dev), sized for one
developer on one workstation.

An experiment is one Markdown file, `evolve.md`: goal, metric, gates,
stop conditions, optional models, and a ledger. Each iteration is a
fresh subagent that reads the whole ledger, decides whether to refine
a prior candidate, combine two, or try something unrelated, builds it
on its own git branch, gates it, benchmarks it once, and appends one
row. No program database, no islands, no evaluator pool: the ledger
and the branches are the whole state, and you can read both.

How it compares to AlphaEvolve, OpenEvolve, ShinkaEvolve, CodeEvolve
and Karpathy's autoresearch, with evidence from 325 ledger rows on a
production renderer and the measured token cost:
[technical report](paper/ledgerevolve.md).

## Install

```sh
pi install git:github.com/micuintus/ledgerevolve
pi install git:github.com/edxeth/pi-subagents
```

or `pi install npm:@micuintus/ledgerevolve`. Recommended underneath, so
a rate-limited or exhausted model falls through to the next instead of
stalling a run: `pi install npm:@alexeiled/pi-model-router`.

LedgerEvolve delegates each iteration to `edxeth/pi-subagents` through
an agent definition without a persona. Create
`~/.pi/agent/agents/evolve-iteration.md` (the `evolve-init` skill
offers to):

```markdown
---
name: evolve-iteration
description: Plain agent for exactly one evolve iteration (no persona, auto-exit). Not for other tasks.
mode: interactive
auto-exit: true
---
```

## Try it

```sh
sh examples/json-codec/setup.sh ~/json-codec-run
cd ~/json-codec-run && pi
```

Then type `/evolve`. The example evolves a deliberately slow JSON
encoder against a byte-exact gate; see
[`examples/json-codec`](examples/json-codec/README.md).

## Your own experiment

1. Put the code to evolve in `target/`, as its own git repository.
2. Ask Pi to set up an evolve experiment. The `evolve-init` skill
   interviews you and writes `evolve.md` next to `target/`.
3. `/evolve` starts the loop, `/evolve <hint>` biases the first
   iteration, `/evolve stop` stops it. The `evolve` tool does the same
   for the agent.

Spend more time on the metric than on anything else: a metric with
two flanks, frozen ground truth with a holdout set, and a measured
noise band (section 5 of the report) is what makes the ledger
trustworthy.

## Engines

LedgerEvolve is built against specific engines and says so. Iterations
run through `edxeth/pi-subagents` (spawn tool `subagent`, `auto-exit`
agent definitions); the orchestrator checks for a spawn tool first and
stops the run instead of stalling if none exists. The engine was chosen
for its inspectable child sessions, parent-model inheritance and clean
self-termination; the comparison is in the
[Pi ecosystem subagent survey](https://github.com/micuintus/pi-ecosystem-wiki/blob/main/ecosystem/subagent-extensions.md).
The loop driver comes from
[`@micuintus/loop-driver`](https://github.com/micuintus/loop-driver).

## History

LedgerEvolve was developed from May 2026 inside `pi-dacmicu`, which
this repository was renamed from. The TODO loop moved to
[EnforcedTodo](https://github.com/micuintus/enforced-todo). The last
combined state, including the experimental `callback` extension, is
tagged `dacmicu-final`.

## Development

```sh
npm install
npm run check
npm test
```

## Citing

Voigt, M. (2026). *LedgerEvolve: Judgement-Driven Code Evolution for a
Single Developer.* Technical report.
https://github.com/micuintus/ledgerevolve/blob/main/paper/ledgerevolve.md
