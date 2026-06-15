param(
  [Parameter(Mandatory = $true)]
  [string]$TaskId,

  [Parameter(Mandatory = $true)]
  [string]$Title,

  [Parameter(Mandatory = $true)]
  [ValidateSet("feature", "light-feature", "bugfix", "hotfix", "research")]
  [string]$Lane,

  [string]$Root = ".",
  [switch]$Force
)

$ErrorActionPreference = "Stop"

function New-ArtifactObject {
  param(
    [string]$Path
  )

  return @{
    path = $Path
    version = 1
    hash = "pending"
    approved_version = $null
  }
}

function Get-FileHashValue {
  param([string]$Path)
  if (-not (Test-Path $Path)) {
    return "pending"
  }

  # Use the .NET implementation so fresh installs work even in restricted PowerShell hosts.
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

function Expand-TemplateContent {
  param(
    [string]$Content,
    [string]$TaskId,
    [string]$Title,
    [string]$Lane,
    [string]$Stage
  )

  $createdAt = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ssK")
  return $Content.
    Replace("{{task_id}}", $TaskId).
    Replace("{{title}}", $Title).
    Replace("{{lane}}", $Lane).
    Replace("{{stage}}", $Stage).
    Replace("{{created_at}}", $createdAt).
    Replace("{{owner}}", "todo").
    Replace("{{status}}", "in_progress")
}

function New-ArtifactFile {
  param(
    [string]$RootPath,
    [string]$TemplatePath,
    [string]$RelativePath,
    [string]$TaskId,
    [string]$Title,
    [string]$Lane,
    [string]$Stage,
    [switch]$Force
  )

  $targetPath = Join-Path $RootPath $RelativePath
  $targetDir = Split-Path -Parent $targetPath
  New-Item -ItemType Directory -Force $targetDir | Out-Null

  if ((Test-Path $targetPath) -and -not $Force) {
    throw "Artifact already exists: $targetPath. Re-run with -Force to overwrite."
  }

  $content = if (Test-Path $TemplatePath) {
    Get-Content -Encoding UTF8 $TemplatePath -Raw
  } else {
    "# $Title`n`n## Task`n`n- ID: $TaskId`n- Lane: $Lane`n- Stage: $Stage`n"
  }

  $expanded = Expand-TemplateContent -Content $content -TaskId $TaskId -Title $Title -Lane $Lane -Stage $Stage
  if ($expanded -notmatch [regex]::Escape($TaskId)) {
    $expanded = "<!-- task_id: $TaskId -->`n<!-- title: $Title -->`n<!-- lane: $Lane -->`n<!-- stage: $Stage -->`n`n$expanded"
  }

  Set-Content -Path $targetPath -Encoding utf8 -Value $expanded
}

$rootPath = (Resolve-Path $Root).Path
$stateDir = Join-Path $rootPath "workflow\state"
$runtimeDir = Join-Path $rootPath "workflow\runtime"
$docsDir = Join-Path $rootPath "docs"
$templateDir = Join-Path $rootPath "workflow\templates"

New-Item -ItemType Directory -Force $stateDir | Out-Null
New-Item -ItemType Directory -Force $runtimeDir | Out-Null
New-Item -ItemType Directory -Force $docsDir | Out-Null

$statePath = Join-Path $stateDir "$TaskId.json"
$runtimePath = Join-Path $runtimeDir "$TaskId.runtime.json"

if ((Test-Path $statePath) -and -not $Force) {
  throw "Task state already exists: $statePath"
}

if ((Test-Path $runtimePath) -and -not $Force) {
  throw "Task runtime already exists: $runtimePath"
}

$artifacts = @{}
$boundArtifactSet = @{}
$currentStage = ""

switch ($Lane) {
  "feature" {
    New-Item -ItemType Directory -Force (Join-Path $docsDir "requirements") | Out-Null
    New-Item -ItemType Directory -Force (Join-Path $docsDir "proposals") | Out-Null
    $artifacts.requirements = New-ArtifactObject "docs/requirements/$TaskId.md"
    $artifacts.proposal = New-ArtifactObject "docs/proposals/$TaskId.md"
    $artifacts.acceptance = New-ArtifactObject "docs/acceptance/$TaskId.md"
    $boundArtifactSet.requirements_version = 1
    $boundArtifactSet.proposal_version = 1
    $boundArtifactSet.acceptance_version = 1
    $currentStage = "intake"
  }
  "light-feature" {
    New-Item -ItemType Directory -Force (Join-Path $docsDir "requirements") | Out-Null
    New-Item -ItemType Directory -Force (Join-Path $docsDir "proposals") | Out-Null
    $artifacts.requirements = New-ArtifactObject "docs/requirements/$TaskId.md"
    $artifacts.proposal = New-ArtifactObject "docs/proposals/$TaskId.md"
    $artifacts.acceptance = New-ArtifactObject "docs/acceptance/$TaskId.md"
    $boundArtifactSet.requirements_version = 1
    $boundArtifactSet.proposal_version = 1
    $boundArtifactSet.acceptance_version = 1
    $currentStage = "intake"
  }
  "bugfix" {
    New-Item -ItemType Directory -Force (Join-Path $docsDir "bugs") | Out-Null
    New-Item -ItemType Directory -Force (Join-Path $docsDir "acceptance") | Out-Null
    $artifacts.bugfix_report = New-ArtifactObject "docs/bugs/$TaskId-report.md"
    $artifacts.acceptance = New-ArtifactObject "docs/acceptance/$TaskId.md"
    $boundArtifactSet.bugfix_report_version = 1
    $boundArtifactSet.acceptance_version = 1
    $currentStage = "bug_intake"
  }
  "hotfix" {
    New-Item -ItemType Directory -Force (Join-Path $docsDir "hotfix") | Out-Null
    $artifacts.hotfix_record = New-ArtifactObject "docs/hotfix/$TaskId.md"
    $artifacts.postmortem = New-ArtifactObject "docs/hotfix/$TaskId-postmortem.md"
    $boundArtifactSet.hotfix_record_version = 1
    $boundArtifactSet.postmortem_version = 1
    $currentStage = "incident_intake"
  }
  "research" {
    New-Item -ItemType Directory -Force (Join-Path $docsDir "research") | Out-Null
    $artifacts.decision_record = New-ArtifactObject "docs/research/$TaskId-decision.md"
    $boundArtifactSet.decision_record_version = 1
    $currentStage = "research_intake"
  }
}

$templateByArtifact = @{
  requirements = "requirements-template.md"
  proposal = "proposal-template.md"
  acceptance = "acceptance-template.md"
  bugfix_report = "bugfix-report-template.md"
  hotfix_record = "hotfix-template.md"
  postmortem = "postmortem-template.md"
  decision_record = "decision-record-template.md"
}

foreach ($artifactName in $artifacts.Keys) {
  $relativePath = $artifacts[$artifactName].path
  $templateName = $templateByArtifact[$artifactName]
  $templatePath = if ($templateName) { Join-Path $templateDir $templateName } else { "" }
  New-ArtifactFile -RootPath $rootPath -TemplatePath $templatePath -RelativePath $relativePath -TaskId $TaskId -Title $Title -Lane $Lane -Stage $currentStage -Force:$Force
  $artifacts[$artifactName].hash = Get-FileHashValue (Join-Path $rootPath $relativePath)
}

$state = @{
  task_id = $TaskId
  title = $Title
  lane = $Lane
  current_stage = $currentStage
  status = "in_progress"
  feedback_type = $null
  change_scope_level = $null
  blocked_from_stage = $null
  blocked_reason = $null
  recovery_condition = $null
  recovery_owner = $null
  resume_target_stage = $null
  user_confirmation = @{
    proposal_approved = $false
    implementation_approved = $false
  }
  review_gates = @{
    proposal_blockers = 0
    proposal_high = 0
    code_blockers = 0
    verification_passed = $false
  }
  rounds = @{
    proposal_review_round = 0
    code_review_round = 0
  }
  artifacts = $artifacts
  bound_artifact_set = $boundArtifactSet
}

$runtime = @{
  run_id = "run-$TaskId-001"
  task_id = $TaskId
  lane = $Lane
  current_stage = $currentStage
  checkpoint_id = "cp-$TaskId-001"
  event_cursor = 0
  checkpoint_payload = @{
    current_stage = $currentStage
    last_successful_transition = "initialized"
  }
  pending_events = @()
  retry_count = 0
  timeout_policy = @{}
  side_effects = @()
  idempotency_keys = @("init-$TaskId")
  artifact_versions = @{}
  bound_artifact_set = $boundArtifactSet
  review_trace = @()
  approval_trace = @()
  active_agent_run_ids = @()
}

foreach ($key in $artifacts.Keys) {
  $runtime.artifact_versions[$key] = @{
    version = 1
    hash = $artifacts[$key].hash
    approved_version = $null
  }
}

$state | ConvertTo-Json -Depth 10 | Set-Content -Path $statePath -Encoding utf8
$runtime | ConvertTo-Json -Depth 10 | Set-Content -Path $runtimePath -Encoding utf8

Write-Output "Initialized task:"
Write-Output "  State:   $statePath"
Write-Output "  Runtime: $runtimePath"
Write-Output "  Artifacts:"
foreach ($key in $artifacts.Keys) {
  Write-Output "    ${key}: $($artifacts[$key].path)"
}
