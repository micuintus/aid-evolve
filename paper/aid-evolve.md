# AIDEvolve: Ledger-Based Evolution by Artificial Intelligent Design

Technical Report, version 1.0, October 2026

Michael Voigt (micu)

## Abstract

AIDEvolve is an evolutionary loop for code optimization designed
for one developer on one workstation. It replaces the population
machinery of systems such as AlphaEvolve, OpenEvolve, ShinkaEvolve and
CodeEvolve (program databases, islands, LLM ensembles, evaluator
pools) with three plain artifacts: a Markdown experiment file, a
ledger table, and one git branch per candidate. Each iteration is a
full agentic coding session that reads the entire ledger and decides,
by judgement rather than by a genetic operator, whether to refine a
prior candidate, combine two, or try something unrelated. Gates run
before benchmarks, and failed candidates stay in the ledger as
evidence. Over four months of use on a proprietary real-time renderer
the loop produced 325 ledger rows in 8 experiments. We report the
design, the evidence, the measured token cost, and the lessons about
metric design that the deployment forced.

## 1. Motivation

LLM-driven program evolution works. FunSearch [1] discovered new
mathematical constructions by sampling programs from a database into
an LLM and scoring the results. AlphaEvolve [2] extended the idea to
whole codebases with a Gemini Flash and Pro ensemble and staged
evaluation. OpenEvolve [3], ShinkaEvolve [4] and CodeEvolve [5] made
the approach open source and more sample-efficient.

These systems share an architecture: a population of programs, a
selection policy (islands, MAP-Elites archives, bandit-chosen model
ensembles), and an evaluator pool scored at high throughput. Each
candidate is typically one LLM call producing one diff. The design
maximizes the number of candidates per unit of compute, and it needs
operating.

A single developer optimizing a real codebase faces a different
budget. Candidates that matter often need profiling, reading code
across files, and running a test suite before a benchmark means
anything. That is the work of an agentic coding session, not of one
completion. AIDEvolve takes that unit seriously: few, deep
candidates instead of many shallow ones, with near-zero
infrastructure.

## 2. Design principles

**P1. One developer, one workstation.** No database server, no island
scheduler, no evaluator pool. The full state of an experiment is one
Markdown file plus git branches, readable and editable by hand.

**P2. Many agents over shared memory.** Every iteration is run by a
fresh agent that reads every prior idea, score and refutation in the
ledger, and may inspect any prior branch. It may refine a candidate,
combine two (its row names both parents), or invent something new.
Parent references turn the ledger into a network of lineages: a
directed graph with merges, not a single line and not a set of
isolated islands.

**P3. Judgement, not hill-climbing.** Selection is not
fitness-proportional and not a genetic operator. The agent judges
which direction is promising from the full record. Divergence is
explicit policy: the iteration prompt names "diverge" and "creative"
as first-class strategies alongside "refine" and "combine", because
hill-climbing alone narrows the search to whatever worked first.
The name records this choice: evolution by artificial intelligent
design.

**P4. Model diversity.** Different models produce different ideas.
The experiment file may name a set of models; iterations draw from it
(Section 3.3).

## 3. Method

### 3.1 The experiment file

