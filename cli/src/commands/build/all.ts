import {Args, Command, Flags} from '@oclif/core'
import {rmSync} from 'node:fs'
import {pnpmCommand, runCommand} from '../../helpers/run.js'

const CLIENT_BUILD_OUTPUT = 'client/dist'
const SERVER_BUILD_OUTPUT = 'server/build'

export default class BuildAll extends Command {
  static args = {}
  static description = 'Builds the client and server'
  static examples = []
  static flags = {
    env: Flags.string({
      name: 'env',
      char: 'e',
      description: 'Environment to build in',
      default: 'production',
      options: ['development', 'production', 'staging'],
    }),
  }

  async run(): Promise<void> {
    const {flags} = await this.parse(BuildAll)

    const clientScript = flags.env === 'staging' ? 'build:staging' : 'build'

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
      this.cleanBuildOutputs()

      if (!clientResult.success && !serverResult.success) {
        this.error('Client and server builds failed')
      }

      if (!clientResult.success) {
        this.error('Client build failed')
      }

      this.error('Server build failed')
    }
  }

  private cleanBuildOutputs(): void {
    for (const output of [CLIENT_BUILD_OUTPUT, SERVER_BUILD_OUTPUT]) {
      rmSync(output, {recursive: true, force: true})
    }
  }
}
