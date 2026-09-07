$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$backendDir = Join-Path $repoRoot "backend\art-gallery-cms"
$frontendDir = Join-Path $repoRoot "frontend"
$backendPort = 1337
$frontendPort = 8765
$startedProcesses = New-Object System.Collections.Generic.List[System.Diagnostics.Process]

function Resolve-RequiredCommand {
    param(
        [Parameter(Mandatory = $true)]
        [string] $Name,
        [Parameter(Mandatory = $true)]
        [string] $InstallHint
    )

    $command = Get-Command $Name -ErrorAction SilentlyContinue
    if (-not $command) {
        throw "$Name was not found. $InstallHint"
    }

    return $command.Source
}

function Test-LocalPortOpen {
    param(
        [Parameter(Mandatory = $true)]
        [int] $Port
    )

    $client = [System.Net.Sockets.TcpClient]::new()
    try {
        $connect = $client.BeginConnect("127.0.0.1", $Port, $null, $null)
        if (-not $connect.AsyncWaitHandle.WaitOne(250)) {
            return $false
        }

        $client.EndConnect($connect)
        return $true
    }
    catch {
        return $false
    }
    finally {
        $client.Close()
    }
}

function Start-DevProcess {
    param(
        [Parameter(Mandatory = $true)]
        [string] $Name,
        [Parameter(Mandatory = $true)]
        [string] $FilePath,
        [Parameter(Mandatory = $true)]
        [string[]] $ArgumentList,
        [Parameter(Mandatory = $true)]
        [string] $WorkingDirectory
    )

    Write-Host "Starting $Name..."
    $process = Start-Process -FilePath $FilePath -ArgumentList $ArgumentList -WorkingDirectory $WorkingDirectory -NoNewWindow -PassThru
    $startedProcesses.Add($process)
    return $process
}

function Stop-ProcessTree {
    param(
        [Parameter(Mandatory = $true)]
        [int] $ProcessId
    )

    $children = Get-CimInstance Win32_Process -Filter "ParentProcessId = $ProcessId" -ErrorAction SilentlyContinue
    foreach ($child in $children) {
        Stop-ProcessTree -ProcessId $child.ProcessId
    }

    Stop-Process -Id $ProcessId -Force -ErrorAction SilentlyContinue
}

function Stop-StartedProcesses {
    foreach ($process in $startedProcesses) {
        if ($process -and -not $process.HasExited) {
            Write-Host "Stopping process $($process.Id)..."
            Stop-ProcessTree -ProcessId $process.Id
        }
    }
}

trap {
    Stop-StartedProcesses
    throw $_
}

try {
    if (-not (Test-Path $backendDir)) {
        throw "Backend directory not found: $backendDir"
    }

    if (-not (Test-Path $frontendDir)) {
        throw "Frontend directory not found: $frontendDir"
    }

    $nodePath = Resolve-RequiredCommand -Name "node" -InstallHint "Install Node 22.x before running this project."
    $npmCmd = Get-Command "npm.cmd" -ErrorAction SilentlyContinue
    $npmPath = if ($npmCmd) { $npmCmd.Source } else { Resolve-RequiredCommand -Name "npm" -InstallHint "Install npm with Node 22.x before running this project." }
    $pythonPath = Resolve-RequiredCommand -Name "python" -InstallHint "Install Python 3 so the static frontend can be served locally."

    $nodeVersion = & $nodePath -v
    if ($nodeVersion -match "^v(\d+)\.") {
        $nodeMajor = [int] $Matches[1]
        if ($nodeMajor -gt 22) {
            Write-Warning "Current Node is $nodeVersion. Strapi here supports Node 18 through 22; use Node 22.x if startup fails."
        }
    }

    if (-not (Test-Path (Join-Path $backendDir "node_modules"))) {
        Write-Host "Installing backend dependencies..."
        Push-Location $backendDir
        try {
            & $npmPath install
        }
        finally {
            Pop-Location
        }
    }

    if (Test-LocalPortOpen -Port $backendPort) {
        Write-Host "Backend already appears to be running on http://localhost:$backendPort"
    }
    else {
        # backend/art-gallery-cms package script runs: strapi develop
        Start-DevProcess -Name "Strapi backend" -FilePath $npmPath -ArgumentList @("run", "develop") -WorkingDirectory $backendDir | Out-Null
    }

    if (Test-LocalPortOpen -Port $frontendPort) {
        Write-Host "Frontend already appears to be running on http://127.0.0.1:$frontendPort"
    }
    else {
        Start-DevProcess -Name "static frontend" -FilePath $pythonPath -ArgumentList @("-m", "http.server", "$frontendPort", "--bind", "127.0.0.1") -WorkingDirectory $frontendDir | Out-Null
    }

    Write-Host ""
    Write-Host "Local services are starting:"
    Write-Host "  Frontend: http://127.0.0.1:$frontendPort"
    Write-Host "  Strapi:   http://localhost:$backendPort/admin"
    Write-Host ""
    Write-Host "Keep this terminal open. Press Ctrl+C to stop services started by this launcher."

    while ($true) {
        $running = $startedProcesses | Where-Object { $_ -and -not $_.HasExited }
        if ($startedProcesses.Count -gt 0 -and $running.Count -eq 0) {
            throw "All started services exited. Check the logs above for the first failure."
        }

        Start-Sleep -Seconds 2
    }
}
finally {
    Stop-StartedProcesses
}
