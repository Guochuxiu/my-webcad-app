param(
  [Parameter(Mandatory = $true)]
  [string]$TaskId,

  [Parameter(Mandatory = $true)]
  [string]$Event,

  [string]$Root = ".",
  [string]$FeedbackType,
  [string]$ChangeScopeLevel
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

function Save-WorkflowState {
  param(
    [hashtable]$State,
    [hashtable]$Runtime,
    [string]$StatePath,
    [string]$RuntimePath
  )

  $State | ConvertTo-Json -Depth 10 | Set-Content -Path $StatePath -Encoding utf8
  $Runtime | ConvertTo-Json -Depth 10 | Set-Content -Path $RuntimePath -Encoding utf8
}

function Get-FileHashValue {
  param([string]$Path)
  if (-not (Test-Path $Path)) {
    return "pending"
  }

  # Use a local SHA256 calculation so artifact binding works in every supported PowerShell host.
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

function Get-ProjectRoot {
  param([string]$WorkflowRootPath)

  if ((Split-Path -Leaf $WorkflowRootPath) -eq ".ai-workflow") {
    return (Split-Path -Parent $WorkflowRootPath)
  }

  return $WorkflowRootPath
}

function ConvertTo-PortablePath {
  param(
    [string]$BasePath,
    [string]$FilePath
  )

  return ([System.IO.Path]::GetRelativePath($BasePath, $FilePath) -replace "\\", "/")
}

function Get-SourceFileSnapshot {
  param([string]$WorkflowRootPath)

  $projectRoot = Get-ProjectRoot -WorkflowRootPath $WorkflowRootPath
  $snapshot = @{}
  $candidateRoots = @("src", "test", "tests", "examples", "public")
  $candidateFiles = @("package.json", "vite.config.ts", "vite.config.js", "tsconfig.json", "tsconfig.cli.json")

  foreach ($relativeRoot in $candidateRoots) {
    $absoluteRoot = Join-Path $projectRoot $relativeRoot
    if (-not (Test-Path $absoluteRoot)) { continue }

    Get-ChildItem -Path $absoluteRoot -File -Recurse | ForEach-Object {
      $relativePath = ConvertTo-PortablePath -BasePath $projectRoot -FilePath $_.FullName
      $snapshot[$relativePath] = Get-FileHashValue $_.FullName
    }
  }

  foreach ($relativeFile in $candidateFiles) {
    $absoluteFile = Join-Path $projectRoot $relativeFile
    if (-not (Test-Path $absoluteFile)) { continue }

    $snapshot[$relativeFile] = Get-FileHashValue $absoluteFile
  }

  return $snapshot
}

function Compare-SourceSnapshots {
  param(
    [hashtable]$Baseline,
    [hashtable]$Current
  )

  $changed = @()
  $allKeys = @($Baseline.Keys + $Current.Keys | Sort-Object -Unique)
  foreach ($key in $allKeys) {
    $baselineHash = if ($Baseline.ContainsKey($key)) { $Baseline[$key] } else { $null }
    $currentHash = if ($Current.ContainsKey($key)) { $Current[$key] } else { $null }

    if ($baselineHash -ne $currentHash) {
      $changed += $key
    }
  }

  return @($changed | Sort-Object)
}

function New-WorkflowArtifact {
  param([string]$Path)

  return @{
    path = $Path
    version = 1
    hash = "pending"
    approved_version = $null
  }
}

function Write-ImplementationRecord {
  param(
    [string]$RootPath,
    [string]$TaskId,
    [string]$Stage,
    [string]$ManifestPath
  )

  $recordPath = Join-Path $RootPath "docs/implementation/$TaskId.md"
  if (Test-Path $recordPath) { return }

  New-Item -ItemType Directory -Force (Split-Path -Parent $recordPath) | Out-Null
  $content = @"
# Implementation Record

## Task

- task_id: $TaskId
- stage: $Stage

## Source Change Manifest

- $ManifestPath

## Implementation Notes

- Record the implementation approach, key files, and registration path here.

## Verification

- Record commands and results here before requesting review.
"@
  Set-Content -Path $recordPath -Encoding utf8 -Value $content
}

function Write-SourceChangeManifest {
  param(
    [string]$RootPath,
    [string]$TaskId,
    [string]$Stage
  )

  $manifestPath = Join-Path $RootPath "docs/changes/$TaskId-changes.json"
  $currentFiles = Get-SourceFileSnapshot -WorkflowRootPath $RootPath
  $baselineFiles = $currentFiles

  if (Test-Path $manifestPath) {
    $existingManifest = Get-Content $manifestPath -Raw | ConvertFrom-Json -AsHashtable
    if ($existingManifest.baseline_files) {
      $baselineFiles = $existingManifest.baseline_files
    }
  } else {
    New-Item -ItemType Directory -Force (Split-Path -Parent $manifestPath) | Out-Null
  }

  # The manifest is the durable bridge from source edits to workflow state.
  $manifest = @{
    task_id = $TaskId
    stage = $Stage
    generated_at = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ssK")
    baseline_files = $baselineFiles
    current_files = $currentFiles
    changed_files = @(Compare-SourceSnapshots -Baseline $baselineFiles -Current $currentFiles)
  }

  $manifest | ConvertTo-Json -Depth 10 | Set-Content -Path $manifestPath -Encoding utf8
}

function Ensure-ImplementationArtifacts {
  param(
    [hashtable]$State,
    [string]$RootPath,
    [string]$Stage
  )

  if ($Stage -notin @("implementation", "fix_implementation", "hotfix_implementation")) {
    return
  }

  if (-not $State.artifacts.ContainsKey("implementation_record")) {
    $State.artifacts.implementation_record = New-WorkflowArtifact "docs/implementation/$($State.task_id).md"
  }

  if (-not $State.artifacts.ContainsKey("source_change_manifest")) {
    $State.artifacts.source_change_manifest = New-WorkflowArtifact "docs/changes/$($State.task_id)-changes.json"
  }

  Write-ImplementationRecord -RootPath $RootPath -TaskId $State.task_id -Stage $Stage -ManifestPath $State.artifacts.source_change_manifest.path
  Write-SourceChangeManifest -RootPath $RootPath -TaskId $State.task_id -Stage $Stage
}

function Update-ImplementationArtifacts {
  param(
    [hashtable]$State,
    [string]$RootPath,
    [string]$Stage
  )

  if ($State.artifacts.ContainsKey("source_change_manifest")) {
    Write-SourceChangeManifest -RootPath $RootPath -TaskId $State.task_id -Stage $Stage
  }
}

function Ensure-ArtifactRuntimeShapes {
  param(
    [hashtable]$State,
    [hashtable]$Runtime
  )

  if (-not $Runtime.artifact_versions) {
    $Runtime.artifact_versions = @{}
  }

  if (-not $State.bound_artifact_set) {
    $State.bound_artifact_set = @{}
  }

  if (-not $Runtime.bound_artifact_set) {
    $Runtime.bound_artifact_set = @{}
  }
}

function Sync-ArtifactVersions {
  param(
    [hashtable]$State,
    [hashtable]$Runtime,
    [string]$RootPath
  )

  Ensure-ArtifactRuntimeShapes -State $State -Runtime $Runtime
  $snapshot = @{}
  $boundSnapshot = @{}

  foreach ($artifactName in @($State.artifacts.Keys)) {
    $artifact = $State.artifacts[$artifactName]
    $artifactPath = Join-Path $RootPath $artifact.path
    $actualHash = Get-FileHashValue $artifactPath
    $currentHash = if ($artifact.hash) { [string]$artifact.hash } else { "pending" }
    $currentVersion = if ($artifact.version) { [int]$artifact.version } else { 1 }
    $recordedHash = $currentHash

    if ($actualHash -ne "pending" -and $currentHash -ne "pending" -and $currentHash -ne $actualHash) {
      $currentVersion = $currentVersion + 1
    }

    if ($actualHash -ne "pending") {
      $recordedHash = $actualHash
    }

    $artifact.version = $currentVersion
    $artifact.hash = $recordedHash
    $State.artifacts[$artifactName] = $artifact

    $Runtime.artifact_versions[$artifactName] = @{
      path = $artifact.path
      version = $currentVersion
      hash = $recordedHash
      approved_version = $artifact.approved_version
    }

    $boundKey = "${artifactName}_version"
    $State.bound_artifact_set[$boundKey] = $currentVersion
    $Runtime.bound_artifact_set[$boundKey] = $currentVersion
    $boundSnapshot[$boundKey] = $currentVersion
    $snapshot[$artifactName] = @{
      path = $artifact.path
      version = $currentVersion
      hash = $recordedHash
      approved_version = $artifact.approved_version
    }
  }

  return @{
    artifact_versions = $snapshot
    bound_artifact_set = $boundSnapshot
  }
}

function Assert-TransitionArtifacts {
  param(
    [hashtable]$State,
    [string]$RootPath
  )

  foreach ($artifactName in @($State.artifacts.Keys)) {
    $artifactPath = Join-Path $RootPath $State.artifacts[$artifactName].path
    if (-not (Test-Path $artifactPath)) {
      return @{
        passed = $false
        reason = "Missing artifact for transition: $($State.artifacts[$artifactName].path)"
        recovery = "restore or rewrite the missing artifact file, then rerun the same event"
      }
    }
  }

  return @{ passed = $true; reason = $null; recovery = $null }
}

function Add-RuntimeEvent {
  param(
    [hashtable]$Runtime,
    [string]$TaskId,
    [string]$Lane,
    [string]$Stage,
    [string]$Event,
    [string]$Result,
    [hashtable]$ArtifactSnapshot
  )

  $Runtime.event_cursor = [int]$Runtime.event_cursor + 1
  if (-not $Runtime.pending_events) {
    $Runtime.pending_events = @()
  }

  $eventRecord = @{
    event_type = $Event
    task_id = $TaskId
    lane = $Lane
    stage = $Stage
    actor = "operator"
    result = $Result
    timestamp = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ssK")
    idempotency_key = "$TaskId-$Event-$($Runtime.event_cursor)"
  }

  if ($ArtifactSnapshot) {
    $eventRecord.artifact_versions = $ArtifactSnapshot.artifact_versions
    $eventRecord.bound_artifact_set = $ArtifactSnapshot.bound_artifact_set
  }

  $Runtime.pending_events = @($Runtime.pending_events + $eventRecord)
}

function Block-Transition {
  param(
    [hashtable]$State,
    [hashtable]$Runtime,
    [string]$TaskId,
    [string]$Lane,
    [string]$Stage,
    [string]$Event,
    [string]$Reason,
    [string]$RecoveryCondition,
    [string]$StatePath,
    [string]$RuntimePath,
    [string]$RootPath
  )

  $State.status = "blocked"
  $State.blocked_from_stage = $Stage
  $State.blocked_reason = $Reason
  $State.recovery_condition = $RecoveryCondition
  $State.recovery_owner = "human"
  $State.resume_target_stage = $Stage
  $Runtime.current_stage = $Stage
  $Runtime.checkpoint_id = "cp-$TaskId-blocked-$('{0:d3}' -f ([int]$Runtime.event_cursor + 1))"
  $Runtime.checkpoint_payload = @{
    current_stage = $Stage
    blocked_reason = $Reason
    recovery_condition = $RecoveryCondition
  }
  $artifactSnapshot = Sync-ArtifactVersions -State $State -Runtime $Runtime -RootPath $RootPath
  Add-RuntimeEvent -Runtime $Runtime -TaskId $TaskId -Lane $Lane -Stage $Stage -Event $Event -Result "blocked" -ArtifactSnapshot $artifactSnapshot
  Save-WorkflowState -State $State -Runtime $Runtime -StatePath $StatePath -RuntimePath $RuntimePath
  throw "Blocked transition: $Reason. Recovery: $RecoveryCondition"
}

function Test-ArtifactExists {
  param(
    [hashtable]$State,
    [string]$RootPath,
    [string]$ArtifactName
  )

  if (-not $State.artifacts.ContainsKey($ArtifactName)) { return $false }
  $artifactPath = Join-Path $RootPath $State.artifacts[$ArtifactName].path
  return (Test-Path $artifactPath)
}

function Test-ArtifactHasEvidence {
  param(
    [hashtable]$State,
    [string]$RootPath,
    [string]$ArtifactName,
    [string[]]$Needles
  )

  if (-not (Test-ArtifactExists -State $State -RootPath $RootPath -ArtifactName $ArtifactName)) { return $false }
  $artifactPath = Join-Path $RootPath $State.artifacts[$ArtifactName].path
  $content = Get-Content -Encoding UTF8 $artifactPath -Raw
  foreach ($needle in $Needles) {
    if ($content -notmatch [regex]::Escape($needle)) { return $false }
  }
  return $true
}

function Test-TransitionGate {
  param(
    [hashtable]$State,
    [string]$RootPath,
    [string]$Event,
    [string]$FromStage,
    [string]$TargetStage
  )

  $lane = $State.lane
  if (($lane -eq "feature" -or $lane -eq "light-feature") -and $Event -eq "review_approved") {
    if ([int]$State.review_gates.proposal_blockers -gt 0 -or [int]$State.review_gates.proposal_high -gt 0) {
      return @{ passed = $false; reason = "proposal review still has blockers or high issues"; recovery = "resolve proposal review issues and set proposal blockers/high to 0" }
    }
  }

  if (($lane -eq "feature" -or $lane -eq "light-feature") -and $Event -eq "implementation_started") {
    if (-not [bool]$State.user_confirmation.proposal_approved) {
      return @{ passed = $false; reason = "proposal is not approved"; recovery = "run next with -Event approval_received from await_user_confirmation before implementation" }
    }
  }

  if (($lane -eq "feature" -or $lane -eq "light-feature") -and $Event -eq "verification_passed") {
    $State.review_gates.verification_passed = $true
  }

  if ($lane -eq "bugfix" -and $Event -eq "reproduced") {
    if (-not (Test-ArtifactHasEvidence -State $State -RootPath $RootPath -ArtifactName "bugfix_report" -Needles @("## Reproduction"))) {
      return @{ passed = $false; reason = "bugfix report is missing reproduction evidence section"; recovery = "record reproduction evidence in the bugfix report" }
    }
  }

  if ($lane -eq "bugfix" -and $Event -eq "root_cause_found") {
    if (-not (Test-ArtifactHasEvidence -State $State -RootPath $RootPath -ArtifactName "bugfix_report" -Needles @("## Root Cause"))) {
      return @{ passed = $false; reason = "bugfix report is missing root cause evidence"; recovery = "record root cause evidence in the bugfix report" }
    }
  }

  if ($lane -eq "bugfix" -and $Event -eq "regression_passed") {
    if (-not (Test-ArtifactHasEvidence -State $State -RootPath $RootPath -ArtifactName "bugfix_report" -Needles @("## Regression Verification"))) {
      return @{ passed = $false; reason = "bugfix report is missing regression verification evidence"; recovery = "record regression verification in the bugfix report" }
    }
  }

  if ($lane -eq "hotfix" -and $Event -eq "implementation_started") {
    if (-not (Test-ArtifactHasEvidence -State $State -RootPath $RootPath -ArtifactName "hotfix_record" -Needles @("## Rollback Strategy", "## Owner"))) {
      return @{ passed = $false; reason = "hotfix record is missing owner or rollback strategy"; recovery = "record owner and rollback strategy in the hotfix record" }
    }
  }

  return @{ passed = $true; reason = $null; recovery = $null }
}

$rootPath = (Resolve-Path $Root).Path
$statePath = Join-Path $rootPath "workflow\state\$TaskId.json"
$runtimePath = Join-Path $rootPath "workflow\runtime\$TaskId.runtime.json"

if (-not (Test-Path $statePath)) {
  throw "Missing state file: $statePath"
}

if (-not (Test-Path $runtimePath)) {
  throw "Missing runtime file: $runtimePath"
}

$state = Get-Content $statePath -Raw | ConvertFrom-Json -AsHashtable
$runtime = Get-Content $runtimePath -Raw | ConvertFrom-Json -AsHashtable
$lane = $state.lane
$fromStage = $state.current_stage

if ($fromStage -eq "await_user_confirmation" -and $Event -eq "approval_received") {
  $state.user_confirmation.proposal_approved = $true
  $targetStage = "implementation_plan"
} elseif ($fromStage -eq "await_user_confirmation" -and $Event -eq "revision_requested") {
  $state.feedback_type = if ($FeedbackType) { $FeedbackType } else { "minor_revision" }
  $state.change_scope_level = if ($ChangeScopeLevel) { $ChangeScopeLevel } else { "small" }
  $targetStage = "proposal_revise"
} elseif ($fromStage -eq "await_user_confirmation" -and $Event -eq "approval_rejected") {
  $state.feedback_type = if ($FeedbackType) { $FeedbackType } else { "scope_change" }
  $state.change_scope_level = if ($ChangeScopeLevel) { $ChangeScopeLevel } else { "medium" }
  if ($state.feedback_type -eq "goal_change") {
    $targetStage = "requirements_frozen"
  } else {
    $targetStage = "clarification"
  }
} else {
  $transitionMap = Get-TransitionMap
  $laneMap = $transitionMap[$lane]
  if (-not $laneMap) {
    throw "Unsupported lane: $lane"
  }

  $key = "$fromStage|$Event"
  $targetStage = $laneMap[$key]
}

if (-not $targetStage) {
  throw "No valid transition for lane '$lane' from stage '$fromStage' with event '$Event'"
}

$artifactGate = Assert-TransitionArtifacts -State $state -RootPath $rootPath
if (-not $artifactGate.passed) {
  Block-Transition -State $state -Runtime $runtime -TaskId $TaskId -Lane $lane -Stage $fromStage -Event $Event -Reason $artifactGate.reason -RecoveryCondition $artifactGate.recovery -StatePath $statePath -RuntimePath $runtimePath -RootPath $rootPath
}

$gate = Test-TransitionGate -State $state -RootPath $rootPath -Event $Event -FromStage $fromStage -TargetStage $targetStage
if (-not $gate.passed) {
  Block-Transition -State $state -Runtime $runtime -TaskId $TaskId -Lane $lane -Stage $fromStage -Event $Event -Reason $gate.reason -RecoveryCondition $gate.recovery -StatePath $statePath -RuntimePath $runtimePath -RootPath $rootPath
}

Ensure-ImplementationArtifacts -State $state -RootPath $rootPath -Stage $targetStage
Update-ImplementationArtifacts -State $state -RootPath $rootPath -Stage $targetStage
$artifactSnapshot = Sync-ArtifactVersions -State $state -Runtime $runtime -RootPath $rootPath

$nextEventCursor = [int]$runtime.event_cursor + 1
$runtime.checkpoint_id = "cp-$TaskId-$('{0:d3}' -f $nextEventCursor)"
$runtime.checkpoint_payload = @{
  current_stage = $targetStage
  last_successful_transition = "$fromStage -> $targetStage"
}
$runtime.current_stage = $targetStage
$state.current_stage = $targetStage
$state.blocked_from_stage = $null
$state.blocked_reason = $null
$state.recovery_condition = $null
$state.recovery_owner = $null
$state.resume_target_stage = $null

if ($targetStage -eq "done") {
  $state.status = "done"
} elseif ($targetStage -eq "blocked") {
  $state.status = "blocked"
} else {
  $state.status = "in_progress"
}

Add-RuntimeEvent -Runtime $runtime -TaskId $TaskId -Lane $lane -Stage $fromStage -Event $Event -Result "advanced" -ArtifactSnapshot $artifactSnapshot
Save-WorkflowState -State $state -Runtime $runtime -StatePath $statePath -RuntimePath $runtimePath

Write-Output "Advanced task '$TaskId'"
Write-Output "  Lane:       $lane"
Write-Output "  From stage: $fromStage"
Write-Output "  Event:      $Event"
Write-Output "  To stage:   $targetStage"
