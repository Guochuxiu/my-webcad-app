param(
  [string]$Root = ".",
  [string]$TaskId,
  [switch]$Strict,
  [switch]$FixHashes
)

$ErrorActionPreference = "Stop"

function Assert-File {
  param([string]$Path)
  if (-not (Test-Path $Path)) {
    throw "Missing required file: $Path"
  }
}

function Assert-JsonFile {
  param([string]$Path)
  Assert-File $Path
  try {
    Get-Content $Path -Raw | ConvertFrom-Json | Out-Null
  } catch {
    throw "Invalid JSON: $Path"
  }
}

function Get-FileHashValue {
  param([string]$Path)
  # Use the .NET implementation so validation does not depend on a specific PowerShell module.
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

function Assert-TaskPair {
  param(
    [string]$RootPath,
    [string]$StatePath,
    [switch]$Strict,
    [switch]$FixHashes
  )

  $taskId = [System.IO.Path]::GetFileNameWithoutExtension($StatePath)
  $runtimePath = Join-Path $RootPath "workflow\runtime\$taskId.runtime.json"
  Assert-JsonFile $StatePath
  Assert-JsonFile $runtimePath

  $state = Get-Content $StatePath -Raw | ConvertFrom-Json -AsHashtable
  $runtime = Get-Content $runtimePath -Raw | ConvertFrom-Json -AsHashtable

  if ($state.task_id -ne $runtime.task_id) { throw "Task id mismatch for $taskId" }
  if ($state.lane -ne $runtime.lane) { throw "Lane mismatch for $taskId" }
  if ($state.current_stage -ne $runtime.current_stage) { throw "Stage mismatch for $taskId" }
  if ($state.status -eq "blocked" -and -not $state.blocked_reason) { throw "Blocked task missing reason: $taskId" }
  if ($Strict -and (-not $state.artifacts -or $state.artifacts.Keys.Count -eq 0)) {
    throw "Task has no authoritative artifacts: $taskId"
  }

  if ($Strict -and -not $runtime.artifact_versions) {
    throw "Runtime missing artifact_versions: $taskId"
  }

  foreach ($artifactName in @($state.artifacts.Keys)) {
    $artifact = $state.artifacts[$artifactName]
    if ($Strict -and -not $artifact.path) {
      throw "Artifact missing path for ${taskId}: $artifactName"
    }

    if ($Strict -and -not $runtime.artifact_versions.ContainsKey($artifactName)) {
      throw "Runtime missing artifact version for ${taskId}: $artifactName"
    }

    $boundKey = "${artifactName}_version"
    if ($Strict -and (-not $state.bound_artifact_set -or -not $state.bound_artifact_set.ContainsKey($boundKey))) {
      throw "State missing bound artifact version for ${taskId}: $boundKey"
    }

    if ($Strict -and (-not $runtime.bound_artifact_set -or -not $runtime.bound_artifact_set.ContainsKey($boundKey))) {
      throw "Runtime missing bound artifact version for ${taskId}: $boundKey"
    }

    if ($Strict -and [int]$state.bound_artifact_set[$boundKey] -ne [int]$artifact.version) {
      throw "State bound artifact version mismatch for ${taskId}: $boundKey"
    }

    if ($Strict -and [int]$runtime.bound_artifact_set[$boundKey] -ne [int]$artifact.version) {
      throw "Runtime bound artifact version mismatch for ${taskId}: $boundKey"
    }

    if ($Strict -and [int]$runtime.artifact_versions[$artifactName].version -ne [int]$artifact.version) {
      throw "Runtime artifact version mismatch for ${taskId}: $artifactName"
    }

    if ($Strict -and $runtime.artifact_versions[$artifactName].ContainsKey("path") -and $runtime.artifact_versions[$artifactName].path -ne $artifact.path) {
      throw "Runtime artifact path mismatch for ${taskId}: $artifactName"
    }

    $artifactPath = Join-Path $RootPath $artifact.path
    if ($Strict -and -not (Test-Path $artifactPath)) {
      throw "Missing artifact for ${taskId}: $($artifact.path)"
    }

    if ((Test-Path $artifactPath) -and ($Strict -or $FixHashes)) {
      $actualHash = Get-FileHashValue $artifactPath
      if ($FixHashes) {
        $state.artifacts[$artifactName].hash = $actualHash
        if ($runtime.artifact_versions.ContainsKey($artifactName)) {
          $runtime.artifact_versions[$artifactName].hash = $actualHash
        }
      } elseif ($artifact.hash -ne $actualHash) {
        throw "Artifact hash mismatch for ${taskId}: $($artifact.path)"
      } elseif ($runtime.artifact_versions.ContainsKey($artifactName) -and $runtime.artifact_versions[$artifactName].hash -ne $actualHash) {
        throw "Runtime artifact hash mismatch for ${taskId}: $($artifact.path)"
      }
    }
  }

  if ($FixHashes) {
    $state | ConvertTo-Json -Depth 10 | Set-Content -Path $StatePath -Encoding utf8
    $runtime | ConvertTo-Json -Depth 10 | Set-Content -Path $runtimePath -Encoding utf8
  }
}

$rootPath = (Resolve-Path $Root).Path

$requiredFiles = @(
  ".agents/skills/workflow-orchestrator/SKILL.md",
  ".agents/skills/bugfix-workflow/SKILL.md",
  ".agents/skills/proposal-review/SKILL.md",
  ".agents/skills/verification-gate/SKILL.md",
  "workflow/state-machine.md",
  "workflow/state/task-state.schema.json",
  "workflow/runtime/schema.json",
  "workflow/runtime/event-model.md"
)

foreach ($relativePath in $requiredFiles) {
  Assert-File (Join-Path $rootPath $relativePath)
}

$requiredJsonFiles = @(
  "workflow/state/task-state.schema.json",
  "workflow/runtime/schema.json",
  "workflow/state/example-feature-task.json",
  "workflow/state/example-bugfix-task.json",
  "workflow/runtime/example-feature-runtime.json",
  "workflow/runtime/example-bugfix-runtime.json"
)

foreach ($relativePath in $requiredJsonFiles) {
  Assert-JsonFile (Join-Path $rootPath $relativePath)
}

$requiredTemplates = @(
  "workflow/templates/requirements-template.md",
  "workflow/templates/capability-template.md",
  "workflow/templates/proposal-template.md",
  "workflow/templates/bugfix-report-template.md",
  "workflow/templates/hotfix-template.md",
  "workflow/templates/acceptance-template.md"
)

foreach ($relativePath in $requiredTemplates) {
  Assert-File (Join-Path $rootPath $relativePath)
}

$examples = @(
  "docs/examples/feature-kickoff-prompt.md",
  "docs/examples/bugfix-kickoff-prompt.md",
  "docs/examples/webcad-feature-kickoff-prompt.md"
)

foreach ($relativePath in $examples) {
  Assert-File (Join-Path $rootPath $relativePath)
}

$knowledgeManifest = Join-Path $rootPath "knowledge/webcad/route-manifest.json"
Assert-JsonFile $knowledgeManifest

$stateFiles = if ($TaskId) {
  @(Join-Path $rootPath "workflow\state\$TaskId.json")
} else {
  @(Get-ChildItem (Join-Path $rootPath "workflow\state") -Filter "*.json" | Where-Object { $_.Name -notin @("task-state.schema.json", "example-feature-task.json", "example-bugfix-task.json") } | ForEach-Object { $_.FullName })
}

foreach ($stateFile in $stateFiles) {
  Assert-TaskPair -RootPath $rootPath -StatePath $stateFile -Strict:$Strict -FixHashes:$FixHashes
}

$featureState = Get-Content (Join-Path $rootPath "workflow/state/example-feature-task.json") -Raw | ConvertFrom-Json -AsHashtable
$bugfixState = Get-Content (Join-Path $rootPath "workflow/state/example-bugfix-task.json") -Raw | ConvertFrom-Json -AsHashtable
$featureRuntime = Get-Content (Join-Path $rootPath "workflow/runtime/example-feature-runtime.json") -Raw | ConvertFrom-Json -AsHashtable
$bugfixRuntime = Get-Content (Join-Path $rootPath "workflow/runtime/example-bugfix-runtime.json") -Raw | ConvertFrom-Json -AsHashtable

if ($featureState.lane -ne "feature") {
  throw "Example feature task lane mismatch"
}

if ($bugfixState.lane -ne "bugfix") {
  throw "Example bugfix task lane mismatch"
}

if ($featureRuntime.task_id -ne $featureState.task_id) {
  throw "Feature runtime task_id mismatch"
}

if ($bugfixRuntime.task_id -ne $bugfixState.task_id) {
  throw "Bugfix runtime task_id mismatch"
}

Write-Output "Workflow MVP validation passed."
Write-Output "Root: $rootPath"
if ($Strict) { Write-Output "Strict checks: enabled" }
