import {Args, Command, Flags} from '@oclif/core'
import {pnpmCommand, runCommand} from '../../helpers/run.js'

export default class BuildEditor extends Command {
  static args = {}
  static description = 'Builds the editor'
  static examples = []
  static flags = {
    env: Flags.string({
      name: 'env',
      char: 'e',
      description: 'Environment to build the editor in',
      default: 'production',
      options: ['development', 'production'],
    }),
    package: Flags.boolean({
      name: 'package',
      char: 'p',
      description: 'Package the editor into a platform installer (exe on Windows, AppImage/deb on Linux, dmg on macOS)',
      default: false,
    }),
    dir: Flags.boolean({
      name: 'dir',
      description: 'With --package, produce an unpacked directory build instead of a full installer (faster, for local testing)',
      default: false,
      dependsOn: ['package'],
    }),
  }

  async run(): Promise<void> {
    const {flags} = await this.parse(BuildEditor)

    const script = flags.package
      ? flags.dir
        ? 'build:package:dir'
        : 'build:package'
      : 'build'

    const args = ['run', script]
    if (!flags.package) {
      args.push('--', '--mode', flags.env)
    }

    const result = await runCommand('build:editor', pnpmCommand, args, {
      cwd: 'editor',
      stdio: 'inherit',
    })

    if (!result.success) {
      this.error('Editor build failed')
    }
  }
}
