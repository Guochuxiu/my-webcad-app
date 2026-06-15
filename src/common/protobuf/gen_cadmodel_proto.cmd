@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

echo ========================================
echo Starting Proto Compilation
echo ========================================
echo.

REM Get current script directory
set SCRIPT_DIR=%~dp0
cd /d "%SCRIPT_DIR%"

REM Set protobufjs tool paths (from proto dir to project root: 4 levels up)
set PBJS=..\..\..\node_modules\protobufjs\bin\pbjs
set PBTS=..\..\..\node_modules\protobufjs\bin\pbts

REM Iterate through all subdirectories
for /d %%D in (*) do (
    if exist "%%D\%%D.proto" (
        echo.
        echo ----------------------------------------
        echo Processing: %%D
        echo ----------------------------------------
        
        REM Enter subdirectory (from subdir to project root: 5 levels up)
        cd "%%D"
        
        REM Compile .proto to .js
        echo Generating %%D.js ...
        node ..\..\..\..\node_modules\protobufjs\bin\pbjs -t static-module -w es6 -o %%D.js %%D.proto
        
        if !errorlevel! equ 0 (
            echo [OK] %%D.js generated successfully
            
            REM Generate .d.ts type definition
            echo Generating %%D.d.ts ...
            node ..\..\..\..\node_modules\protobufjs\bin\pbts -o %%D.d.ts %%D.js
            
            if !errorlevel! equ 0 (
                echo [OK] %%D.d.ts generated successfully
            ) else (
                echo [ERROR] Failed to generate %%D.d.ts
            )
        ) else (
            echo [ERROR] Failed to generate %%D.js
        )
        
        REM Return to parent directory
        cd ..
    )
)

echo.
echo ========================================
echo Proto Compilation Completed
echo ========================================
pause