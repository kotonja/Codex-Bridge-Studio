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

$repoRoot = Resolve-Path -LiteralPath (Join-Path $PSScriptRoot "..")
$checkScript = Join-Path $repoRoot "scripts\check-plugin-bundle.js"
$bundleScript = Join-Path $repoRoot "scripts\bundle-plugin.js"
if (Test-Path -LiteralPath $checkScript) {
    $nodeCommand = Get-Command node -ErrorAction SilentlyContinue
    if (-not $nodeCommand) {
        throw "Node.js is required to verify/build the plugin bundle, but 'node' was not found on PATH."
    }

    Push-Location $repoRoot
    try {
        & $nodeCommand.Source $checkScript
        if ($LASTEXITCODE -ne 0) {
            Write-Warning "Plugin bundle is stale; rebuilding before install."
            & $nodeCommand.Source $bundleScript
            if ($LASTEXITCODE -ne 0) {
                throw "Plugin bundle rebuild failed. Run: node scripts\bundle-plugin.js"
            }
        }
    } finally {
        Pop-Location
    }
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
