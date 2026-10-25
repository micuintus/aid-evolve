# pi-dacmicu

Deterministic TODO loop for [Pi](https://pi.dev).

Install:
```bash
pi install git:github.com/micuintus/pi-dacmicu
```

Requires `tintinweb/pi-manage-todo-list`:
```bash
pi install git:github.com/tintinweb/pi-manage-todo-list
```

## Engines

Both loops actuate other extensions' tools and say so up front instead
of stalling silently when the engine is missing.

- TODO loop: drives the `manage_todo_list` tool from
  `tintinweb/pi-manage-todo-list` (required, see above).
- Evolve loop (`packages/evolve`, skill `evolve-init`): delegates each
  iteration to a subagent engine. Tested with `edxeth/pi-subagents`
  (`pi install git:github.com/edxeth/pi-subagents`); the prompts assume
  HazAT-style lifecycle conventions (autonomous self-closing children).
  Engine choice rationale (inspectability, parent-model inheritance,
  self-termination semantics) follows the [Pi ecosystem subagent
  survey](https://github.com/micuintus/pi-ecosystem-wiki/blob/main/ecosystem/subagent-extensions.md).

Run tests:
```bash
npm test
```
