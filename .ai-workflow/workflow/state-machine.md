# Workflow State Machine MVP

## Purpose

This file defines the minimum transition rules for the workflow MVP.

File artifacts are the only durable handoff between agents and compressed contexts:

- No file, no progress.
- No artifact, no handoff.
- Chat context, sub-agent summaries, and checkpoints are hints only.
- Resume by reading task state, runtime event records, and every bound artifact file.
- 方案、实现、审查、验证或源码发生变化时，必须先更新对应 artifact，再推进状态。

Every transition should be modeled as:

- `from_stage`
- `event`
- `guard`
- `to_stage`
- `on_fail`
- `requires_human`

`blocked` is not terminal. It is a waiting state with a recovery target.

---

## Lane Selection

Use this dispatch rule first:

| Signal | Lane |
|---|---|
| New feature, multi-step change, non-trivial design | `feature` |
| Small scoped enhancement, low blast radius | `light-feature` |
| Existing defect, regression, broken behavior | `bugfix` |
| Urgent production issue | `hotfix` |
| Exploration, evaluation, decision support only | `research` |

---

## Feature Lane

| from_stage | event | guard | to_stage | on_fail | requires_human |
|---|---|---|---|---|---|
| `intake` | `context_collected` | task brief exists | `discovery` | `blocked` | no |
| `discovery` | `knowledge_manifest_ready` | context summary exists | `knowledge_resolution` | `blocked` | no |
| `knowledge_resolution` | `clarification_needed` | business ambiguity exists | `clarification` | `blocked` | no |
| `knowledge_resolution` | `ready_to_freeze` | no business ambiguity | `requirements_frozen` | `blocked` | no |
| `clarification` | `requirements_ready` | goals, scope, success criteria exist | `requirements_frozen` | `clarification` | yes |
| `requirements_frozen` | `proposal_requested` | requirements artifact bound | `proposal_draft` | `blocked` | no |
| `proposal_draft` | `proposal_submitted` | proposal artifact exists and hash is recorded in runtime event | `proposal_review` | `proposal_draft` | no |
| `proposal_review` | `review_revise` | blocker/high findings exist | `proposal_revise` | `blocked` | no |
| `proposal_review` | `review_approved` | blockers are zero | `await_user_confirmation` | `proposal_revise` | no |
| `proposal_revise` | `resubmitted` | revised proposal saved | `proposal_review` | `blocked` | no |
| `await_user_confirmation` | `approval_received` | proposal approved | `implementation_plan` | `proposal_revise` | yes |
| `await_user_confirmation` | `revision_requested` | feedback type is `minor_revision` | `proposal_revise` | `clarification` | yes |
| `await_user_confirmation` | `approval_rejected` | feedback type is `scope_change` | `clarification` | `blocked` | yes |
| `await_user_confirmation` | `approval_rejected` | feedback type is `goal_change` | `requirements_frozen` | `clarification` | yes |
| `implementation_plan` | `implementation_started` | test strategy exists; implementation record and source change manifest are bound | `implementation` | `blocked` | no |
| `implementation` | `implementation_complete` | relevant tests ran; source change manifest is current | `code_review` | `fixup` | no |
| `code_review` | `review_revise` | blocking review exists | `fixup` | `blocked` | no |
| `code_review` | `review_approved` | required review passed | `verification` | `fixup` | no |
| `fixup` | `fix_applied` | fixes saved | `code_review` | `blocked` | no |
| `verification` | `verification_passed` | acceptance mapping complete | `acceptance` | `implementation` | no |
| `verification` | `verification_failed` | bug or gap found | `implementation` or `proposal_draft` | `blocked` | no |
| `acceptance` | `accepted` | verifier signoff exists | `done` | `verification` | yes |

---

## Light-Feature Lane

Differences from `feature`:

- compact requirements allowed
- compact proposal allowed
- single review round allowed if risk is low

Extra dispatch guard:

- changed modules <= 2
- external interface changes == 0
- security sensitivity == low

---

## Bugfix Lane

