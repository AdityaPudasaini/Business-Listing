# ops/backup/backup-dev.ps1 -- back up a LOCAL development database that runs in Docker
# (for example the "pg-dev" container), plus backend\uploads. For Windows PowerShell.
#
#   .\ops\backup\backup-dev.ps1
#   .\ops\backup\backup-dev.ps1 -Container pg-dev -Database mydb -KeepDays 30
#
# Schedule it with Task Scheduler if you want it to run by itself.
# The files contain real user data: keep them out of Git (the root .gitignore already does).
param(
  [string]$Container = "pg-dev",
  [string]$Database = "mydb",
  [string]$User = "postgres",
  [string]$UploadsDir = (Join-Path $PSScriptRoot "..\..\backend\uploads"),
  [string]$OutDir = (Join-Path $PSScriptRoot "..\..\backups"),
  [int]$KeepDays = 14
)

$ErrorActionPreference = "Stop"
$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
New-Item -ItemType Directory -Force -Path $OutDir | Out-Null

Write-Host "Dumping '$Database' from container '$Container'..."
docker exec $Container pg_dump -U $User -Fc --no-owner --no-privileges $Database -f /tmp/backup.dmp
if ($LASTEXITCODE -ne 0) { throw "pg_dump failed." }
$dumpFile = Join-Path $OutDir "autohub-$stamp.dmp"
docker cp "${Container}:/tmp/backup.dmp" $dumpFile
if ($LASTEXITCODE -ne 0) { throw "Could not copy the dump out of the container." }
docker exec $Container rm /tmp/backup.dmp | Out-Null

if ((Test-Path $UploadsDir) -and (Get-ChildItem $UploadsDir -Force | Select-Object -First 1)) {
  $uploadsFile = Join-Path $OutDir "autohub-uploads-$stamp.zip"
  Compress-Archive -Path (Join-Path $UploadsDir "*") -DestinationPath $uploadsFile
  Write-Host "Saved $uploadsFile"
} else {
  Write-Host "No uploads folder (or it is empty): skipped."
}
Write-Host "Saved $dumpFile ($([math]::Round((Get-Item $dumpFile).Length / 1KB, 1)) KB)"

Get-ChildItem $OutDir -Filter "autohub-*" |
  Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-$KeepDays) } |
  Remove-Item -Force
Write-Host "Done."
