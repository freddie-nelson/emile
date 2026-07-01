# CLAUDE.md

This project is an electron react application packaged with electron-vite implementing the editor for the emile engine, in the wider monorepo. Shadcn and tailwind are used for UI development.

# UI Development

Whenever you are creating a UI, check if a generic component exists in src/renderer/src/components/ui. If not then check if shadcn has one available using the command `pnpm dlx shadcn@latest search @shadcn -q [query]`.

Add a component from shadcn using the command `pnpm dlx shadcn@latest add [component]`.

Get the documentation for a component using the command `pnpm dlx shadcn@latest docs [component]`.

Always use the named tailwind colors defined in App.css. Never use raw hex codes or standard tailwind colors unless absolutely necessary.
