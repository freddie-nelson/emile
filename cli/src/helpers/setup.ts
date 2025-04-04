import {join} from 'path'
import {pnpmCommand, runCommand} from './run.js'
import {rmdirSync, existsSync} from 'fs'

const requiredVersion = 'v20.11.1'

const checkNodeVersion = async () => {
  console.log('[DEV] Checking Node.js version...')

  const res = await runCommand('node -v', 'node', ['-v'])
  if (!res.success) {
    console.log('[DEV] Node.js is not installed.')
    return false
  }

  if (res.output.toString().trim() !== requiredVersion) {
    console.log(`[DEV] Node.js version must be ${requiredVersion}.`)
    return false
  }

  console.log('[DEV] Node.js is installed.')
  return true
}

const checkPnpm = async () => {
  console.log('[DEV] Checking pnpm...')

  const res = await runCommand('pnpm -v', pnpmCommand, ['-v'])
  if (!res.success) {
    console.log('[DEV] pnpm is not installed.')
    return false
  }

  console.log('[DEV] pnpm is installed.')
  return true
}

const folders = ['client', 'engine', 'game', 'server', 'shared', 'state']

const install = async () => {
  console.log('[DEV] Installing dependencies...')

  const workingDir = process.cwd()
  console.log(`[DEV] Working directory: ${workingDir}`)

  for (let i = 0; i < folders.length; i++) {
    const folder = folders[i]
    const path = join(workingDir, folder)

    console.log(`[DEV] [${i}/${folders.length}] Installing dependencies for '${folder}'...`)

    const res = await runCommand('install', pnpmCommand, ['install', '--force'], {
      cwd: path,
      stdio: 'inherit',
    })
    if (!res.success) {
      console.log(`[DEV] Failed to install dependencies for '${folder}'.`)
      console.log(`[DEV] Output:\n ${res.output}`)
      return
    }
  }

  console.log('[DEV] Dependencies installed.')
}

export default async function setup(depsOnly: boolean, keepDocs: boolean) {
  if (!(await checkNodeVersion()) || !(await checkPnpm())) {
    return
  }

  await install()
  if (depsOnly) {
    return
  }

  if (!keepDocs) {
    console.log('[DEV] Removing docs folder...')

    const docsPath = join(process.cwd(), 'docs')
    if (!existsSync(docsPath)) {
      console.log('[DEV] Docs does not exist, skipping...')
    } else {
      await rmdirSync(docsPath, {recursive: true})
      console.log('[DEV] Docs folder removed.')
    }
  } else {
    console.log('[DEV] Keeping docs folder.')
  }
}
