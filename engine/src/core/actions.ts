import Engine from "../engine";

export type ActionType = any;

export type ActionHandler<A, T> = (engine: Engine, action: A, data: T, dt: number) => void;

export type ActionDataValidator<A> = (action: A, data: any) => boolean;

export interface Action<A> {
  action: A;
  data: any;
}

export class ActionsManager<T> {
  private readonly handlers: Map<T, ActionHandler<T, any>> = new Map();
  private readonly validators: Map<T, ActionDataValidator<T>> = new Map();
  private readonly actionQueue: Action<T>[] = [];

  /**
   * Enqueues an action to be fired on the next flush.
   *
   * @param action The action to enqueue.
   * @param data The data for the action.
   * @param delay The delay in milliseconds before enqueueing the action, this is useful to simulate sending the action to the server on the client.
   */
  public enqueue(action: T, data: any, delay?: number) {
    if (delay) {
      setTimeout(() => {
        this.actionQueue.push({ action, data });
      }, delay);
    } else {
      this.actionQueue.push({ action, data });
    }
  }

  /**
   * Flushes the action queue, firing all enqueued actions.
   *
   * @note Only use this if you know what you're doing.
   *
   * @param engine The engine to flushing the queue.
   * @param dt The delta time for the update calling the flush.
   */
  public flush(engine: Engine, dt: number) {
    for (const action of this.actionQueue) {
      this.fire(engine, action.action, action.data, dt);
    }

    this.actionQueue.length = 0;
  }

  /**
   * Fires an action immediately with the given data, without queueing the action.
   *
   * @note Use this with caution, as it will bypass the queue and fire the action immediately.
   *
   * @param engine The engine firing the action.
   * @param action The action to fire.
   * @param data The action's data.
   * @param dt The delta time for the action.
   */
  public fire(engine: Engine, action: T, data: any, dt: number) {
    const handler = this.handlers.get(action);
    if (!handler) {
      return;
    }

    const validator = this.validators.get(action);
    if (!validator || !validator(action, data)) {
      return;
    }

    handler(engine, action, data, dt);
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
  public register<D>(action: T, handler: ActionHandler<T, D>, validator: ActionDataValidator<T>) {
    this.handlers.set(action, handler);
    this.validators.set(action, validator);
  }

  /**
   * Unregisters the handler for an action.
   *
   * @param action The action to unregister the handler for.
   */
  public unregister(action: T) {
    this.handlers.delete(action);
    this.validators.delete(action);
  }
}
