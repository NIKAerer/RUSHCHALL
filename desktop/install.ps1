# Crée les raccourcis « Challenger » sur le Bureau et dans le menu Démarrer.
# À lancer une fois : npm run app:install (ou clic droit > Exécuter avec PowerShell).

$ErrorActionPreference = 'Stop'
$shell = New-Object -ComObject WScript.Shell
$targets = @(
    [Environment]::GetFolderPath('Desktop'),
    (Join-Path ([Environment]::GetFolderPath('Programs')) '')
)

foreach ($folder in $targets) {
    $link = $shell.CreateShortcut((Join-Path $folder 'Challenger.lnk'))
    $link.TargetPath = Join-Path $env:WINDIR 'System32\wscript.exe'
    $link.Arguments = '"' + (Join-Path $PSScriptRoot 'Challenger.vbs') + '"'
    $link.WorkingDirectory = Split-Path -Parent $PSScriptRoot
    $link.IconLocation = (Join-Path $PSScriptRoot 'challenger.ico') + ',0'
    $link.Description = 'Challenger : historique et stats de KGB'
    $link.Save()
}

Write-Host 'Raccourcis Challenger créés sur le Bureau et dans le menu Démarrer.'
