param([string]$Probe)
$ErrorActionPreference = 'Stop'
Push-Location $PSScriptRoot
try {
  if ($Probe -and $Probe -notmatch '^probes/[a-zA-Z0-9_-]+\.test\.mjs$') { throw 'Use probes/name.test.mjs' }
  $testPath = if ($Probe) { $Probe } else { 'test/orders.test.mjs' }
  $sourceBefore = (Get-FileHash -LiteralPath 'src/orders.ts' -Algorithm SHA256).Hash
  $testBefore = (Get-FileHash -LiteralPath $testPath -Algorithm SHA256).Hash
  $nodeVersion = (& node --version | Out-String).Trim()
  $timer = [System.Diagnostics.Stopwatch]::StartNew()
  $testOutput = & node --test --test-isolation=none $testPath 2>&1 | Out-String
  $testExit = $LASTEXITCODE
  $timer.Stop()
  $record = [ordered]@{
    capturedAt = (Get-Date).ToUniversalTime().ToString('o')
    commit = 'synthetic-snapshot'
    node = $nodeVersion
    command = @('node','--test','--test-isolation=none',$testPath)
    exitCode = $testExit
    elapsedMilliseconds = $timer.ElapsedMilliseconds
    sourceHash = $sourceBefore
    testHash = $testBefore
    requirementsHash = (Get-FileHash -LiteralPath 'REQUIREMENTS.md' -Algorithm SHA256).Hash
    sourceUnchangedDuringRun = ($sourceBefore -eq (Get-FileHash -LiteralPath 'src/orders.ts' -Algorithm SHA256).Hash)
    testUnchangedDuringRun = ($testBefore -eq (Get-FileHash -LiteralPath $testPath -Algorithm SHA256).Hash)
    output = $testOutput
  }
  New-Item -ItemType Directory -Path 'review-results' -Force | Out-Null
  $resultPath = 'review-results/run-' + [guid]::NewGuid().ToString('N') + '.json'
  $record | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath $resultPath -Encoding utf8
  Write-Output $resultPath
  Write-Output $testOutput
  exit $testExit
} finally { Pop-Location }
