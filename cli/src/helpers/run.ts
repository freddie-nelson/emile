import {spawn, SpawnOptions} from 'child_process'

export const pnpmCommand = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm'

export const runCommand = (name: string, command: string, args: string[], options?: SpawnOptions) => {
  return new Promise<{output: string; success: boolean}>((resolve) => {
    const p = spawn(command, args, {
      shell: true,
      ...options,
      stdio: undefined,
    })

    let output = ''

    if (options?.stdio === 'inherit') {
      p.stdout.pipe(process.stdout)
      p.stderr.pipe(process.stderr)
    }

    p.stdout.on('data', (data) => {
      output += data
    })

    p.once('exit', (code) => {
      console.log(`[DEV] ${name} exited with code ${code}.`)

      if (code === 0) {
        resolve({output, success: true})
      } else {
        resolve({output, success: false})
      }
    })
  })
}
