---
name: workflow-orchestrator
description: Orchestrate feature, bugfix, hotfix, research, and light-feature lanes using explicit state, runtime events, gates, and artifacts.
---

# Workflow Orchestrator

## Purpose

Drive a task from intake to completion without relying on implicit memory.

This skill is the control plane for the workflow MVP. It does not try to produce all content itself. It decides:

- which lane the task belongs to
- what the current stage is
- what artifact is missing
- whether the next transition is allowed
- when human approval is required
- when review or verification must run

## Core Rules

1. No file, no progress.
2. No artifact, no handoff.
3. Always read task state before acting.
4. Always read runtime state before replaying or resuming.
5. Always read every bound artifact file listed in state before relying on its content.
6. Never advance stages without a valid transition event.
7. Never cross a blocking gate.
8. Never treat chat context, a sub-agent summary, or a checkpoint as the source of truth when a state file or artifact exists.
9. If requirements, proposal, implementation, review, verification, or source code changes, update the corresponding artifact before advancing.
10. Never implement if the lane requires approval and approval is not recorded.
11. On ambiguity, update state or mark blocked instead of silently guessing.

## Inputs

- user request
- `workflow/state/task-state.schema.json`
- `workflow/runtime/schema.json`
- `workflow/state-machine.md`
- relevant artifacts
- optional knowledge pack entry files under `knowledge/`

## Required Behavior

### Step 1: Classify lane

Choose exactly one:

- `feature`
- `light-feature`
- `bugfix`
- `hotfix`
- `research`

Classification guidance:

- Use `feature` for multi-step feature or medium/high-risk change
- Use `light-feature` for small scoped change with low blast radius
- Use `bugfix` for existing defect repair
- Use `hotfix` for urgent production issue
- Use `research` for exploration without immediate implementation

### Step 2: Load current truth

Read:

- current task state
- current runtime state
- bound artifact versions
- every artifact file referenced by the current state

If the task depends on domain knowledge:

- read `knowledge/README.md`
- read the relevant pack entry file, for example `knowledge/webcad/README.md`
- when the domain is WebCAD, run `webcad kb-route "<用户任务原文>" --cwd <当前项目目录> --json` first and load the returned `load_files`
- read the pack route manifest only when the domain has no CLI preflight or the preflight command is unavailable

Do not bulk-read a knowledge pack unless the manifest explicitly allows it.

If no state exists, initialize one from the lane defaults.

### Step 2.1: Resolve knowledge route

If a relevant knowledge pack exists:

1. identify the domain, for example `webcad`
2. for WebCAD, run `webcad kb-route "<用户任务原文>" --cwd <当前项目目录> --json`
3. for WebCAD, read every file listed in `load_files` and handle any `warnings` before continuing
4. for non-WebCAD packs or CLI fallback, read the route manifest and map the current lane to the pack task route
5. load extra topic or risk docs only if the request or findings clearly require them

Examples:

- WebCAD feature design:
  - run `webcad kb-route "<用户任务原文>" --cwd <当前项目目录> --json`
  - verify the report maps to `solution-write`
  - read the returned `load_files`
- WebCAD bugfix:
  - run `webcad kb-route "<用户任务原文>" --cwd <当前项目目录> --json`
  - verify the report maps to `code-review`
  - read the returned `load_files`, including any matched pitfalls docs

### Step 3: Validate transition

For the desired next action:

- check `from_stage`
- check triggering `event`
- check `guard`
- check whether human approval is required
- check whether required artifact versions are bound
- check whether the artifact files exist and match the current runtime snapshot

If invalid:

- do not continue
- either request the missing input
- or move the task to `blocked`

### Step 4: Perform only the allowed next action

Examples:

- ask one clarification question
- write or update one artifact
- request one review
- record one approval event
- request one implementation step
- read one additional topic doc if a risk or topic route was triggered

Do not skip to a later phase because it seems obvious.

### Step 5: Persist

After any meaningful transition:

- update task state
- update runtime state
- record event with the artifact version/hash snapshot
- record bound artifact versions if changed
- write or update the corresponding docs artifact; otherwise mark the task blocked
- when implementation source files change, update `docs/changes/<task_id>-changes.json` and `docs/implementation/<task_id>.md` before requesting review

## Lane Policies

### Feature

- requires requirements freeze
- requires proposal review
- requires user approval before implementation

### Light-Feature

- may use a compact proposal
- may use single-round review
- still requires explicit review and acceptance

### Bugfix

- requires reproduction or explicit `cannot_reproduce`
- requires root-cause path or instrumentation path
- requires regression verification before close
- when a domain pack exists, prefer review-oriented knowledge first, then write-oriented knowledge

### Hotfix

- requires impact assessment
- requires rollback strategy
- requires owner and monitoring signals
- requires postmortem follow-up

### Research

- must end with a decision record
- must explicitly route to `feature`, `bugfix`, or `stop`

## Knowledge Pack Policy

### General

- Knowledge packs are optional but authoritative for their domain.
- Project source code still has higher priority than generalized knowledge docs.
- If pack facts conflict with repo facts, record the conflict and prefer repo facts.

### Required Read Order

When using a knowledge pack:

1. pack `README.md`
2. pack CLI/router preflight when available, for example `webcad kb-route "<用户任务原文>" --cwd <当前项目目录> --json`
3. files returned in `load_files`
4. pack `route-manifest.json` only as a fallback when the preflight command is unavailable
5. pack minimal task/topic/risk routes only as needed in fallback mode

### WebCAD Policy

If the task is WebCAD-related:

- use `webcad kb-route "<用户任务原文>" --cwd <当前项目目录> --json` as the preflight entrypoint
- use `task_type` to verify lane -> pack task type mapping
- use `load_files` as the authoritative minimal loadout
- handle `warnings` explicitly before writing方案、代码或审查结论
- if the command is unavailable, fall back to `knowledge/webcad/route-manifest.json`, `knowledge/webcad/mvp-lane-map.md`, `knowledge/webcad/load-by-task.md`, and `knowledge/webcad/load-by-topic.md`

Never load the whole `knowledge/webcad/source/` tree by default.

## Blocking Conditions

Move to `blocked` if:

- required human response is missing
- required artifact is missing
- required review is unresolved
- external dependency prevents progress
- state and artifact versions conflict
- a handoff would be needed but no handoff artifact was written

## Output Expectations

When operating, always leave:

- an updated state
- an updated runtime snapshot if the stage changed
- a written artifact or an explicit blocked reason
- if knowledge was used, a concise note of which pack routes were loaded

## Anti-Patterns

Do not:

- start implementation from a rejected proposal
- close a bugfix without regression evidence
- treat a hotfix as done before a monitoring period is defined
- let the same context author and approve the same critical artifact
