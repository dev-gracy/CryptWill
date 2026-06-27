param(
  [switch]$BackendOnly
)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$backendPath = Join-Path $root 'cryptwill-backend'
$frontendPath = Join-Path $root 'cryptwill-frontend'

function Invoke-Install {
  param(
    [string]$Path
  )

  Push-Location $Path
  try {
    npm install
    if ($LASTEXITCODE -ne 0) {
      throw "npm install failed in $Path"
    }
  }
  finally {
    Pop-Location
  }
}

Write-Host 'Installing backend dependencies...'
Invoke-Install -Path $backendPath

if (-not $BackendOnly) {
  Write-Host 'Installing frontend dependencies...'
  Invoke-Install -Path $frontendPath
}

Write-Host 'CryptWill setup complete.'