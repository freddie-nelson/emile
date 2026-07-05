import {Command, Flags} from '@oclif/core'

import {type BuildEnv, buildServer} from '../../../../shared/src/commands/build.js'

export default class BuildServer extends Command {
  static args = {}
  static description = 'Builds the server'
  static examples = []
  static flags = {
    env: Flags.string({
      char: 'e',
      default: 'production',
      description: 'Environment to build the server in',
      name: 'env',
      options: ['development', 'production', 'staging'],
    }),
  }

  async run(): Promise<void> {
    const {flags} = await this.parse(BuildServer)

    buildServer(flags.env as BuildEnv)
  }
}
