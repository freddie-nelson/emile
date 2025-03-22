import {Args, Command, Flags} from '@oclif/core'
import {pnpmCommand, runCommand} from '../../helpers/run.js'

export default class DevClient extends Command {
  static args = {}
  static description = 'Runs the client dev server'
  static examples = []
  static flags = {
    env: Flags.string({
      name: 'env',
      char: 'e',
      description: 'Environment to run the client in',
      default: 'development',
      options: ['development', 'production', 'staging'],
    }),
  }

  async run(): Promise<void> {
    const {args, flags} = await this.parse(DevClient)

    runCommand('dev:client', pnpmCommand, ['dev', '--mode', flags.env], {
      cwd: 'client',
      stdio: 'inherit',
    })
  }
}
