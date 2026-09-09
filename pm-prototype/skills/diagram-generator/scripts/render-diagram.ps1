# render-diagram.ps1 - Render draw.io XML to PNG/JPEG/SVG (Windows)
# Usage: .\render-diagram.ps1 <source.xml> <output.png>

param(
    [Parameter(Mandatory = $true, Position = 0)]
    [string]$SourceFile,
    [Parameter(Mandatory = $true, Position = 1)]
    [string]$OutputFile
)

$ErrorActionPreference = "Stop"
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$pyScript = Join-Path $scriptDir "render-diagram.py"

function Find-Python {
    $candidates = @("python", "python3", "py")
    foreach ($name in $candidates) {
        $cmd = Get-Command $name -ErrorAction SilentlyContinue
        if ($cmd) { return $cmd.Source }
    }
    return $null
}

$python = Find-Python
if (-not $python) {
    Write-Error "Python not found. Install Python 3 or use Git Bash with render-diagram.sh."
    exit 1
}

& $python $pyScript $SourceFile $OutputFile
if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
}
