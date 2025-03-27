:: filepath: c:\Users\fredd\Documents\programming\rocketrumble.online\emile.bat
@echo off

:: Check if cli\node_modules exists
if not exist "cli\node_modules" (
    echo CLI dependencies need to be installed, installing CLI...

    :: Change directory to cli and install dependencies
    pushd cli
    pnpm install

    :: Check if install failed
    if errorlevel 1 (
        echo Failed to install dependencies
        popd
        exit /b 1
    )

    :: Check if node_modules exists after installation
    if not exist "node_modules" (
        echo Failed to install dependencies
        popd
        exit /b 1
    )

    echo Installed CLI
    echo Run again to build the CLI

    :: Return to the original directory
    popd
)

:: Check if cli\dist exists
if not exist "cli\dist" (
    echo CLI needs to be built, building CLI...

    :: Change directory to cli and build
    pushd cli
    pnpm run build

    :: Check if build failed
    if errorlevel 1 (
        echo Failed to build CLI
        popd
        exit /b 1
    )

    :: Check if dist exists after build
    if not exist "dist" (
        echo Failed to build CLI
        popd
        exit /b 1
    )

    echo Built CLI
    echo Run again to run the CLI

    :: Return to the original directory
    popd
)

:: Run the CLI
node cli\bin\run.js %*