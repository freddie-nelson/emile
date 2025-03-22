@emile/cli
=================

A command line interface for easier developing with the emile game engine


[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/@emile/cli.svg)](https://npmjs.org/package/@emile/cli)
[![Downloads/week](https://img.shields.io/npm/dw/@emile/cli.svg)](https://npmjs.org/package/@emile/cli)


<!-- toc -->
* [Usage](#usage)
* [Commands](#commands)
<!-- tocstop -->
# Usage
<!-- usage -->
```sh-session
$ npm install -g @emile/cli
$ emile COMMAND
running command...
$ emile (--version)
@emile/cli/0.0.0 win32-x64 node-v20.11.1
$ emile --help [COMMAND]
USAGE
  $ emile COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`emile dev client`](#emile-dev-client)
* [`emile dev server`](#emile-dev-server)
* [`emile help [COMMAND]`](#emile-help-command)
* [`emile next-id`](#emile-next-id)
* [`emile setup`](#emile-setup)

## `emile dev client`

Runs the client dev server

```
USAGE
  $ emile dev client [-e development|production|staging]

FLAGS
  -e, --env=<option>  [default: development] Environment to run the client in
                      <options: development|production|staging>

DESCRIPTION
  Runs the client dev server
```

_See code: [src/commands/dev/client.ts](https://github.com/freddie-nelson/emile/blob/v0.0.0/src/commands/dev/client.ts)_

## `emile dev server`

Runs the server dev server

```
USAGE
  $ emile dev server [-e development|production|staging]

FLAGS
  -e, --env=<option>  [default: development] Environment to run the server in
                      <options: development|production|staging>

DESCRIPTION
  Runs the server dev server
```

_See code: [src/commands/dev/server.ts](https://github.com/freddie-nelson/emile/blob/v0.0.0/src/commands/dev/server.ts)_

## `emile help [COMMAND]`

Display help for emile.

```
USAGE
  $ emile help [COMMAND...] [-n]

ARGUMENTS
  COMMAND...  Command to show help for.

FLAGS
  -n, --nested-commands  Include all nested commands in the output.

DESCRIPTION
  Display help for emile.
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v6.2.27/src/commands/help.ts)_

## `emile next-id`

Gets the next component IDs available for use in the engine and your game

```
USAGE
  $ emile next-id

DESCRIPTION
  Gets the next component IDs available for use in the engine and your game
```

_See code: [src/commands/next-id/index.ts](https://github.com/freddie-nelson/emile/blob/v0.0.0/src/commands/next-id/index.ts)_

## `emile setup`

Sets up the engine for development (checks node/pnpm version, installs dependencies, etc.)

```
USAGE
  $ emile setup

DESCRIPTION
  Sets up the engine for development (checks node/pnpm version, installs dependencies, etc.)
  Must be run from the root directory of the project (e.g. where client, engine, game, etc, folders are located).
```

_See code: [src/commands/setup/index.ts](https://github.com/freddie-nelson/emile/blob/v0.0.0/src/commands/setup/index.ts)_
<!-- commandsstop -->