| from_stage | event | guard | to_stage | on_fail | requires_human |
|---|---|---|---|---|---|
| `bug_intake` | `triage_started` | bug brief exists | `bug_triage` | `blocked` | no |
| `bug_triage` | `knowledge_manifest_ready` | scope captured | `knowledge_resolution` | `blocked` | no |
| `knowledge_resolution` | `repro_attempt_started` | relevant sources identified | `reproduction` | `blocked` | no |
| `reproduction` | `reproduced` | failing test or script exists | `root_cause_analysis` | `needs_instrumentation` | no |
| `reproduction` | `cannot_reproduce` | repro attempts exhausted | `cannot_reproduce` | `blocked` | no |
| `needs_instrumentation` | `signal_captured` | diagnostics added | `reproduction` | `blocked` | no |
| `root_cause_analysis` | `root_cause_found` | cause documented | `fix_plan` | `needs_instrumentation` | no |
| `root_cause_analysis` | `root_cause_uncertain` | evidence insufficient | `needs_instrumentation` | `blocked` | no |
| `fix_plan` | `fix_started` | minimal fix path defined | `fix_implementation` | `blocked` | no |
| `fix_implementation` | `fix_complete` | failing case now passes | `code_review` | `root_cause_analysis` | no |
| `code_review` | `review_approved` | review passed | `regression_verification` | `fix_implementation` | no |
| `code_review` | `review_revise` | unresolved issues exist | `fix_implementation` | `blocked` | no |
| `regression_verification` | `regression_passed` | related paths verified | `acceptance` | `fix_implementation` | no |
| `regression_verification` | `suspected_fixed` | issue intermittent | `suspected_fix_monitoring` | `blocked` | no |
| `suspected_fix_monitoring` | `monitoring_passed` | watch window stable | `acceptance` | `root_cause_analysis` | no |
| `suspected_fix_monitoring` | `monitoring_failed` | issue reappears | `root_cause_analysis` | `blocked` | no |
| `acceptance` | `accepted` | verifier signoff exists | `done` | `regression_verification` | yes |

---

## Hotfix Lane

| from_stage | event | guard | to_stage | on_fail | requires_human |
|---|---|---|---|---|---|
| `incident_intake` | `impact_assessed` | owner assigned | `impact_assessment` | `blocked` | yes |
| `impact_assessment` | `hotfix_path_selected` | rollback and metrics defined | `knowledge_resolution` | `blocked` | no |
| `knowledge_resolution` | `signal_capture_ready` | relevant systems identified | `reproduction_or_signal_capture` | `blocked` | no |
| `reproduction_or_signal_capture` | `fix_plan_ready` | enough evidence for hotfix | `hotfix_plan` | `blocked` | no |
| `hotfix_plan` | `implementation_started` | rollback strategy exists | `hotfix_implementation` | `blocked` | no |
| `hotfix_implementation` | `rapid_review_requested` | patch saved | `rapid_review` | `blocked` | no |
| `rapid_review` | `review_approved` | required rapid reviewers approve | `post_fix_verification` | `hotfix_implementation` | no |
| `post_fix_verification` | `stabilized` | monitoring window and stop condition passed | `postmortem_pending` | `hotfix_implementation` | yes |
| `postmortem_pending` | `postmortem_recorded` | incident record exists | `done` | `blocked` | yes |

---

## Research Lane

| from_stage | event | guard | to_stage | on_fail | requires_human |
|---|---|---|---|---|---|
| `research_intake` | `context_collected` | question and scope exist | `context_gathering` | `blocked` | no |
| `context_gathering` | `knowledge_manifest_ready` | sources identified | `knowledge_resolution` | `blocked` | no |
| `knowledge_resolution` | `analysis_started` | sources loaded | `option_analysis` | `blocked` | no |
| `option_analysis` | `review_requested` | options matrix exists | `review` | `blocked` | no |
| `review` | `aligned` | recommendation and risk recorded | `user_alignment` | `option_analysis` | yes |
| `user_alignment` | `decision_recorded` | next step decided | `done` | `review` | yes |

Required output:

- options table
- decision criteria
- recommendation
- unresolved risks
- next step: `feature`, `bugfix`, or `stop`

---

## Blocked State

Every blocked task must record:

- `blocked_from_stage`
- `blocked_reason`
- `recovery_condition`
- `recovery_owner`
- `resume_target_stage`

Recovery rule:

- do not resume from memory
- resume only when the recorded `recovery_condition` is satisfied
- verify the state/runtime/artifact set before replaying or continuing
