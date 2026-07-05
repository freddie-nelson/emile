import {Command, Flags} from '@oclif/core'

import {devClient, type DevEnv} from '../../../../shared/src/commands/dev.js'

export default class DevClient extends Command {
  static args = {}
  static description = 'Runs the client dev server'
  static examples = []
  static flags = {
    env: Flags.string({
      char: 'e',
      default: 'development',
      description: 'Environment to run the client in',
      name: 'env',
      options: ['development', 'production', 'staging'],
    }),
  }

  async run(): Promise<void> {
    const {flags} = await this.parse(DevClient)

    devClient(flags.env as DevEnv)
  }
}
