import { Renderer } from "../rendering/renderer";
import { Vec2 } from "../math/vec";
import { Logger } from "@shared/src/Logger";

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

export type MouseListener = (button: number, pos: Vec2, pressed: boolean, worldPos: Vec2) => void;

export abstract class Mouse {
  private static readonly buttons: Set<MouseButton> = new Set();
  private static readonly buttonsPressThisUpdate: Set<MouseButton> = new Set();
  private static readonly buttonsListeners: Map<MouseButton, Map<MouseListenerType, Set<MouseListener>>> =
    new Map();
  private static enabled = false;
  private static pos: Vec2 = new Vec2();

  private static renderer: Renderer | null = null;

  public static enableDebugLogging = false;
  public static enableMouseMoveDebugLogging = false;

  /**
   * Enables the mouse listeners.
   *
   * This will start listening for mouse events and trigger the appropriate listeners.
   *
   * @param renderer The renderer to use for the mouse events. Must be initialized before enabling the mouse.
   */
  public static enable(renderer: Renderer): void {
    if (!renderer.isInitialized()) {
      Logger.errorAndThrow("MOUSE", "Make sure the renderer is initialized before enabling the mouse.");
    }

    this.enabled = true;
    this.renderer = renderer;

    if (this.enableDebugLogging) {
      Logger.log("MOUSE", "Enabled mouse listeners.");
    }

    window.addEventListener("mousedown", this.mouseDownListener, { capture: true });
    window.addEventListener("mouseup", this.mouseUpListener, { capture: true });
    window.addEventListener("click", this.clickListener, { capture: true });
    window.addEventListener("mousemove", this.mouseMoveListener, { capture: true });
  }

  /**
   * Disables the mouse listeners.
   *
   * This will stop listening for mouse events and will not trigger any listeners.
   */
  public static disable(): void {
    this.enabled = false;
    this.renderer = null;

    if (this.enableDebugLogging) {
      Logger.log("MOUSE", "Disabled mouse listeners.");
    }

    window.removeEventListener("mousedown", this.mouseDownListener, { capture: true });
    window.removeEventListener("mouseup", this.mouseUpListener, { capture: true });
    window.removeEventListener("click", this.clickListener, { capture: true });
    window.removeEventListener("mousemove", this.mouseMoveListener, { capture: true });
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
   * Gets the current mouse position in world coordinates.
   *
   * @returns The current mouse position in world coordinates.
   */
  public static getWorldPos(): Vec2 {
    if (!this.renderer) {
      Logger.errorAndThrow(
        "MOUSE",
        "Renderer is not set, make sure to call Mouse.enable() with a renderer before using `getWorldPos`.",
      );
      throw new Error(); // unreachable
    }

    return this.renderer?.convertPixelPosToWorldPos(this.pos);
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
    if (!this.buttonsListeners.has(button)) {
      this.buttonsListeners.set(button, new Map());
    }

    if (!this.buttonsListeners.get(button)!.has(type)) {
      this.buttonsListeners.get(button)!.set(type, new Set());
    }

    this.buttonsListeners.get(button)!.get(type)!.add(listener);
  }

  /**
   * Removes a listener for the given button.
   *
   * @param type The type of listener to remove.
   * @param button The button to remove a listener for.
   * @param listener The listener to remove.
   */
  public static off(type: MouseListenerType, button: MouseButton, listener: MouseListener): void {
    if (!this.buttonsListeners.has(button) || !this.buttonsListeners.get(button)!.has(type)) {
      return;
    }

    this.buttonsListeners.get(button)!.get(type)!.delete(listener);
  }

  /**
   * Clears all button presses that have been pressed this update.
   *
   * This should be called at the end of each update loop.
   */
  public static clearButtonPressesThisUpdate(): void {
    this.buttonsPressThisUpdate.clear();
  }

  /**
   * Checks if the button was pressed this update.
   *
   * @param button The button to check.
   *
   * @returns If the button was pressed this update.
   */
  public static isButtonPressedThisUpdate(button: MouseButton): boolean {
    return this.buttonsPressThisUpdate.has(button);
  }

  /**
   * Gets the direction from the origin to the mouse position.
   *
   * @param origin The origin to calculate the direction from. Default is the center of the window.
   * @param flipYAxis Wether or not to flip the y axis of the returned vector
   *
   * @returns The direction from the origin to the mouse position.
   */
  public static getDirection(
    origin: Vec2 = new Vec2(window.innerWidth / 2, window.innerHeight / 2),
    flipYAxis = true,
  ): Vec2 {
    const toMouse = Vec2.sub(this.pos, origin);
    if (toMouse.x === 0 && toMouse.y === 0) {
      return toMouse;
    }

    const normalised = Vec2.normalize(toMouse);
    if (flipYAxis) {
      normalised.y *= -1;
    }

    return normalised;
  }

  private static readonly mouseDownListener = (event: MouseEvent) => {
    if (!this.enabled) {
      return;
    }

    if (MouseButton[event.button] === undefined) {
      return;
    }

    if (this.enableDebugLogging) {
      Logger.log("MOUSE", `Mouse down listener fired for button '${MouseButton[event.button]}'.`);
    }

    this.buttons.add(event.button);
    this.buttonsPressThisUpdate.add(event.button);

    this.fireMouseEvent(event.button, MouseListenerType.DOWN);
  };

  private static readonly mouseUpListener = (event: MouseEvent) => {
    if (!this.enabled) {
      return;
    }

    if (MouseButton[event.button] === undefined) {
      return;
    }

    if (this.enableDebugLogging) {
      Logger.log("MOUSE", `Mouse up listener fired for button '${MouseButton[event.button]}'.`);
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

    if (this.enableDebugLogging) {
      Logger.log("MOUSE", `Mouse click listener fired for button '${MouseButton[event.button]}'.`);
    }

    this.fireMouseEvent(event.button, MouseListenerType.CLICK);
  };

  private static readonly mouseMoveListener = (event: MouseEvent) => {
    if (!this.enabled) {
      return;
    }

    if (!this.renderer) {
      Logger.errorAndThrow(
        "MOUSE",
        "Mouse renderer is not set inside mouseMoveListener, something has gone terribly wrong. Make sure you are calling Mouse.enable() passing an initialized renderer.",
      );
      throw new Error(); // unreachable
    }

    Vec2.set(this.pos, event.clientX, event.clientY);

    if (this.enableMouseMoveDebugLogging) {
      Logger.log("MOUSE", `Mouse move listener fired with position (${this.pos.x}, ${this.pos.y}).`);
    }

    this.fireMouseEvent(MouseButton.LEFT, MouseListenerType.MOVE);
    this.fireMouseEvent(MouseButton.MIDDLE, MouseListenerType.MOVE);
    this.fireMouseEvent(MouseButton.RIGHT, MouseListenerType.MOVE);
  };

  private static fireMouseEvent(button: MouseButton, type: MouseListenerType): void {
    if (!this.buttonsListeners.has(button) || !this.buttonsListeners.get(button)!.has(type)) {
      return;
    }

    for (const listener of this.buttonsListeners.get(button)!.get(type)!) {
      listener(button, Vec2.copy(this.pos), this.buttons.has(button), this.getWorldPos());
    }
  }
}
