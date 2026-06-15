param(
  [Parameter(Mandatory = $true)]
  [string]$TaskId,

  [string]$Root = ".",
  [switch]$Write
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

function Get-AllowedEvents {
  param([hashtable]$State)
  $transitionMap = Get-TransitionMap
  $laneMap = $transitionMap[$State.lane]
  $events = @()
  if ($laneMap) {
    foreach ($key in $laneMap.Keys) {
      $parts = $key -split "\|", 2
      if ($parts[0] -eq $State.current_stage) { $events += $parts[1] }
    }
  }
  if ($State.current_stage -eq "await_user_confirmation") {
    $events += @("approval_received", "revision_requested", "approval_rejected")
  }
  return @($events | Sort-Object -Unique)
}

function Get-HandoffProfile {
  param([hashtable]$State)
  $stage = $State.current_stage
  $lane = $State.lane

  if ($lane -in @("feature", "light-feature")) {
    if ($stage -in @("intake", "discovery", "knowledge_resolution", "clarification", "requirements_frozen", "proposal_draft", "proposal_revise")) {
      return @{ role = "solution-writer"; reason = "This stage needs requirements/proposal authoring before review."; outputs = @("docs/requirements/$($State.task_id).md", "docs/proposals/$($State.task_id).md", "docs/acceptance/$($State.task_id).md"); forbidden = @("Do not approve the proposal", "Do not start implementation before approval") }
    }
    if ($stage -eq "proposal_review") {
      return @{ role = "proposal-reviewer"; reason = "The proposal must be reviewed by a role separate from the author."; outputs = @("docs/reviews/$($State.task_id)-proposal-review.md"); forbidden = @("Do not rewrite the proposal silently", "Do not implement code") }
    }
    if ($stage -in @("implementation_plan", "implementation", "fixup")) {
      return @{ role = "code-writer"; reason = "The approved plan is ready for implementation or fixup."; outputs = @("project source changes", "tests", "docs/implementation/$($State.task_id).md"); forbidden = @("Do not approve your own implementation", "Do not skip code review") }
    }
    if ($stage -eq "code_review") {
      return @{ role = "code-reviewer"; reason = "Implementation must be reviewed by a separate reviewer."; outputs = @("docs/reviews/$($State.task_id)-code-review.md"); forbidden = @("Do not edit implementation while reviewing", "Do not approve your own code") }
    }
    if ($stage -in @("verification", "acceptance")) {
      return @{ role = "verifier"; reason = "The task needs evidence-based verification before closure."; outputs = @("docs/verification/$($State.task_id).md", "docs/acceptance/$($State.task_id).md"); forbidden = @("Do not close with missing evidence", "Do not verify without checking artifacts") }
    }
  }

  if ($lane -eq "bugfix") {
    if ($stage -in @("bug_intake", "bug_triage", "knowledge_resolution", "reproduction", "needs_instrumentation", "root_cause_analysis", "fix_plan", "fix_implementation")) {
      return @{ role = "bugfix-writer"; reason = "Bugfix work requires reproduction, root cause, minimal fix, and regression evidence."; outputs = @("docs/bugs/$($State.task_id)-report.md", "project source changes", "tests"); forbidden = @("Do not claim fixed without reproduction", "Do not skip regression verification") }
    }
    if ($stage -eq "code_review") {
      return @{ role = "code-reviewer"; reason = "The bugfix implementation must be reviewed separately."; outputs = @("docs/reviews/$($State.task_id)-code-review.md"); forbidden = @("Do not edit implementation while reviewing", "Do not approve your own code") }
    }
    if ($stage -in @("regression_verification", "suspected_fix_monitoring", "acceptance")) {
      return @{ role = "verifier"; reason = "The bugfix needs regression or monitoring evidence before closure."; outputs = @("docs/verification/$($State.task_id).md", "docs/acceptance/$($State.task_id).md"); forbidden = @("Do not close without regression evidence", "Do not ignore monitoring failure") }
    }
  }

  if ($lane -eq "research") {
    if ($stage -in @("review", "user_alignment")) {
      return @{ role = "proposal-reviewer"; reason = "Research recommendation needs independent review/alignment."; outputs = @("docs/reviews/$($State.task_id)-research-review.md"); forbidden = @("Do not record final decision without alignment") }
    }
    return @{ role = "solution-writer"; reason = "Research stages need source collection, option analysis, and a decision record."; outputs = @("docs/research/$($State.task_id)-decision.md"); forbidden = @("Do not decide without evidence", "Do not skip alternatives") }
  }

  if ($lane -eq "hotfix") {
    if ($stage -in @("rapid_review", "post_fix_verification", "postmortem_pending")) {
      return @{ role = "verifier"; reason = "Hotfix closure requires review, stabilization, and postmortem evidence."; outputs = @("docs/verification/$($State.task_id).md", "docs/hotfix/$($State.task_id)-postmortem.md"); forbidden = @("Do not close without monitoring", "Do not omit rollback notes") }
    }
    return @{ role = "code-writer"; reason = "Hotfix stages require minimal implementation with rollback and owner evidence."; outputs = @("docs/hotfix/$($State.task_id).md", "project source changes"); forbidden = @("Do not start without rollback strategy", "Do not skip rapid review") }
  }

  return @{ role = "orchestrator"; reason = "No specialized handoff matched; orchestrator should inspect state and decide next step."; outputs = @("docs/handoffs/$($State.task_id)-handoff.md"); forbidden = @("Do not bypass gates") }
}

function Format-ListBlock {
  param([string[]]$Items)
  if (-not $Items -or $Items.Count -eq 0) { return "- none" }
  return (($Items | ForEach-Object { "- $_" }) -join "`n")
}

function Get-FileHashValue {
  param([string]$Path)
  if (-not (Test-Path $Path)) {
    return "pending"
  }

  # Handoff files become artifacts, so hash them without depending on optional modules.
  $stream = [System.IO.File]::OpenRead((Resolve-Path $Path).Path)
  try {
    $sha = [System.Security.Cryptography.SHA256]::Create()
    try {
      return ([System.BitConverter]::ToString($sha.ComputeHash($stream)) -replace "-", "").ToLowerInvariant()
    } finally {
      $sha.Dispose()
    }
  } finally {
    $stream.Dispose()
  }
}

function Ensure-ArtifactRuntimeShapes {
  param(
    [hashtable]$State,
    [hashtable]$Runtime
  )

  if (-not $State.artifacts) {
    $State.artifacts = @{}
  }

  if (-not $State.bound_artifact_set) {
    $State.bound_artifact_set = @{}
  }

  if (-not $Runtime.artifact_versions) {
    $Runtime.artifact_versions = @{}
  }

  if (-not $Runtime.bound_artifact_set) {
    $Runtime.bound_artifact_set = @{}
  }

  if (-not $Runtime.pending_events) {
    $Runtime.pending_events = @()
  }
}

function Register-HandoffArtifact {
  param(
    [hashtable]$State,
    [hashtable]$Runtime,
    [string]$TaskId,
    [string]$ArtifactName,
    [string]$RelativePath,
    [string]$Hash
  )

  Ensure-ArtifactRuntimeShapes -State $State -Runtime $Runtime
  $version = 1
  if ($State.artifacts.ContainsKey($ArtifactName)) {
    $existing = $State.artifacts[$ArtifactName]
    $version = [int]$existing.version
    if ($existing.hash -and $existing.hash -ne $Hash) {
      $version = $version + 1
    }
  }

  $State.artifacts[$ArtifactName] = @{
    path = $RelativePath
    version = $version
    hash = $Hash
    approved_version = $null
  }

  $Runtime.artifact_versions[$ArtifactName] = @{
    path = $RelativePath
    version = $version
    hash = $Hash
    approved_version = $null
  }

  $boundKey = "${ArtifactName}_version"
  $State.bound_artifact_set[$boundKey] = $version
  $Runtime.bound_artifact_set[$boundKey] = $version
  $Runtime.event_cursor = [int]$Runtime.event_cursor + 1
  $Runtime.checkpoint_id = "cp-$TaskId-handoff-$('{0:d3}' -f $Runtime.event_cursor)"
  $Runtime.checkpoint_payload = @{
    current_stage = $State.current_stage
    last_handoff_artifact = $RelativePath
  }

  $Runtime.pending_events = @($Runtime.pending_events + @{
    event_type = "handoff_written"
    task_id = $TaskId
    lane = $State.lane
    stage = $State.current_stage
    actor = "orchestrator"
    result = "artifact_recorded"
    timestamp = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ssK")
    idempotency_key = "$TaskId-handoff-$($Runtime.event_cursor)"
    artifact_versions = @{
      $ArtifactName = @{
        path = $RelativePath
        version = $version
        hash = $Hash
        approved_version = $null
      }
    }
    bound_artifact_set = @{
      $boundKey = $version
    }
  })
}

$rootPath = (Resolve-Path $Root).Path
$statePath = Join-Path $rootPath "workflow\state\$TaskId.json"
$runtimePath = Join-Path $rootPath "workflow\runtime\$TaskId.runtime.json"
$templatePath = Join-Path $rootPath "workflow\templates\handoff-template.md"

if (-not (Test-Path $statePath)) { throw "Missing state file: $statePath" }
if (-not (Test-Path $runtimePath)) { throw "Missing runtime file: $runtimePath" }
if (-not (Test-Path $templatePath)) { throw "Missing handoff template: $templatePath" }

$state = Get-Content $statePath -Raw | ConvertFrom-Json -AsHashtable
$profile = Get-HandoffProfile -State $state
$allowedEvents = Get-AllowedEvents -State $state
$artifactInputs = @($state.artifacts.Keys | ForEach-Object { $state.artifacts[$_].path })
$requiredInputs = @(
  "workflow/state/$TaskId.json",
  "workflow/runtime/$TaskId.runtime.json",
  "workflow/state-machine.md"
) + $artifactInputs

$content = Get-Content -Encoding UTF8 $templatePath -Raw
$createdAt = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ssK")
$content = $content.
  Replace("{{task_id}}", $state.task_id).
  Replace("{{title}}", $state.title).
  Replace("{{lane}}", $state.lane).
  Replace("{{current_stage}}", $state.current_stage).
  Replace("{{recommended_role}}", $profile.role).
  Replace("{{created_at}}", $createdAt).
  Replace("{{role_reason}}", $profile.reason).
  Replace("{{required_inputs}}", (Format-ListBlock $requiredInputs)).
  Replace("{{expected_outputs}}", (Format-ListBlock $profile.outputs)).
  Replace("{{forbidden_actions}}", (Format-ListBlock $profile.forbidden)).
  Replace("{{allowed_next_events}}", (Format-ListBlock $allowedEvents))

if ($Write) {
  $runtime = Get-Content $runtimePath -Raw | ConvertFrom-Json -AsHashtable
  $handoffDir = Join-Path $rootPath "docs\handoffs"
  New-Item -ItemType Directory -Force $handoffDir | Out-Null
  $handoffFileName = "$TaskId-$($state.current_stage)-$($profile.role)-handoff.md"
  $handoffPath = Join-Path $handoffDir $handoffFileName
  Set-Content -Path $handoffPath -Encoding utf8 -Value $content
  $relativeHandoffPath = "docs/handoffs/$handoffFileName"
  $artifactName = "handoff_$($state.current_stage)"
  $artifactHash = Get-FileHashValue $handoffPath
  Register-HandoffArtifact -State $state -Runtime $runtime -TaskId $TaskId -ArtifactName $artifactName -RelativePath $relativeHandoffPath -Hash $artifactHash
  $state | ConvertTo-Json -Depth 10 | Set-Content -Path $statePath -Encoding utf8
  $runtime | ConvertTo-Json -Depth 10 | Set-Content -Path $runtimePath -Encoding utf8
  Write-Output "Handoff written: $handoffPath"
} else {
  Write-Output $content
}
