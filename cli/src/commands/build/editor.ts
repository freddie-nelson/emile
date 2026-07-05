import {Command, Flags} from '@oclif/core'

import {buildEditor, type EditorBuildEnv} from '../../../../shared/src/commands/build.js'

export default class BuildEditor extends Command {
  static args = {}
  static description = 'Builds the editor'
  static examples = []
  static flags = {
    dir: Flags.boolean({
      default: false,
      dependsOn: ['package'],
      description: 'With --package, produce an unpacked directory build instead of a full installer (faster, for local testing)',
      name: 'dir',
    }),
    env: Flags.string({
      char: 'e',
      default: 'production',
      description: 'Environment to build the editor in',
      name: 'env',
      options: ['development', 'production'],
    }),
    package: Flags.boolean({
      char: 'p',
      default: false,
      description: 'Package the editor into a platform installer (exe on Windows, AppImage/deb on Linux, dmg on macOS)',
      name: 'package',
    }),
  }

  async run(): Promise<void> {
    const {flags} = await this.parse(BuildEditor)

    const result = await buildEditor(flags.env as EditorBuildEnv, flags.package, flags.dir)

    if (!result.success) {
      this.error('Editor build failed')
    }
  }
}
