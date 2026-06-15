param(
  [Parameter(Mandatory = $true)]
  [string]$TaskId,

  [string]$Root = "."
)

$ErrorActionPreference = "Stop"

function Get-TransitionMap {
  $map = @{}

  $map["feature"] = @{
    "intake|context_collected" = "discovery"
    "discovery|knowledge_manifest_ready" = "knowledge_resolution"
    "knowledge_resolution|clarification_needed" = "clarification"
    "knowledge_resolution|ready_to_freeze" = "requirements_frozen"
    "clarification|requirements_ready" = "requirements_frozen"
    "requirements_frozen|proposal_requested" = "proposal_draft"
    "proposal_draft|proposal_submitted" = "proposal_review"
    "proposal_review|review_revise" = "proposal_revise"
    "proposal_review|review_approved" = "await_user_confirmation"
    "proposal_revise|resubmitted" = "proposal_review"
    "implementation_plan|implementation_started" = "implementation"
    "implementation|implementation_complete" = "code_review"
    "code_review|review_revise" = "fixup"
    "code_review|review_approved" = "verification"
    "fixup|fix_applied" = "code_review"
    "verification|verification_passed" = "acceptance"
    "acceptance|accepted" = "done"
  }

  $map["light-feature"] = $map["feature"].Clone()
  $map["bugfix"] = @{
    "bug_intake|triage_started" = "bug_triage"
    "bug_triage|knowledge_manifest_ready" = "knowledge_resolution"
    "knowledge_resolution|repro_attempt_started" = "reproduction"
    "reproduction|reproduced" = "root_cause_analysis"
    "reproduction|cannot_reproduce" = "cannot_reproduce"
    "needs_instrumentation|signal_captured" = "reproduction"
    "root_cause_analysis|root_cause_found" = "fix_plan"
    "root_cause_analysis|root_cause_uncertain" = "needs_instrumentation"
    "fix_plan|fix_started" = "fix_implementation"
    "fix_implementation|fix_complete" = "code_review"
    "code_review|review_approved" = "regression_verification"
    "code_review|review_revise" = "fix_implementation"
    "regression_verification|regression_passed" = "acceptance"
    "regression_verification|suspected_fixed" = "suspected_fix_monitoring"
    "suspected_fix_monitoring|monitoring_passed" = "acceptance"
    "suspected_fix_monitoring|monitoring_failed" = "root_cause_analysis"
    "acceptance|accepted" = "done"
  }
  $map["hotfix"] = @{
    "incident_intake|impact_assessed" = "impact_assessment"
    "impact_assessment|hotfix_path_selected" = "knowledge_resolution"
    "knowledge_resolution|signal_capture_ready" = "reproduction_or_signal_capture"
    "reproduction_or_signal_capture|fix_plan_ready" = "hotfix_plan"
    "hotfix_plan|implementation_started" = "hotfix_implementation"
    "hotfix_implementation|rapid_review_requested" = "rapid_review"
    "rapid_review|review_approved" = "post_fix_verification"
    "post_fix_verification|stabilized" = "postmortem_pending"
    "postmortem_pending|postmortem_recorded" = "done"
  }
  $map["research"] = @{
    "research_intake|context_collected" = "context_gathering"
    "context_gathering|knowledge_manifest_ready" = "knowledge_resolution"
    "knowledge_resolution|analysis_started" = "option_analysis"
    "option_analysis|review_requested" = "review"
    "review|aligned" = "user_alignment"
    "user_alignment|decision_recorded" = "done"
  }

  return $map
}

$rootPath = (Resolve-Path $Root).Path
$statePath = Join-Path $rootPath "workflow\state\$TaskId.json"
$runtimePath = Join-Path $rootPath "workflow\runtime\$TaskId.runtime.json"

if (-not (Test-Path $statePath)) { throw "Missing state file: $statePath" }
if (-not (Test-Path $runtimePath)) { throw "Missing runtime file: $runtimePath" }

$state = Get-Content $statePath -Raw | ConvertFrom-Json -AsHashtable
$runtime = Get-Content $runtimePath -Raw | ConvertFrom-Json -AsHashtable
$transitionMap = Get-TransitionMap
$laneMap = $transitionMap[$state.lane]
$allowedEvents = @()

if ($laneMap) {
  foreach ($key in $laneMap.Keys) {
    $parts = $key -split "\|", 2
    if ($parts[0] -eq $state.current_stage) {
      $allowedEvents += $parts[1]
    }
  }
}

if ($state.current_stage -eq "await_user_confirmation") {
  $allowedEvents += @("approval_received", "revision_requested", "approval_rejected")
}

Write-Output "Task: $($state.task_id)"
Write-Output "Title: $($state.title)"
Write-Output "Lane: $($state.lane)"
Write-Output "Stage: $($state.current_stage)"
Write-Output "Status: $($state.status)"

if ($state.status -eq "blocked") {
  Write-Output ""
  Write-Output "Blocked: $($state.blocked_reason)"
  Write-Output "Recovery: $($state.recovery_condition)"
  Write-Output "Owner: $($state.recovery_owner)"
}

Write-Output ""
Write-Output "Artifacts:"
foreach ($name in $state.artifacts.Keys) {
  $relativePath = $state.artifacts[$name].path
  $artifactPath = Join-Path $rootPath $relativePath
  $exists = if (Test-Path $artifactPath) { "exists" } else { "missing" }
  $version = $state.artifacts[$name].version
  $hash = $state.artifacts[$name].hash
  Write-Output "- ${name}: $relativePath (v$version, $exists, hash=$hash)"
}

Write-Output ""
Write-Output "Gates:"
Write-Output "- proposal approved: $($state.user_confirmation.proposal_approved)"
Write-Output "- proposal blockers: $($state.review_gates.proposal_blockers)"
Write-Output "- code blockers: $($state.review_gates.code_blockers)"
Write-Output "- verification passed: $($state.review_gates.verification_passed)"

Write-Output ""
Write-Output "Allowed next events:"
if ($allowedEvents.Count -eq 0) {
  Write-Output "- none"
} else {
  $allowedEvents | Sort-Object -Unique | ForEach-Object { Write-Output "- $_" }
}

Write-Output ""
Write-Output "Checkpoint: $($runtime.checkpoint_id)"
Write-Output "Event cursor: $($runtime.event_cursor)"
