---
name: proposal-review
description: Run a structured proposal review against workflow gates, risks, artifact bindings, and acceptance mapping.
---

# Proposal Review

## Purpose

Review a proposal artifact before implementation begins.

This is a reviewer lane, not an authoring lane. It should not silently rewrite the proposal and approve it in the same pass.

## Inputs

- current task state
- current runtime state
- `workflow/state-machine.md`
- `workflow/templates/proposal-template.md`
- upstream requirements artifact
- optional capability artifact
- proposal artifact under review
- optional domain knowledge pack route if the task depends on domain knowledge

## Required Behavior

### Step 1: Validate review preconditions

Before reviewing, confirm:

- task lane is `feature`, `light-feature`, or `research`
- proposal artifact exists
- requirements artifact exists
- artifact versions are bound

If any precondition fails:

- do not review loosely
- return `revise`
- state the missing prerequisite

### Step 2: Load minimal context

Always read:

- task state
- runtime state
- proposal
- requirements

Read capability if present.

If a domain knowledge pack is relevant:

- read the pack manifest
- load only the minimal task route
- expand topic or risk routes only when needed

### Step 3: Review against the checklist

Check the proposal for:

1. scope clarity
2. non-goals clarity
3. architecture fit with current repo facts
4. implementation boundary clarity
5. risk coverage
6. fallback or rollback thinking where relevant
7. acceptance mapping quality
8. open questions
9. artifact version consistency

### Step 4: Produce a disposition

Allowed outcomes:

- `approve`
- `approve_with_notes`
- `revise`
- `reject`

Review output should contain:

- summary
- blocker findings
- high findings
- medium findings
- accepted risks
- open questions
- disposition

### Step 5: Persist review result

Write the result into a proposal review artifact.

Recommended filename:

- `docs/reviews/<task-id>-proposal-review-rN.md`

Also update:

- review trace in runtime
- review round counters in state
- proposal gate counters in state

## Blocking Rules

Return `revise` if:

- proposal does not map clearly to requirements
- implementation boundary is ambiguous
- blocker or high risk remains unresolved
- artifact versions are unbound or inconsistent

Return `reject` if:

- proposal is fundamentally mis-scoped
- repo facts directly contradict the proposal
- the proposal depends on invalid assumptions

## Anti-Patterns

Do not:

- rewrite the proposal and approve your own rewrite in the same pass
- approve without checking artifact binding
- skip acceptance mapping
- treat missing information as implicitly acceptable
