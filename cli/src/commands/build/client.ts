import {Args, Command, Flags} from '@oclif/core'
import {pnpmCommand, runCommand} from '../../helpers/run.js'

export default class BuildClient extends Command {
  static args = {}
  static description = 'Builds the client'
  static examples = []
  static flags = {
    env: Flags.string({
      name: 'env',
      char: 'e',
      description: 'Environment to build the client in',
      default: 'production',
      options: ['development', 'production', 'staging'],
    }),
  }

  async run(): Promise<void> {
    const {args, flags} = await this.parse(BuildClient)

    const script = flags.env === 'staging' ? 'build:staging' : 'build'

    runCommand('build:client', pnpmCommand, ['run', script], {
      cwd: 'client',
      stdio: 'inherit',
    })
  }
}
