import {Command, Flags} from '@oclif/core'

import {buildClient, type BuildEnv} from '../../../../shared/src/commands/build.js'

export default class BuildClient extends Command {
  static args = {}
  static description = 'Builds the client'
  static examples = []
  static flags = {
    env: Flags.string({
      char: 'e',
      default: 'production',
      description: 'Environment to build the client in',
      name: 'env',
      options: ['development', 'production', 'staging'],
    }),
  }

  async run(): Promise<void> {
    const {flags} = await this.parse(BuildClient)

    buildClient(flags.env as BuildEnv)
  }
}
