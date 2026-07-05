import {Command, Flags} from '@oclif/core'

import {setup} from '../../../../shared/src/commands/setup.js'

export default class Setup extends Command {
  static args = {}
  static description =
    'Sets up the engine for development (checks node/pnpm version, installs dependencies, etc.)\nMust be run from the root directory of the project (e.g. where client, engine, game, etc, folders are located).'
  static examples = []
  static flags = {
    depsOnly: Flags.boolean({
      char: 'd',
      default: false,
      description: 'Only install dependencies, no other setup steps',
      name: 'depsOnly',
    }),
    keepDocs: Flags.boolean({
      char: 'k',
      default: false,
      description: 'Keep the docs folder after setup',
      name: 'keepDocs',
    }),
  }

  async run(): Promise<void> {
    const {flags} = await this.parse(Setup)

    await setup(flags.depsOnly, flags.keepDocs)
  }
}
