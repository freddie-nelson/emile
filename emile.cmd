@echo off

:: Check if cli/node_modules exists
if not exist "cli\node_modules" (
    echo CLI dependencies need installed, installing CLI...

    :: Run npm install inside cli
    npm install --prefix cli

    :: Check if install failed
    if errorlevel 1 (
        echo Failed to install dependencies
        exit /b 1
    )

    :: Check if node_modules exists
    if not exist "cli\node_modules" (
        echo Failed to install dependencies
        exit /b 1
    )

    echo Installed CLI
)

:: Check if cli/dist exists
if not exist "cli\dist" (
    echo CLI needs built, building CLI...

    :: Run npm build inside cli
    npm run build --prefix cli

    :: Check if build failed
    if errorlevel 1 (
        echo Failed to build CLI
        exit /b 1
    )

    :: Check if dist exists
    if not exist "cli\dist" (
        echo Failed to build CLI
        exit /b 1
    )

    echo Built CLI
)

:: Run the CLI
node cli\bin\run.js %*
