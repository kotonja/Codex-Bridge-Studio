param(
  [string]$TaskName
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent (Split-Path -Parent $PSCommandPath)
$supervisor = Join-Path $root "bridge\supervisor.js"
if (-not (Test-Path -LiteralPath $supervisor)) {
  throw "Supervisor script not found: $supervisor"
}

$node = (Get-Command node.exe -ErrorAction Stop).Source
if (-not $TaskName) {
  $sha1 = [System.Security.Cryptography.SHA1]::Create()
  $bytes = [System.Text.Encoding]::UTF8.GetBytes($root)
  $hash = -join ($sha1.ComputeHash($bytes) | ForEach-Object { $_.ToString("x2") })
  $TaskName = "CodexStudioBridgeSupervisor-$($hash.Substring(0, 8))"
}

$taskRun = "`"$node`" `"$supervisor`" run"
schtasks.exe /Create /TN $TaskName /TR $taskRun /SC ONLOGON /F | Out-Host

Start-Process -FilePath $node -ArgumentList @($supervisor, "run") -WorkingDirectory $root -WindowStyle Hidden

Write-Host "Installed Codex StudioBridge supervisor task: $TaskName"
Write-Host "Supervisor: $supervisor"
Write-Host "Next: .\tools\bridge.cmd always-on status"
