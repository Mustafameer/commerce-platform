#!/usr/bin/env pwsh

# Upload Backup to Railway

$BackupFile = "railway_backup_full.sql"
$RailwayHost = "web-production-9efff.up.railway.app"
$RailwayPort = "5432"
$RailwayUser = "postgres"
$RailwayPassword = "yQOzKdveBhDOEKrDYHOFkkUptQQLmFBQ"
$RailwayDB = "railway"

Write-Host "[Railway Upload] Checking backup file..." -ForegroundColor Cyan

if (-not (Test-Path $BackupFile)) {
    Write-Host "[ERROR] File not found: $BackupFile" -ForegroundColor Red
    exit 1
}

$FileSize = (Get-Item $BackupFile).Length / 1MB
Write-Host "[OK] File found: $BackupFile ($([math]::Round($FileSize, 2)) MB)" -ForegroundColor Green

Write-Host "[Railway Upload] Checking for psql tool..." -ForegroundColor Yellow
$PsqlPath = (Get-Command psql -ErrorAction SilentlyContinue).Source

if ($null -eq $PsqlPath) {
    Write-Host "[ERROR] psql not installed" -ForegroundColor Red
    Write-Host "`nPlease install PostgreSQL Client Tools from:" -ForegroundColor Yellow
    Write-Host "https://www.postgresql.org/download/windows/" -ForegroundColor Cyan
    exit 1
}

Write-Host "[OK] psql found: $PsqlPath" -ForegroundColor Green

$env:PGPASSWORD = $RailwayPassword
Write-Host "`n[Railway Upload] Connecting to Railway..." -ForegroundColor Yellow

Write-Host "[Railway Upload] Starting upload (this may take 5-15 minutes)..." -ForegroundColor Yellow

$StartTime = Get-Date

psql -h $RailwayHost -U $RailwayUser -p $RailwayPort -d $RailwayDB -f $BackupFile

$EndTime = Get-Date
$Duration = ($EndTime - $StartTime).TotalSeconds

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n[SUCCESS] Upload completed!" -ForegroundColor Green
    Write-Host "Time elapsed: $([math]::Round($Duration, 1)) seconds" -ForegroundColor Green
    Write-Host "`n[INFO] Database is now on Railway!" -ForegroundColor Cyan
} else {
    Write-Host "`n[ERROR] Upload failed" -ForegroundColor Red
    Write-Host "Please try manually using Railway Dashboard" -ForegroundColor Yellow
    exit 1
}

Write-Host "`n[Railway Upload] Verifying results..." -ForegroundColor Yellow

$CheckQuery = "SELECT COUNT(*) as table_count FROM information_schema.tables WHERE table_schema='public';"
$Result = psql -h $RailwayHost -U $RailwayUser -p $RailwayPort -d $RailwayDB -t -c $CheckQuery 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] Table count: $Result" -ForegroundColor Green
    if ($Result.Trim() -eq "26") {
        Write-Host "[SUCCESS] All 26 tables uploaded successfully!" -ForegroundColor Green
    }
}

Write-Host "`n===== MIGRATION COMPLETE =====" -ForegroundColor Green

Remove-Item env:PGPASSWORD
