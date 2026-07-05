import {Command, Flags} from '@oclif/core'

import {devEditor, type DevEditorEnv} from '../../../../shared/src/commands/dev.js'

export default class DevEditor extends Command {
  static args = {}
  static description = 'Runs the editor dev server'
  static examples = []
  static flags = {
    env: Flags.string({
      char: 'e',
      default: 'development',
      description: 'Environment to run the editor in',
      name: 'env',
      options: ['development', 'production'],
    }),
  }

  async run(): Promise<void> {
    const {flags} = await this.parse(DevEditor)

    devEditor(flags.env as DevEditorEnv)
  }
}
