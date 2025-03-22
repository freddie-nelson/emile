@echo off

REM check if cli/dist exists
IF NOT EXIST "cli\dist" (
    echo CLI needs built, building CLI...

    REM run npm build inside cli
    npm run build --prefix cli

    REM check if build failed
    IF %ERRORLEVEL% NEQ 0 (
        echo Failed to build CLI
        exit /b 1
    )

    REM check if dist exists
    IF NOT EXIST "cli\dist" (
        echo Failed to build CLI
        exit /b 1
    )

    echo Built CLI
)

REM run the cli
node cli\bin\run.js %*