@echo off
REM ============================================
REM Database Sync - Quick Start Script
REM ============================================

cls
echo.
echo ===============================================
echo   DATABASE SYNC - LOCAL to RAILWAY
echo ===============================================
echo.

REM Check if Railway URL is provided
if "%1"=="" (
    echo.
    echo ERROR: Railway database URL is required!
    echo.
    echo USAGE:
    echo   sync_db.bat "postgresql://postgres:PASSWORD@HOST:5432/railway"
    echo.
    echo How to get Railway URL:
    echo   1. Go to: https://railway.app/dashboard
    echo   2. Select your project: web-production-9efff
    echo   3. Click PostgreSQL
    echo   4. Copy DATABASE_URL from Variables tab
    echo.
    pause
    exit /b 1
)

echo Railway URL: %1
echo.

REM Test connections first
echo.
echo Step 1/3: Testing database connections...
echo.
node test_connection.mjs

if errorlevel 1 (
    echo.
    echo ERROR: Connection test failed!
    pause
    exit /b 1
)

REM Run migration
echo.
echo Step 2/3: Starting database comparison and migration...
echo.
set RAILWAY_DB_URL=%1
node compare_and_sync_db_v2.mjs

if errorlevel 1 (
    echo.
    echo ERROR: Migration failed!
    pause
    exit /b 1
)

echo.
echo ===============================================
echo   SYNC COMPLETE!
echo ===============================================
echo.
echo Next steps:
echo   1. Test your application on Railway
echo   2. Verify all data is present
echo   3. Check all features work correctly
echo.
pause
