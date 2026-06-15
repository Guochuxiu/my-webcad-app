---
name: bugfix-workflow
description: Execute the bugfix lane using reproduction-first, root-cause analysis, fix planning, regression verification, and closure discipline.
---

# Bugfix Workflow

## Purpose

Drive a defect from intake to closure without skipping reproduction, root cause, or regression verification.

This skill is the execution lane for `bugfix`. It is not only a template helper. It should actively enforce the bugfix sequence.

## Inputs

- current task state
- current runtime state
- `workflow/state-machine.md`
- `workflow/templates/bugfix-report-template.md`
- `workflow/templates/monitoring-plan-template.md` when needed
- related code, logs, screenshots, or repro steps
- optional domain knowledge pack route when the task depends on domain constraints

## Required Behavior

### Step 1: Confirm lane and current stage

This skill only supports:

- `bugfix`

Allowed starting stages:

- `bug_intake`
- `bug_triage`
- `knowledge_resolution`
- `reproduction`
- `needs_instrumentation`
- `root_cause_analysis`
- `fix_plan`
- `fix_implementation`
- `regression_verification`
- `suspected_fix_monitoring`

If the task is not in `bugfix`, stop and return control to the orchestrator.

### Step 2: Enforce reproduction-first

Before any implementation change:

- look for a reproducible case
- try to derive a failing test or repro script
- record observed result

If reproduction is not yet available:

- do not claim a fix
- move toward `needs_instrumentation` or `cannot_reproduce`

### Step 3: Build or update the bugfix report

The bugfix report must include:

- issue description
- reproduction evidence
- root cause evidence
- fix plan
- regression verification
- monitoring plan if the result is only suspected fixed

Recommended filename:

- `docs/bugs/<task-id>-report.md`

### Step 4: Root-cause discipline

Only move from `reproduction` to `root_cause_analysis` when evidence exists.

Only move from `root_cause_analysis` to `fix_plan` when:

- the likely root cause is explicit
- impacted paths are identified

If root cause remains unclear:

- route to `needs_instrumentation`
- record what signal is missing

### Step 5: Minimal fix planning

The fix plan should state:

- what is being changed
- why this is the smallest safe fix
- what is intentionally not being changed
- what regression coverage is required

### Step 6: Regression-first closure

Do not allow closure unless:

- original bug is no longer observed
- related paths have been checked
- regression verification is written down

If the bug is intermittent and only appears fixed:

- move to `suspected_fix_monitoring`
- require a monitoring plan and watch window

## Domain Knowledge Policy

If a knowledge pack is relevant:

- use the pack manifest
- load the minimal bugfix-oriented route first
- for WebCAD, prefer `code-review` route first, then `code-write`
- load risk docs from `pitfalls/` when keywords match

## Output Expectations

This skill should leave behind:

- updated task state
- updated runtime state
- updated bugfix report
- explicit next transition recommendation

## Blocking Rules

Return a blocked or non-closure result if:

- there is no reproduction evidence
- root cause is missing and no instrumentation plan exists
- regression verification is missing
- the bug is only “probably fixed” and no monitoring plan exists

## Anti-Patterns

Do not:

- jump straight to code edits from a bug description
- call a bug fixed based only on intuition
- skip root-cause analysis because the patch seems obvious
- close an intermittent bug without a monitoring window
