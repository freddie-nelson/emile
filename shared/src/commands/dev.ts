import {pnpmCommand, runCommand, type RunResult} from './run.js'

export type DevEnv = 'development' | 'production' | 'staging'
export type DevEditorEnv = 'development' | 'production'

export function devClient(env: DevEnv): Promise<RunResult> {
  return runCommand('dev:client', pnpmCommand, ['dev', '--mode', env], {
    cwd: 'client',
    stdio: 'inherit',
  })
}

export function devServer(env: DevEnv): Promise<RunResult> {
  return runCommand('dev:server', pnpmCommand, ['dev', '--env', env], {
    cwd: 'server',
    stdio: 'inherit',
  })
}

export function devEditor(env: DevEditorEnv): Promise<RunResult> {
  return runCommand('dev:editor', pnpmCommand, ['run', 'dev', '--', '--mode', env], {
    cwd: 'editor',
    stdio: 'inherit',
  })
}
