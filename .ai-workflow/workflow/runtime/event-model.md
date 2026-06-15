# Runtime Event Model MVP

## Purpose

Events are the only valid way to move workflow state.

Do not advance a task because a stage "looks complete". Advance only when a valid event is recorded and guards are satisfied.

No file, no progress. No artifact, no handoff. Runtime events must point back to the artifact versions and hashes that justified the transition; chat text and checkpoints are not authoritative resume data.

---

## Common Event Shape

All events should record:

- `event_type`
- `task_id`
- `lane`
- `stage`
- `actor`
- `timestamp`
- `idempotency_key`

Optional:

- `feedback_type`
- `change_scope_level`
- `reason`
- `owner`
- `expires_at`
- `artifact_versions`
- `bound_artifact_set`

Example:

```json
{
  "event_type": "approval_received",
  "task_id": "feat-user-search",
  "lane": "feature",
  "stage": "await_user_confirmation",
  "actor": "user",
  "timestamp": "2026-04-22T10:00:00+08:00",
  "idempotency_key": "feat-user-search-approval-v2",
  "artifact_versions": {
    "proposal": {
      "path": "docs/proposals/feat-user-search.md",
      "version": 2,
      "hash": "sha256:..."
    }
  },
  "bound_artifact_set": {
    "proposal_version": 2
  }
}
```

---

## Event Categories

### Transition Events

Use to move between stages.

Examples:

- `context_collected`
- `knowledge_manifest_ready`
- `requirements_ready`
- `proposal_submitted`
- `review_approved`
- `implementation_complete`
- `verification_passed`

### Approval Events

Use for human or authoritative approval decisions.

Examples:

- `approval_requested`
- `approval_received`
- `approval_rejected`
- `revision_requested`

Recommended extra fields:

- `feedback_type`: `minor_revision` / `scope_change` / `goal_change`
- `change_scope_level`: `small` / `medium` / `large`

### Review Events

Use when a review round is created or resolved.

Examples:

- `review_requested`
- `review_revise`
- `review_approved`
- `review_rejected`

### Runtime Events

Use for infrastructure-level workflow control.

Examples:

- `checkpoint_created`
- `resume_requested`
- `resume_completed`
- `retry_scheduled`
- `timeout_triggered`
- `blocked_entered`
- `blocked_recovered`
- `handoff_written`

### Override Events

Use only for explicit policy exceptions.

Examples:

- `override_requested`
- `override_granted`
- `override_denied`
- `override_expired`

Required extra fields:

- `override_reason`
- `owner`
- `expires_at`
- `affected_guard`

---

## Replay Rules

Each event should be treated as one of:

- `safe_to_replay`
- `read_only`
- `non_replayable`

Examples:

- `context_collected`: `safe_to_replay`
- `review_requested`: depends on whether the same review round already exists
- `approval_received`: `non_replayable`
- `checkpoint_created`: `safe_to_replay`
- `write_artifact`: typically `non_replayable`

If an event is `non_replayable`, recovery should read the stored result instead of executing it again.

---

## Authoritative Decisions

Certain events only count when produced by an authoritative actor.

Examples:

- `accepted` only counts when the actor is `verifier`
- `review_approved` for hotfix only counts when `incident-reviewer` has approved
- `approval_received` for feature implementation only counts when the actor is `user`
