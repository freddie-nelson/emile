import {rmSync} from 'node:fs'
import {pnpmCommand, runCommand, type RunResult} from './run.js'

const CLIENT_BUILD_OUTPUT = 'client/dist'
const SERVER_BUILD_OUTPUT = 'server/build'

export type BuildEnv = 'development' | 'production' | 'staging'
export type EditorBuildEnv = 'development' | 'production'

export async function buildAll(env: BuildEnv): Promise<{client: boolean; server: boolean}> {
  const clientScript = env === 'staging' ? 'build:staging' : 'build'

  const [clientResult, serverResult] = await Promise.all([
    runCommand('build:client', pnpmCommand, ['run', clientScript], {
      cwd: 'client',
      stdio: 'inherit',
    }),
    runCommand('build:server', pnpmCommand, ['run', 'build'], {
      cwd: 'server',
      stdio: 'inherit',
    }),
  ])

  if (!clientResult.success || !serverResult.success) {
    cleanBuildOutputs()
  }

  return {client: clientResult.success, server: serverResult.success}
}

export function buildClient(env: BuildEnv): Promise<RunResult> {
  const script = env === 'staging' ? 'build:staging' : 'build'

  return runCommand('build:client', pnpmCommand, ['run', script], {
    cwd: 'client',
    stdio: 'inherit',
  })
}

export function buildServer(_env: BuildEnv): Promise<RunResult> {
  return runCommand('build:server', pnpmCommand, ['run', 'build'], {
    cwd: 'server',
    stdio: 'inherit',
  })
}

export function buildEditor(env: EditorBuildEnv, pkg: boolean, dir: boolean): Promise<RunResult> {
  const script = pkg ? (dir ? 'build:package:dir' : 'build:package') : 'build'

  const args = ['run', script]
  if (!pkg) {
    args.push('--', '--mode', env)
  }

  return runCommand('build:editor', pnpmCommand, args, {
    cwd: 'editor',
    stdio: 'inherit',
  })
}

function cleanBuildOutputs(): void {
  for (const output of [CLIENT_BUILD_OUTPUT, SERVER_BUILD_OUTPUT]) {
    rmSync(output, {recursive: true, force: true})
  }
}
