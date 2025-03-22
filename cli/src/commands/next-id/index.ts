import {Args, Command, Flags} from '@oclif/core'
import {getNextIds} from '../../helpers/getNextComponentId.js'

export default class NextId extends Command {
  static args = {}
  static description = 'Gets the next component IDs available for use in the engine and your game'
  static examples = []
  static flags = {}

  async run(): Promise<void> {
    const {args, flags} = await this.parse(NextId)

    const {nextEngineId, nextUserId} = await getNextIds()

    this.log(`Next available engine id: ${nextEngineId}`)
    this.log(`Next available user/game id: ${nextUserId}`)
  }
}
