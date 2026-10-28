# Lance Challenger comme une appli : serveur caché, fenêtre dédiée, tout s'arrête à la fermeture.
# Démarré par le raccourci « Challenger » (via Challenger.vbs, pour ne montrer aucune console).

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$port = 8765
$url = "http://127.0.0.1:$port"
$data = Join-Path $env:LOCALAPPDATA 'Challenger'
$log = Join-Path $data 'challenger.log'
New-Item -ItemType Directory -Force -Path $data | Out-Null

function Show-Error([string] $message) {
    Add-Type -AssemblyName PresentationFramework
    [System.Windows.MessageBox]::Show($message, 'Challenger', 'OK', 'Error') | Out-Null
    exit 1
}

function Test-Port {
    $client = New-Object System.Net.Sockets.TcpClient
    try { $client.Connect('127.0.0.1', $port); return $true } catch { return $false } finally { $client.Dispose() }
}

# Fenêtre d'appli (sans barre d'adresse) dans un profil à part : pas d'extensions ni de sombre forcé.
function Find-Browser {
    $candidates = @(
        "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe",
        "$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe",
        "$env:ProgramFiles\BraveSoftware\Brave-Browser\Application\brave.exe",
        "$env:LOCALAPPDATA\BraveSoftware\Brave-Browser\Application\brave.exe",
        "$env:ProgramFiles\Google\Chrome\Application\chrome.exe",
        "$env:LOCALAPPDATA\Google\Chrome\Application\chrome.exe"
    )
    return $candidates | Where-Object { $_ -and (Test-Path $_) } | Select-Object -First 1
}

$browser = Find-Browser
if (-not $browser) { Show-Error "Aucun navigateur compatible trouvé (Edge, Brave ou Chrome)." }
$window = @("--app=$url", "--user-data-dir=$(Join-Path $data 'window')", '--window-size=1440,920', '--no-first-run', '--no-default-browser-check')

# Déjà ouverte : on ouvre juste une fenêtre de plus.
if (Test-Port) {
    Start-Process -FilePath $browser -ArgumentList $window
    exit 0
}

# Recompile le front quand son code a changé depuis la dernière compilation (après un git pull).
$built = Join-Path $root 'web\dist\index.html'
$latest = Get-ChildItem -Path (Join-Path $root 'web\src'), (Join-Path $root 'web\index.html') -Recurse -File |
    Sort-Object LastWriteTime -Descending | Select-Object -First 1
if (-not (Test-Path $built) -or $latest.LastWriteTime -gt (Get-Item $built).LastWriteTime) {
    $build = Start-Process -FilePath 'npm.cmd' -ArgumentList 'run', 'build', '--prefix', 'web' -WorkingDirectory $root `
        -WindowStyle Hidden -Wait -PassThru -RedirectStandardOutput $log -RedirectStandardError "$log.err"
    if ($build.ExitCode -ne 0) { Show-Error "La compilation du site a échoué. Détails : $log.err" }
}

$server = Start-Process -FilePath 'php' -ArgumentList '-S', "127.0.0.1:$port", '-t', 'web\dist', 'desktop\router.php' `
    -WorkingDirectory $root -WindowStyle Hidden -PassThru -RedirectStandardOutput $log -RedirectStandardError "$log.err"

$deadline = (Get-Date).AddSeconds(15)
while (-not (Test-Port)) {
    if ($server.HasExited -or (Get-Date) -gt $deadline) { Show-Error "Le serveur n'a pas démarré. Détails : $log.err" }
    Start-Sleep -Milliseconds 200
}

# La fenêtre fermée, on arrête le serveur.
try {
    Start-Process -FilePath $browser -ArgumentList $window -Wait
} finally {
    if (-not $server.HasExited) { Stop-Process -Id $server.Id -Force }
}
