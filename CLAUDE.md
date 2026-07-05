# CLAUDE.md

This repo contains all projects related to the emile game engine. Emile is a 2D multiplayer game engine written in Typescript using Colyseus for networking, Matter.js for physics, Pixi.js for rendering, React for the client UI, and a custom ECS implementation.

## Project Structure

- `editor`: The editor for the emile engine, built as an Electron React application using electron-vite. It provides a user interface for creating and managing game entities, components, and systems.

- `engine`: The core emile engine, which includes the ECS implementation, physics, rendering, scene and scene graph management. The ECS is built directly on top of Colyseus state objects so that the entire game state can be serialized and sent over the network in real-time.

- `client`: The client application for running games built with the emile engine. It connects to a Colyseus server and renders the game state using the Pixi.js and rendering functionality provided by the engine.

- `server`: The server application for running games built with the emile engine. It uses Colyseus to manage game rooms, messages, and state synchronization between clients.

- `shared`: Shared code and types used across the editor, engine, client, and server projects. This includes common data structures, utility functions, and type definitions.

- `state`: This is a small module that contains the colyseus state definitions for the room, game, player and engine. The game developer can extend these state definitions to add their own game-specific state.

- `cli`: A command-line interface for easier development of emile games. Currently, it provides commands for building the client and server, running development servers for the client and server, and other utility commands.
