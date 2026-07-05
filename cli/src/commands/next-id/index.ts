import {Command} from '@oclif/core'

import {getNextIds} from '../../../../shared/src/commands/next-id.js'

export default class NextId extends Command {
  static args = {}
  static description = 'Gets the next component IDs available for use in the engine and your game'
  static examples = []
  static flags = {}

  async run(): Promise<void> {
    const {nextEngineId, nextUserId} = await getNextIds()

    this.log(`Next available engine id: ${nextEngineId}`)
    this.log(`Next available user/game id: ${nextUserId}`)
  }
}
