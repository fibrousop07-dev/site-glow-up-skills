# Windows wrapper: .\install.ps1 [--all | --glow-up | --only a,b | --list | --dry-run ...]
if (-not (Get-Command node -ErrorAction SilentlyContinue)) { Write-Error "Node 18+ is required: https://nodejs.org"; exit 1 }
node (Join-Path $PSScriptRoot "install.mjs") @args
exit $LASTEXITCODE
