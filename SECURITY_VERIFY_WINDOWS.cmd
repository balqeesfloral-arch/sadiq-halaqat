@echo off
setlocal EnableExtensions
chcp 65001 >nul 2>&1

echo ==============================================
echo Sadiq Security Verification
echo ==============================================

echo [1/2] Installing exact locked dependencies...
call npm ci
if errorlevel 1 goto :fail

echo [2/2] Running full security gate...
call npm run security:full
if errorlevel 1 goto :fail

echo.
echo SECURITY VERIFICATION PASSED
exit /b 0

:fail
echo.
echo SECURITY VERIFICATION FAILED
exit /b 1
