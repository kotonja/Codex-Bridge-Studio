param(
  [string]$TaskName
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent (Split-Path -Parent $PSCommandPath)
$supervisor = Join-Path $root "bridge\supervisor.js"
if (-not $TaskName) {
  $sha1 = [System.Security.Cryptography.SHA1]::Create()
  $bytes = [System.Text.Encoding]::UTF8.GetBytes($root)
  $hash = -join ($sha1.ComputeHash($bytes) | ForEach-Object { $_.ToString("x2") })
  $TaskName = "CodexStudioBridgeSupervisor-$($hash.Substring(0, 8))"
}

schtasks.exe /Delete /TN $TaskName /F | Out-Host

$needle = $supervisor.ToLowerInvariant()
Get-CimInstance Win32_Process |
  Where-Object {
    ($_.Name -eq "node.exe" -or $_.Name -eq "node") -and
    $_.CommandLine -and
    $_.CommandLine.ToLowerInvariant().Contains($needle)
  } |
  ForEach-Object {
    Stop-Process -Id $_.ProcessId -Force
    Write-Host "Stopped supervisor PID $($_.ProcessId)"
  }

Write-Host "Uninstalled Codex StudioBridge supervisor task: $TaskName"
