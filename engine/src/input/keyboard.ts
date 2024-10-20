export enum KeyListenerType {
  DOWN_UP,
  DOWN,
  UP,
  PRESS,
}

export type KeyListener = (key: string, pressed: boolean) => void;

export abstract class Keyboard {
  private static readonly keys: Set<string> = new Set();
  private static readonly keyListeners: Map<string, Map<KeyListenerType, Set<KeyListener>>> = new Map();
  private static caseSensitive: boolean = false;
  private static enabled = false;

  /**
   * Enables the keyboard listeners.
   *
   * This will start listening for keyboard events and trigger the appropriate listeners.
   */
  public static enable(): void {
    this.enabled = true;

    window.addEventListener("keydown", this.keyDownListener);
    window.addEventListener("keyup", this.keyUpListener);
    window.addEventListener("keypress", this.keyPressListener);
  }

  /**
   * Disables the keyboard listeners.
   *
   * This will stop listening for keyboard events and will not trigger any listeners.
   */
  public static disable(): void {
    this.enabled = false;

    window.removeEventListener("keydown", this.keyDownListener);
    window.removeEventListener("keyup", this.keyUpListener);
    window.removeEventListener("keypress", this.keyPressListener);
  }

  /**
   * Gets if the keyboard is enabled.
   *
   * @returns True if the keyboard is enabled, otherwise false.
   */
  public static isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Gets wether the keyboard listeners are case sensitive.
   *
   * @returns True if the keyboard listeners are case sensitive, otherwise false.
   */
  public static isCaseSensitive(): boolean {
    return this.caseSensitive;
  }

  /**
   * Sets wether the keyboard listeners should be case sensitive.
   *
   * @param caseSensitive Wether the keyboard listeners should be case sensitive.
   */
  public static setCaseSensitive(caseSensitive: boolean): void {
    this.caseSensitive = caseSensitive;
  }

  /**
   * Checks if the key is currently down.
   *
   * @param key The key to check.
   *
   * @returns If the key is currently down.
   */
  public static isKeyDown(key: string): boolean {
    return this.keys.has(key);
  }

  /**
   * Checks if the key is currently up.
   *
   * @param key The key to check.
   *
   * @returns If the key is currently up.
   */
  public static isKeyUp(key: string): boolean {
    return !this.keys.has(key);
  }

  /**
   * Adds a listener for the given key.
   *
   * @param type The type of listener to add.
   * @param key The key to add a listener for.
   * @param listener The listener to add.
   */
  public static on(type: KeyListenerType, key: string, listener: KeyListener): void {
    if (!this.keyListeners.has(key)) {
      this.keyListeners.set(key, new Map());
    }

    if (!this.keyListeners.get(key)!.has(type)) {
      this.keyListeners.get(key)!.set(type, new Set());
    }

    this.keyListeners.get(key)!.get(type)!.add(listener);
  }

  /**
   * Removes a listener for the given key.
   *
   * @param type The type of listener to remove.
   * @param key The key to remove a listener for.
   * @param listener The listener to remove.
   */
  public static off(type: KeyListenerType, key: string, listener: KeyListener): void {
    if (!this.keyListeners.has(key) || !this.keyListeners.get(key)!.has(type)) {
      return;
    }

    this.keyListeners.get(key)!.get(type)!.delete(listener);
  }

  private static readonly keyDownListener = (event: KeyboardEvent) => {
    if (!this.enabled) {
      return;
    }

    const key = this.caseSensitive ? event.key : event.key.toLowerCase();
    if (this.keys.has(key)) {
      return;
    }

    this.keys.add(key);

    this.fireKeyEvent(key, KeyListenerType.DOWN);
    this.fireKeyEvent(key, KeyListenerType.DOWN_UP);
  };

  private static readonly keyUpListener = (event: KeyboardEvent) => {
    if (!this.enabled) {
      return;
    }

    const key = this.caseSensitive ? event.key : event.key.toLowerCase();
    if (!this.keys.has(key)) {
      return;
    }

    this.keys.delete(key);

    this.fireKeyEvent(key, KeyListenerType.UP);
    this.fireKeyEvent(key, KeyListenerType.DOWN_UP);
  };

  private static readonly keyPressListener = (event: KeyboardEvent) => {
    if (!this.enabled) {
      return;
    }

    const key = this.caseSensitive ? event.key : event.key.toLowerCase();
    this.fireKeyEvent(key, KeyListenerType.PRESS);
  };

  private static fireKeyEvent(key: string, type: KeyListenerType): void {
    if (!this.keyListeners.has(key) || !this.keyListeners.get(key)!.has(type)) {
      return;
    }

    for (const listener of this.keyListeners.get(key)!.get(type)!) {
      listener(key, this.keys.has(key));
    }
  }
}
