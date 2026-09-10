# export-word.ps1 - Export Markdown to Word (.docx) on Windows
# Usage: .\export-word.ps1 <markdown-file> <template>

param(
    [Parameter(Mandatory = $true, Position = 0)]
    [string]$MarkdownFile,
    [Parameter(Mandatory = $true, Position = 1)]
    [string]$Template
)

$ErrorActionPreference = "Stop"
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$pyScript = Join-Path $scriptDir "export-word.py"

function Find-Python {
    foreach ($name in @("python", "python3", "py")) {
        $cmd = Get-Command $name -ErrorAction SilentlyContinue
        if ($cmd) { return $cmd.Source }
    }
    return $null
}

$python = Find-Python
if (-not $python) {
    Write-Error "Python not found. Install Python 3 or use Git Bash with export-word.sh."
    exit 1
}

& $python $pyScript $MarkdownFile $Template
if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
}
