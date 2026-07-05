import {Command, Flags} from '@oclif/core'

import {buildAll, type BuildEnv} from '../../../../shared/src/commands/build.js'

export default class BuildAll extends Command {
  static args = {}
  static description = 'Builds the client and server'
  static examples = []
  static flags = {
    env: Flags.string({
      char: 'e',
      default: 'production',
      description: 'Environment to build in',
      name: 'env',
      options: ['development', 'production', 'staging'],
    }),
  }

  async run(): Promise<void> {
    const {flags} = await this.parse(BuildAll)

    const {client, server} = await buildAll(flags.env as BuildEnv)

    if (!client && !server) {
      this.error('Client and server builds failed')
    }

    if (!client) {
      this.error('Client build failed')
    }

    if (!server) {
      this.error('Server build failed')
    }
  }
}
