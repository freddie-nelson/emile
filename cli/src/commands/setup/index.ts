import {Args, Command, Flags} from '@oclif/core'
import setup from '../../helpers/setup.js'

export default class Setup extends Command {
  static args = {}
  static description =
    'Sets up the engine for development (checks node/pnpm version, installs dependencies, etc.)\nMust be run from the root directory of the project (e.g. where client, engine, game, etc, folders are located).'
  static examples = []
  static flags = {
    depsOnly: Flags.boolean({
      char: 'd',
      name: 'depsOnly',
      description: 'Only install dependencies, no other setup steps',
      default: false,
    }),
    keepDocs: Flags.boolean({
      char: 'k',
      name: 'keepDocs',
      description: 'Keep the docs folder after setup',
      default: false,
    }),
  }

  async run(): Promise<void> {
    const {args, flags} = await this.parse(Setup)

    await setup(flags.depsOnly, flags.keepDocs)
  }
}
