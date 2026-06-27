param(
    [string]$PluginSource,
    [string]$DestinationDir
)

$ErrorActionPreference = "Stop"

if ([string]::IsNullOrWhiteSpace($PluginSource)) {
    $PluginSource = Join-Path $PSScriptRoot "..\plugin\CodexStudioBridge.plugin.lua"
}

if ([string]::IsNullOrWhiteSpace($DestinationDir)) {
    if ([string]::IsNullOrWhiteSpace($env:LOCALAPPDATA)) {
        throw "LOCALAPPDATA is not set; pass -DestinationDir explicitly."
    }
    $DestinationDir = Join-Path $env:LOCALAPPDATA "Roblox\Plugins"
}

$resolvedSource = Resolve-Path -LiteralPath $PluginSource
New-Item -ItemType Directory -Force -Path $DestinationDir | Out-Null

$destination = Join-Path $DestinationDir "CodexStudioBridge.plugin.lua"
$backupPath = $null
if (Test-Path -LiteralPath $destination) {
    $timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
    $backupDir = Join-Path $env:LOCALAPPDATA "CodexStudioBridgeBackups"
    New-Item -ItemType Directory -Force -Path $backupDir | Out-Null
    $backupPath = Join-Path $backupDir "CodexStudioBridge.plugin.$timestamp.lua.bak"
    Copy-Item -LiteralPath $destination -Destination $backupPath -Force
}
Copy-Item -LiteralPath $resolvedSource -Destination $destination -Force

$version = "unknown"
$versionMatch = Select-String -LiteralPath $destination -Pattern 'local\s+VERSION\s*=\s*["'']([^"'']+)["'']' | Select-Object -First 1
if ($versionMatch -and $versionMatch.Matches.Count -gt 0) {
    $version = $versionMatch.Matches[0].Groups[1].Value
}

Write-Host "Installed Codex Studio Bridge plugin:"
Write-Host "  $destination"
Write-Host "Version:"
Write-Host "  $version"
if ($backupPath) {
    Write-Host "Backup of previous plugin:"
    Write-Host "  $backupPath"
} else {
    Write-Host "Backup of previous plugin:"
    Write-Host "  none (first install at this path)"
}
Write-Host ""
Write-Host "Next steps:"
Write-Host "  1. Run: .\tools\bridge.cmd connect"
Write-Host "  2. Open Roblox Studio."
Write-Host "  3. Open the Codex Studio Bridge plugin panel."
Write-Host "  4. Enter the pairing code printed by connect."
Write-Host "  5. Full Trust Autopilot runs Codex Ready Setup automatically."
Write-Host "  6. Verify trust/readiness with: .\tools\bridge.cmd trust status; .\tools\bridge.cmd ready verify"
Write-Host "  Emergency pause: .\tools\bridge.cmd trust emergency-stop"