An experiment is one file, `evolve.md`, with fixed sections: Goal;
Metric (one primary metric with unit and direction, optional
secondaries); Base (the git ref candidates fork from); Gates
(correctness checks ordered cheapest first, each a shell command, an
LLM judgement, or a manual check); Termination (stop conditions in
the user's own words); optional Models; Inspiration; and the Ledger:

| Branch | Parents | Score | Idea | Model |
|--------|---------|-------|------|-------|

The code under evolution lives in a `target/` directory beside the
file, so experiment metadata never mixes with candidate branches.

### 3.2 One iteration

An orchestrating agent evaluates Termination against the Ledger. If
no condition holds, it spawns exactly one subagent and ends its turn.
The subagent:

1. reads `evolve.md` and the ledger, and may check out any prior branch;
2. picks a strategy (refine, combine, diverge, invent) and commits to one idea;
3. creates branch `aid-evolve/vN/<slug>`, where N equals the new row's index;
4. implements the change and runs every Gate on this candidate only;
5. if all Gates pass, runs the benchmark once; otherwise records `GATE_FAILED:<gate>`;
6. appends exactly one ledger row and terminates.

The orchestrator is woken only by the subagent's completion. A crash
that appends no row pauses the loop rather than spawning blindly; a
duplicate-spawn guard compares ledger row counts across wakes.

### 3.3 Model selection

If `evolve.md` contains a Models section (a list of model references
plus a selection note, for example "cheap models first, escalate to a
frontier model after two stalled rows"), the orchestrator chooses a
model per iteration and passes it to the subagent, which records it
in the Model column. A model router such as `pi-model-router` [10] is
recommended underneath, so a blocked model, an exhausted subscription
or a rate limit falls through to the next model in a chain instead of
stalling the run.

## 4. Evidence

### 4.1 Synthetic: prime counting

Counting primes up to n in [80,000, 120,000] in pure Python, gated by
an exact-count check and measured in a fresh subprocess to defeat
memoization. The May 2026 pilot recorded its ledger in
`~/devel/evolve-test/evolve.md`: baseline trial division took about
13.8 s; the third row (odd-only sieve) reached 0.19 ms. This run
validated the loop mechanics, not the search.

### 4.2 Deployment: a proprietary real-time renderer

The loop was used from June to October 2026 on the rendering core of
a commercial application under hard platform constraints. The
component is proprietary; we report only aggregate numbers.

| Measure | Value |
|---|---|
| Experiments (distinct `evolve.md` runs) | 8 |
| Ledger rows | 325 |
| Rows that failed a gate | 26 (8%) |
| Iteration sessions with usage records | 224 |
| Distinct models used across iterations | 15 |
| Iterations run mainly on non-Anthropic models (GLM, Kimi, GPT, Nemotron, Muse Spark) | 47 (21%) |

Representative outcomes, each held to a quality gate against frozen
ground truth: the worst interaction frame in one experiment fell from
3.56 ms to 1.62 ms; a second experiment reduced a panning cell from
0.496 ms to 0.281 ms. In the overdraw experiment, 19 of 32 candidates
failed their gate, which is the gates doing their job rather than the
loop failing: no gated-out candidate consumed benchmark time.

Ledger rows routinely record refuted ideas next to their
measurements, so every later iteration can read them. That negative
knowledge is what a prose ledger carries and a scalar archive does
not, a point shared with reflective optimizers such as GEPA [6].

The author's practitioner observation, not a controlled measurement:
iterations run on weaker or differently trained models repeatedly
proposed directions the frontier model had not, which motivated P4.

### 4.3 Cost

Pi records token usage per message. Across the sessions that carry the
iteration instructions (224 of the project's 401 session files; the
rest are audits, assessments and one-off probes):

| Measure | Total | Per iteration |
|---|---|---|
| Tokens (input, output, cache read and write) | 7.33 B | 32.7 M |
| of which cache reads | 6.47 B (88%) | |
| Output tokens | 29.5 M | 132 k |
| Catalog-price cost | $5,735 | $25.60 |

Catalog price is the providers' list price as recorded by Pi, not the
amount billed; most frontier-model iterations ran on flat-rate
subscriptions. Per candidate, AIDEvolve is therefore far more
expensive than a single-completion evolutionary sample. It spends
that budget on few candidates: 325 rows in four months, against 150
to several thousand samples per problem in population-based
systems [3, 4]. Whether few deep candidates beat many shallow ones
on a given problem is open; for multi-file production code that
needs profiling and a test suite per candidate, the shallow unit is
not available.

## 5. Lessons on metric design

The deployment's most transferable artifact is its metric, which took
longer to build than any single candidate. The rules below
accumulated across the eight experiments.

1. **Two flanks with an explicit win rule.** Speed and quality are
   scored separately; a row wins only by being at least 3% faster with
   quality held, or 0.5% better with speed held, so a regression on
   one side cannot hide behind a gain on the other.
2. **Frozen ground truth with a holdout split.** Quality is measured
   against reference outputs frozen at a base version, on a selection
   set and a separate holdout set, so candidates cannot fit the cases
   they are scored on.
3. **A null protocol.** The base measured against itself defines the
   noise band (0.976 to 1.013 per scenario); differences inside
   it are not results.
4. **Machine state is part of the measurement.** Timings wait for a
   quiet machine; a number taken under load is marked `LOADED` and
   treated as soft rather than discarded. Environment failures, such
   as an operating-system security service slowing process launches,
   are recorded as environment, not attributed to the candidate.
5. **Declare what does not matter.** Byte-identical output was
   explicitly declared not required, so agents do not spend
   iterations explaining harmless pixel differences.

A team adopting the loop should budget more time for the metric than
for its first ten iterations.

## 6. Related work

Program evolution with LLMs: FunSearch [1], AlphaEvolve [2],
OpenEvolve [3], ShinkaEvolve [4] (parent sampling, novelty rejection
sampling and bandit model selection; state-of-the-art circle packing
in 150 samples) and CodeEvolve [5] (islands, a CVT-MAP-Elites archive,
inspiration-based crossover and a weighted model ensemble; matches or
exceeds AlphaEvolve on 5 of 9 benchmark problems). AIDEvolve's
"combine" strategy is the judgement-driven counterpart of CodeEvolve's
inspiration-based crossover.

Reflection over scalars: GEPA [6] has the LLM read full execution
traces to diagnose why a candidate failed instead of collapsing them
into a reward. Ledger rows serve the same purpose in prose.

Autonomous research loops: Karpathy's autoresearch [7] gives one agent
one file, one metric and a fixed time budget, keeping or discarding
each change; it is the minimal form of the loop described here, without
lineage. The Darwin Gödel Machine [8] evolves the agent itself rather
than a target program. In the Pi ecosystem, `pi-evo-research` [9]
extends the autoresearch pattern with an explicit population of
hypotheses and novelty injection on stagnation.

The closest ledger: willer/claude-evolve [12] keeps a CSV ledger with
parents, scores and models, retains failed rows, gates before scoring,
and runs ideator and coder subagents on a workstation. Its direction
comes from fixed quotas per generation (5 hill-climbing out of 15 by
design) with batched ideation; AIDEvolve instead judges every row
individually and never reserves a hill-climbing share.

Same argument, different shape: CORAL [13] replaces heuristics with
agents that decide for themselves, in git worktrees, with attempt
records. Its loop runs several concurrent long-lived agents against
AIDEvolve's one fresh session per row and one table.

Linear loops: `pi-autoresearch` [14] keeps a run log including
discards and revisits them when their reasons expire, but it is a
keep-or-revert line with checks after the benchmark. Weco's AIDE [15]
keeps a journal tree, but its policy is hard-coded greedy and its
memory excludes failed nodes. The name is coincidence: AID here
expands to Artificial Intelligent Design, not Weco's AIDE.

Cluster scale: SATLUTION, as reported second-hand [16], evolves whole
repositories with pre-evaluation gates and per-version records, on
large compute with human steering, against AIDEvolve's one workstation
and no operator in the loop.

Positioning: AIDEvolve keeps autoresearch's single-agent
simplicity, adds the lineage and recombination of the population
systems, and replaces their selection algorithms with agent
judgement over a human-readable record.

## 7. Limitations

- **No open-endedness claim.** Every experiment optimizes a
  human-set metric; novelty comes from the divergence strategy and
  model diversity, not from an automated novelty measure.
- **Goodhart risk.** The loop optimizes what the metric measures.
  Section 5 lists the defences that were needed; gates are only as
  honest as their author.
- **High cost per candidate** (Section 4.3).
- **Sequential.** One iteration runs at a time; wall-clock throughput
  is bounded by session length.
- **Engine-bound.** The implementation runs on the Pi coding agent and
  delegates iterations to a Pi subagent extension (tested with
  `edxeth/pi-subagents`); the choice of subagent engine is argued in
  the Pi ecosystem survey [11].
- **No controlled comparison.** The evidence is one synthetic task and
  one deployment, not a benchmark against the systems in Section 6.

## References (continued)

12. Willer. claude-evolve. 2026. https://github.com/willer/claude-evolve
13. Human-Agent Society. CORAL. arXiv:2604.01658. https://arxiv.org/abs/2604.01658
14. Cortés. pi-autoresearch. 2026. https://github.com/davebcn87/pi-autoresearch
15. WecoAI. AIDE. arXiv:2502.13138. https://arxiv.org/abs/2502.13138
16. SATLUTION (second-hand report; primary source not yet verified). Evolving whole SAT-solver repositories with Cursor and Claude, on large compute with human steering. 2026.

## 8. Availability

Source, the `evolve-init` setup skill, and a runnable example
(`examples/json-codec`) are at https://github.com/micuintus/aid-evolve
under the MIT license. The project was developed from May 2026 as
part of `pi-dacmicu`.

## References

1. Romera-Paredes et al. Mathematical discoveries from program search with large language models. Nature 625, 2024. https://doi.org/10.1038/s41586-023-06924-6
2. Novikov et al. AlphaEvolve: A coding agent for scientific and algorithmic discovery. arXiv:2506.13131, 2025. https://arxiv.org/abs/2506.13131
3. Sharma. OpenEvolve: an open-source implementation of AlphaEvolve. 2025. https://github.com/algorithmicsuperintelligence/openevolve
4. Lange, Imajuku, Cetin. ShinkaEvolve: Towards Open-Ended and Sample-Efficient Program Evolution. ICLR 2026. arXiv:2509.19349. https://arxiv.org/abs/2509.19349
5. Assumpção, Ferreira, Campos, Murai. CodeEvolve: an open source evolutionary coding agent for algorithmic discovery and optimization. arXiv:2510.14150. https://arxiv.org/abs/2510.14150
6. Agrawal et al. GEPA: Reflective Prompt Evolution Can Outperform Reinforcement Learning. ICLR 2026. arXiv:2507.19457. https://arxiv.org/abs/2507.19457
7. Karpathy. autoresearch. 2026. https://github.com/karpathy/autoresearch
8. Zhang, Hu, Lu, Lange, Clune. Darwin Gödel Machine: Open-Ended Evolution of Self-Improving Agents. arXiv:2505.22954. https://arxiv.org/abs/2505.22954
9. PriNova. pi-evo-research. 2026. https://github.com/PriNova/pi-evo-research
10. alexeiled. pi-model-router. 2026. https://www.npmjs.com/package/@alexeiled/pi-model-router
11. Michael Voigt (micu). Pi ecosystem wiki: subagent extensions. 2026. https://github.com/micuintus/pi-ecosystem-wiki/blob/main/ecosystem/subagent-extensions.md

## How to cite

```bibtex
@techreport{voigt2026aidevolve,
  author      = {{Michael Voigt (micu)}},
  title       = {AIDEvolve: Ledger-Based Evolution by Artificial Intelligent Design},
  institution = {GitHub},
  type        = {Technical Report},
  year        = {2026},
  month       = oct,
  url         = {https://github.com/micuintus/aid-evolve/blob/main/paper/aid-evolve.md}
}
```
