# CLAUDE.md

This project is an oclif CLI for the emile game engine. It provides useful commands for managing and building emile projects.

## Commands

Commands are organized into folders in the `src/commands` directory. Each command is a TypeScript file that exports a class extending `Command` from oclif.

Always implement the business logic for a command in a separate function in the `../shared/src/commands` directory. Either add the function to an existing file if it fits the existing file, or create a new file for it. This allows the command's logic to be reused in other projects, such as the editor.
