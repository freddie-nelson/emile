import {Args, Command, Flags} from '@oclif/core'
import setup from '../../helpers/setup.js'

export default class Setup extends Command {
  static args = {}
  static description =
    'Sets up the engine for development (checks node/pnpm version, installs dependencies, etc.)\nMust be run from the root directory of the project (e.g. where client, engine, game, etc, folders are located).'
  static examples = []
  static flags = {}

  async run(): Promise<void> {
    const {args, flags} = await this.parse(Setup)

    await setup()
  }
}
