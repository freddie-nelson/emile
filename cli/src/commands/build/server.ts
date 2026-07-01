import {Args, Command, Flags} from '@oclif/core'
import {pnpmCommand, runCommand} from '../../helpers/run.js'

export default class BuildServer extends Command {
  static args = {}
  static description = 'Builds the server'
  static examples = []
  static flags = {
    env: Flags.string({
      name: 'env',
      char: 'e',
      description: 'Environment to build the server in',
      default: 'production',
      options: ['development', 'production', 'staging'],
    }),
  }

  async run(): Promise<void> {
    const {args, flags} = await this.parse(BuildServer)

    runCommand('build:server', pnpmCommand, ['run', 'build'], {
      cwd: 'server',
      stdio: 'inherit',
    })
  }
}
