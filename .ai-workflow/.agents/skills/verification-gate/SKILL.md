---
name: verification-gate
description: Validate that implementation output satisfies acceptance mapping, review outcomes, and lane-specific exit gates before closure.
---

# Verification Gate

## Purpose

Act as the final quality gate before acceptance or closure.

This skill verifies that the task is actually ready to pass, not merely that implementation exists.

## Inputs

- current task state
- current runtime state
- `workflow/state-machine.md`
- `workflow/templates/acceptance-template.md`
- implementation notes or bugfix report
- review artifacts
- acceptance artifact if already started
- optional domain knowledge route when correctness depends on domain constraints

## Required Behavior

### Step 1: Validate lane and exit intent

This skill supports:

- `feature`
- `light-feature`
- `bugfix`
- `hotfix`
- `research` only when closing with a decision record

Identify whether the task is trying to move into:

- `acceptance`
- `done`

### Step 2: Check mandatory evidence

For `feature` / `light-feature`:

- implementation artifact exists
- proposal review exists
- code review exists if implementation occurred
- acceptance mapping exists

For `bugfix`:

- bugfix report exists
- reproduction evidence exists or `cannot_reproduce` is explicitly recorded
- regression verification exists

For `hotfix`:

- hotfix record exists
- rollback strategy exists
- monitoring signals exist
- postmortem follow-up is recorded

For `research`:

- decision record exists
- recommended next step exists

### Step 3: Verify gate conditions

Check:

- unresolved blockers
- unresolved high findings
- missing approval where required
- missing verifier signoff
- missing runtime event chain
- artifact version mismatch

### Step 4: Produce a verdict

Allowed verdicts:

- `accepted`
- `accepted_with_followups`
- `rejected`

Verification output should include:

- evidence checked
- gaps found
- residual risks
- final verdict

### Step 5: Persist result

Write or update the acceptance artifact.

Recommended filename:

- `docs/acceptance/<task-id>.md`

Then update:

- `review_gates.verification_passed`
- runtime review trace
- task status if final verdict allows closure

## Lane-Specific Rules

### Feature

- do not accept without approval history
- do not accept if proposal and implementation versions are inconsistent

### Bugfix

- do not accept without regression verification
- do not accept if the issue still appears during monitoring

### Hotfix

- do not accept as stable if monitoring window is undefined
- do not mark fully closed before postmortem follow-up is recorded

### Research

- do not accept if there is no next-step disposition

## Anti-Patterns

Do not:

- accept based on “looks done”
- skip runtime or event evidence
- ignore high-risk review findings
- mark a hotfix complete without stabilization evidence
