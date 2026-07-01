import {Args, Command, Flags} from '@oclif/core'
import {pnpmCommand, runCommand} from '../../helpers/run.js'

export default class DevEditor extends Command {
  static args = {}
  static description = 'Runs the editor dev server'
  static examples = []
  static flags = {
    env: Flags.string({
      name: 'env',
      char: 'e',
      description: 'Environment to run the editor in',
      default: 'development',
      options: ['development', 'production'],
    }),
  }

  async run(): Promise<void> {
    const {args, flags} = await this.parse(DevEditor)

    runCommand('dev:editor', pnpmCommand, ['run', 'dev', '--', '--mode', flags.env], {
      cwd: 'editor',
      stdio: 'inherit',
    })
  }
}
