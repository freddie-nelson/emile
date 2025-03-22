import {Args, Command, Flags} from '@oclif/core'
import {pnpmCommand, runCommand} from '../../helpers/run.js'

export default class DevServer extends Command {
  static args = {}
  static description = 'Runs the server dev server'
  static examples = []
  static flags = {
    env: Flags.string({
      name: 'env',
      char: 'e',
      description: 'Environment to run the server in',
      default: 'development',
      options: ['development', 'production', 'staging'],
    }),
  }

  async run(): Promise<void> {
    const {args, flags} = await this.parse(DevServer)

    runCommand('dev:server', pnpmCommand, ['dev', '--env', flags.env], {
      cwd: 'server',
      stdio: 'inherit',
    })
  }
}
