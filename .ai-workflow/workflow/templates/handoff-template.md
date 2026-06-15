# Agent Handoff

## Task

- task_id: {{task_id}}
- title: {{title}}
- lane: {{lane}}
- current_stage: {{current_stage}}
- recommended_role: {{recommended_role}}
- created_at: {{created_at}}

## Why This Role

{{role_reason}}

## Required Inputs

{{required_inputs}}

## Source Of Truth

- No file, no progress.
- No artifact, no handoff.
- Read `workflow/state/{{task_id}}.json`, `workflow/runtime/{{task_id}}.runtime.json`, and every listed artifact file before acting.
- Treat chat context, checkpoints, and sub-agent summaries as hints only; if they conflict with files, the files win.

## Expected Outputs


{{expected_outputs}}

## Forbidden Actions

{{forbidden_actions}}

## Allowed Next Events

{{allowed_next_events}}

## Knowledge Route

- run `webcad kb-route "<用户任务原文>" --cwd <当前项目目录> --json` first when WebCAD domain knowledge is relevant
- read every file listed in `load_files` before writing the expected artifact
- handle `warnings` explicitly; fall back to `.ai-workflow/knowledge/webcad/route-manifest.json` only when the CLI preflight is unavailable

## Completion Rule


Return control to the orchestrator after writing the expected artifact. Run `pwsh -File .\.ai-workflow\scripts\workflow.ps1 handoff -TaskId {{task_id}} -Write` when crossing author/reviewer/verifier boundaries so the handoff itself is registered as an artifact. Do not approve your own output.
