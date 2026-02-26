@echo off
setlocal EnableDelayedExpansion
chcp 65001 >nul 2>&1

echo.
echo ========================================
echo   cx AnimationTools - Deploy
echo ========================================
echo.

set "PROJECT_DIR=%~dp0"
set "CEP_EXT_DIR=%APPDATA%\Adobe\CEP\extensions\com.cx.animationtools"
set "DIST_DIR=%PROJECT_DIR%dist\cep"

cd /d "%PROJECT_DIR%"

echo [1/5] Clean...
call npx rimraf dist/*
if !errorlevel! neq 0 (
    echo [FAIL] Clean failed
    goto :fail
)

echo [2/5] TypeScript compile (ExtendScript)...
call npx tsc -p "tsconfig-build.json"
if !errorlevel! neq 0 (
    echo [FAIL] TypeScript compile failed
    goto :fail
)

echo [3/5] Vite build...
call npx vite build --watch false
if !errorlevel! neq 0 (
    echo [FAIL] Vite build failed
    goto :fail
)

echo [4/5] CEP symlink...
if exist "%CEP_EXT_DIR%" (
    echo   [OK] Symlink exists
) else (
    echo   Creating symlink...
    mklink /D "%CEP_EXT_DIR%" "%DIST_DIR%"
    if !errorlevel! neq 0 (
        echo   [WARN] mklink failed. Run as Admin or create manually:
        echo         mklink /D "%CEP_EXT_DIR%" "%DIST_DIR%"
    )
)

echo [5/5] CEP PlayerDebugMode (CSXS 9-12)...
for %%v in (9 10 11 12) do (
    call :setDebugMode %%v
)

if exist "%APPDATA%\Adobe\CEP\cache" (
    rd /s /q "%APPDATA%\Adobe\CEP\cache" >nul 2>&1
    echo   [OK] CEP cache cleared
)

echo.
echo ========================================
echo   Deploy OK!
echo   Restart AE: Window ^> cx AnimationTools
echo ========================================
goto :end

:setDebugMode
set "CSXS_VER=%~1"
set "REG_KEY=HKCU\Software\Adobe\CSXS.%CSXS_VER%"
reg query "%REG_KEY%" /v PlayerDebugMode >nul 2>&1
if !errorlevel! neq 0 (
    reg add "%REG_KEY%" /v PlayerDebugMode /t REG_SZ /d 1 /f >nul 2>&1
    echo   [SET] CSXS.%CSXS_VER% PlayerDebugMode = 1
) else (
    for /f "tokens=3" %%a in ('reg query "%REG_KEY%" /v PlayerDebugMode 2^>nul ^| findstr PlayerDebugMode') do (
        if "%%a"=="1" (
            echo   [OK]  CSXS.%CSXS_VER% PlayerDebugMode = 1
        ) else (
            reg add "%REG_KEY%" /v PlayerDebugMode /t REG_SZ /d 1 /f >nul 2>&1
            echo   [FIX] CSXS.%CSXS_VER% PlayerDebugMode 0 -^> 1
        )
    )
)
exit /b 0

:fail
echo.
echo ========================================
echo   Deploy FAILED - check errors above
echo ========================================
exit /b 1

:end
endlocal
