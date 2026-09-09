# validate-diagram.ps1 - Validate draw.io XML locally (Windows)
# Usage: .\validate-diagram.ps1 <source.xml> [more.xml ...]
#        .\validate-diagram.ps1 -Dir docs\images\src

param(
    [Parameter(ValueFromRemainingArguments = $true)]
    [string[]]$Files,
    [string]$Dir,
    [switch]$CheckOverlap,
    [switch]$Quiet
)

$ErrorActionPreference = "Stop"
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$pyScript = Join-Path $scriptDir "validate-diagram.py"

function Find-Python {
    foreach ($name in @("python", "python3", "py")) {
        $cmd = Get-Command $name -ErrorAction SilentlyContinue
        if ($cmd) { return $cmd.Source }
    }
    return $null
}

$python = Find-Python
if (-not $python) {
    Write-Error "Python not found. Install Python 3 or use Git Bash with validate-diagram.sh."
    exit 1
}

$argsList = @($pyScript)
if ($Dir) { $argsList += @("--dir", $Dir) }
if ($CheckOverlap) { $argsList += "--check-overlap" }
if ($Quiet) { $argsList += "--quiet" }
if ($Files) { $argsList += $Files }

& $python @argsList
exit $LASTEXITCODE
