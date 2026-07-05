import {Command, Flags} from '@oclif/core'

import {type DevEnv, devServer} from '../../../../shared/src/commands/dev.js'

export default class DevServer extends Command {
  static args = {}
  static description = 'Runs the server dev server'
  static examples = []
  static flags = {
    env: Flags.string({
      char: 'e',
      default: 'development',
      description: 'Environment to run the server in',
      name: 'env',
      options: ['development', 'production', 'staging'],
    }),
  }

  async run(): Promise<void> {
    const {flags} = await this.parse(DevServer)

    devServer(flags.env as DevEnv)
  }
}
