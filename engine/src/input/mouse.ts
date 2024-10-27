import { Vec2 } from "../math/vec";

export enum MouseListenerType {
  DOWN,
  UP,
  CLICK,
  MOVE,
}

export enum MouseButton {
  LEFT = 0,
  MIDDLE = 1,
  RIGHT = 2,
}

export type MouseListener = (button: number, pos: Vec2, pressed: boolean) => void;

export abstract class Mouse {
  private static readonly buttons: Set<MouseButton> = new Set();
  private static readonly buttonListeners: Map<MouseButton, Map<MouseListenerType, Set<MouseListener>>> =
    new Map();
  private static enabled = false;
  private static pos: Vec2 = new Vec2();

  /**
   * Enables the mosue listeners.
   *
   * This will start listening for mouse events and trigger the appropriate listeners.
   */
  public static enable(): void {
    this.enabled = true;

    window.addEventListener("mousedown", this.mouseDownListener);
    window.addEventListener("mouseup", this.mouseUpListener);
    window.addEventListener("click", this.clickListener);
    window.addEventListener("mousemove", this.mouseMoveListener);
  }

  /**
   * Disables the mouse listeners.
   *
   * This will stop listening for mouse events and will not trigger any listeners.
   */
  public static disable(): void {
    this.enabled = false;

    window.removeEventListener("mousedown", this.mouseDownListener);
    window.removeEventListener("mouseup", this.mouseUpListener);
    window.removeEventListener("click", this.clickListener);
    window.removeEventListener("mousemove", this.mouseMoveListener);
  }

  /**
   * Gets if the mouse is enabled.
   *
   * @returns True if the mouse is enabled, otherwise false.
   */
  public static isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Gets the current mouse position.
   *
   * @returns The current mouse position.
   */
  public static getPos(): Vec2 {
    return this.pos;
  }

  /**
   * Checks if the button is currently down.
   *
   * @param button The button to check.
   *
   * @returns If the button is currently down.
   */
  public static isButtonDown(button: MouseButton): boolean {
    return this.buttons.has(button);
  }

  /**
   * Checks if the button is currently up.
   *
   * @param button The button to check.
   *
   * @returns If the button is currently up.
   */
  public static isButtonUp(button: MouseButton): boolean {
    return !this.buttons.has(button);
  }

  /**
   * Adds a listener for the given button.
   *
   * When the mouse is moved, the listeners for all buttons will be triggered. i.e. you can add the move listener to any button and it will be triggered when the mouse is moved.
   *
   * @param type The type of listener to add.
   * @param button The button to add a listener for.
   * @param listener The listener to add.
   */
  public static on(type: MouseListenerType, button: MouseButton, listener: MouseListener): void {
    if (!this.buttonListeners.has(button)) {
      this.buttonListeners.set(button, new Map());
    }

    if (!this.buttonListeners.get(button)!.has(type)) {
      this.buttonListeners.get(button)!.set(type, new Set());
    }

    this.buttonListeners.get(button)!.get(type)!.add(listener);
  }

  /**
   * Removes a listener for the given button.
   *
   * @param type The type of listener to remove.
   * @param button The button to remove a listener for.
   * @param listener The listener to remove.
   */
  public static off(type: MouseListenerType, button: MouseButton, listener: MouseListener): void {
    if (!this.buttonListeners.has(button) || !this.buttonListeners.get(button)!.has(type)) {
      return;
    }

    this.buttonListeners.get(button)!.get(type)!.delete(listener);
  }

  private static readonly mouseDownListener = (event: MouseEvent) => {
    if (!this.enabled) {
      return;
    }

    if (MouseButton[event.button] === undefined) {
      return;
    }

    this.buttons.add(event.button);

    this.fireMouseEvent(event.button, MouseListenerType.DOWN);
  };

  private static readonly mouseUpListener = (event: MouseEvent) => {
    if (!this.enabled) {
      return;
    }

    if (MouseButton[event.button] === undefined) {
      return;
    }

    this.buttons.delete(event.button);

    this.fireMouseEvent(event.button, MouseListenerType.UP);
  };

  private static readonly clickListener = (event: MouseEvent) => {
    if (!this.enabled) {
      return;
    }

    if (MouseButton[event.button] === undefined) {
      return;
    }

    this.fireMouseEvent(event.button, MouseListenerType.CLICK);
  };

  private static readonly mouseMoveListener = (event: MouseEvent) => {
    if (!this.enabled) {
      return;
    }

    Vec2.set(this.pos, event.clientX, event.clientY);

    this.fireMouseEvent(MouseButton.LEFT, MouseListenerType.MOVE);
    this.fireMouseEvent(MouseButton.MIDDLE, MouseListenerType.MOVE);
    this.fireMouseEvent(MouseButton.RIGHT, MouseListenerType.MOVE);
  };

  private static fireMouseEvent(button: MouseButton, type: MouseListenerType): void {
    if (!this.buttonListeners.has(button) || !this.buttonListeners.get(button)!.has(type)) {
      return;
    }

    for (const listener of this.buttonListeners.get(button)!.get(type)!) {
      listener(button, Vec2.copy(this.pos), this.buttons.has(button));
    }
  }
}
