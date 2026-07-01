import {Args, Command, Flags} from '@oclif/core'
import {pnpmCommand, runCommand} from '../../helpers/run.js'

export default class BuildEditor extends Command {
  static args = {}
  static description = 'Builds the editor'
  static examples = []
  static flags = {
    env: Flags.string({
      name: 'env',
      char: 'e',
      description: 'Environment to build the editor in',
      default: 'production',
      options: ['development', 'production'],
    }),
  }

  async run(): Promise<void> {
    const {args, flags} = await this.parse(BuildEditor)

    runCommand('build:editor', pnpmCommand, ['run', 'build', '--', '--mode', flags.env], {
      cwd: 'editor',
      stdio: 'inherit',
    })
  }
}
