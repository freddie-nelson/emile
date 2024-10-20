import Engine from "../engine";

export type ActionHandler<T> = (engine: Engine, action: string, data: T) => void;

export type ActionDataValidator = (action: string, data: any) => boolean;

export interface Action {
  action: string;
  data: any;
}

export class ActionsManager {
  private readonly handlers: Map<string, ActionHandler<any>> = new Map();
  private readonly validators: Map<string, ActionDataValidator> = new Map();
  private readonly actionQueue: Action[] = [];

  /**
   * Enqueues an action to be fired on the next flush.
   *
   * @param action The action to enqueue.
   * @param data The data for the action.
   */
  public enqueue(action: string, data: any) {
    this.actionQueue.push({ action, data });
  }

  /**
   * Flushes the action queue, firing all enqueued actions.
   *
   * @note Only use this if you know what you're doing.
   *
   * @param engine The engine to flushing the queue.
   */
  public flush(engine: Engine) {
    for (const action of this.actionQueue) {
      this.fire(engine, action.action, action.data);
    }
  }

  /**
   * Fires an action immediately with the given data, without queueing the action.
   *
   * @note Use this with caution, as it will bypass the queue and fire the action immediately.
   *
   * @param engine The engine firing the action.
   * @param action The action to fire.
   * @param data The action's data.
   */
  public fire(engine: Engine, action: string, data: any) {
    const handler = this.handlers.get(action);
    if (!handler) {
      return;
    }

    const validator = this.validators.get(action);
    if (!validator || !validator(action, data)) {
      return;
    }

    handler(engine, action, data);
  }

  /**
   * Registers a handler for an action.
   *
   * If a handler is already registered for the action, it will be replaced.
   *
   * @param action The action to register the handler for.
   * @param handler The handler for the action.
   * @param validator The validator for the action data.
   */
  public register<T>(action: string, handler: ActionHandler<T>, validator: ActionDataValidator) {
    this.handlers.set(action, handler);
    this.validators.set(action, validator);
  }

  /**
   * Unregisters the handler for an action.
   *
   * @param action The action to unregister the handler for.
   */
  public unregister(action: string) {
    this.handlers.delete(action);
    this.validators.delete(action);
  }
}
