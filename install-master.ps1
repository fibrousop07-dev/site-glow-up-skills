# Windows wrapper for the master-fibrous-sites installer
if (-not (Get-Command node -ErrorAction SilentlyContinue)) { Write-Error "Node 18+ is required"; exit 1 }
node (Join-Path $PSScriptRoot "install-master.mjs") @args
exit $LASTEXITCODE
