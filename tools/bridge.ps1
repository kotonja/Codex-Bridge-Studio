param(
    [Parameter(ValueFromRemainingArguments = $true)]
    [string[]]$BridgeArgs
)

$ErrorActionPreference = "Stop"

$scriptPath = Join-Path $PSScriptRoot "bridge.js"
node $scriptPath @BridgeArgs

