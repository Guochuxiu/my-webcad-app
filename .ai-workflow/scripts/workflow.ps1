param(
  [Parameter(Position = 0, Mandatory = $true)]
  [ValidateSet("install", "start", "status", "next", "handoff", "verify")]
  [string]$Command,

  [string]$TaskId,
  [string]$Title,
  [ValidateSet("feature", "light-feature", "bugfix", "hotfix", "research")]
  [string]$Lane,
  [string]$Event,
  [string]$Root = ".",
  [string]$Target,
  [switch]$Force,
  [switch]$Strict,
  [switch]$Write
)

$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$defaultWorkflowRoot = (Resolve-Path (Join-Path $scriptDir "..")).Path
if ($Root -eq ".") {
  $Root = $defaultWorkflowRoot
}

function Invoke-ProjectInstall {
  param(
    [string]$SourceRoot,
    [string]$TargetRoot,
    [switch]$Force
  )

  if (-not $TargetRoot) {
    $TargetRoot = $SourceRoot
  }

  $resolvedSource = (Resolve-Path $SourceRoot).Path
  if (-not (Test-Path $TargetRoot)) {
    New-Item -ItemType Directory -Force $TargetRoot | Out-Null
  }
  $resolvedTarget = (Resolve-Path $TargetRoot).Path

  $items = @(".agents", "workflow", "docs\examples", "AGENTS.md", "PROJECT-ADOPTION.md", "TESTING.md")
  foreach ($item in $items) {
    $source = Join-Path $resolvedSource $item
    $targetPath = Join-Path $resolvedTarget $item
    if (-not (Test-Path $source)) { continue }
    if ((Test-Path $targetPath) -and -not $Force) {
      Write-Output "Skip existing: $targetPath"
      continue
    }
    Copy-Item -Path $source -Destination $targetPath -Recurse -Force:$Force
    Write-Output "Installed: $item"
  }
}

switch ($Command) {
  "install" {
    Invoke-ProjectInstall -SourceRoot $Root -TargetRoot $Target -Force:$Force
  }
  "start" {
    if (-not $TaskId) { throw "Missing -TaskId for start" }
    if (-not $Title) { throw "Missing -Title for start" }
    if (-not $Lane) { throw "Missing -Lane for start" }
    & (Join-Path $scriptDir "init-task.ps1") -Root $Root -TaskId $TaskId -Title $Title -Lane $Lane -Force:$Force
  }
  "status" {
    if (-not $TaskId) { throw "Missing -TaskId for status" }
    & (Join-Path $scriptDir "status-task.ps1") -Root $Root -TaskId $TaskId
  }
  "next" {
    if (-not $TaskId) { throw "Missing -TaskId for next" }
    if (-not $Event) {
      & (Join-Path $scriptDir "status-task.ps1") -Root $Root -TaskId $TaskId
      throw "Missing -Event for next. Choose one allowed event from status output."
    }
    & (Join-Path $scriptDir "advance-task.ps1") -Root $Root -TaskId $TaskId -Event $Event
  }
  "handoff" {
    if (-not $TaskId) { throw "Missing -TaskId for handoff" }
    & (Join-Path $scriptDir "handoff-task.ps1") -Root $Root -TaskId $TaskId -Write:$Write
  }
  "verify" {
    if ($TaskId) {
      & (Join-Path $scriptDir "validate-workflow.ps1") -Root $Root -TaskId $TaskId -Strict:$Strict
    } else {
      & (Join-Path $scriptDir "validate-workflow.ps1") -Root $Root -Strict:$Strict
    }
  }
}
