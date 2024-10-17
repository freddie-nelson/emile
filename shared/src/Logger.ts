export abstract class Logger {
  private static logFunction: (message: string) => void = console.log;
  private static errorFunction: (message: string) => void = console.error;
  private static warnFunction: (message: string) => void = console.warn;
  private static includeTimestamp = true;

  /**
   * Logs a message.
   *
   * @param module The module where the log is coming from
   * @param message The message to log
   */
  public static log(module: string, message: string) {
    this.logFunction(this.formatMessage(module, message));
  }

  /**
   * Logs a message as a warning.
   *
   * @param module The module where the log is coming from
   * @param message The message to log
   */
  public static warn(module: string, message: string) {
    this.warnFunction(this.formatMessage(module, message));
  }

  /**
   * Logs a message as an error.
   *
   * @param module The module where the log is coming from
   * @param message The message to log
   * @param error The error to log
   */
  public static error(module: string, message: string, error?: any) {
    this.errorFunction(this.formatMessage(module, message));

    if (error) {
      this.errorFunction(error);
    }
  }

  /**
   * Logs a message as an error and throws the error or message if no error is provided.
   *
   * @param module The module where the log is coming from
   * @param message The message to log
   * @param error The error to throw
   */
  public static errorAndThrow(module: string, message: string, error?: any) {
    this.error(module, message, error);
    throw new Error(error ?? message);
  }

  /**
   * Sets the function to use for logging.
   *
   * @param log The function to use for logging
   */
  public static setLogFunction(log: (message: string) => void) {
    this.logFunction = log;
  }

  /**
   * Sets the function to use for warnings.
   *
   * @param warn The function to use for warnings
   */
  public static setWarnFunction(warn: (message: string) => void) {
    this.warnFunction = warn;
  }

  /**
   * Sets the function to use for errors.
   *
   * @param error The function to use for errors
   */
  public static setErrorFunction(error: (message: string) => void) {
    this.errorFunction = error;
  }

  /**
   * Sets whether to include a timestamp in the log messages.
   *
   * @param includeTimestamp Whether to include a timestamp in the log messages
   */
  public static setIncludeTimestamp(includeTimestamp: boolean) {
    this.includeTimestamp = includeTimestamp;
  }

  private static formatMessage(module: string, message: string) {
    if (!this.includeTimestamp) {
      return `[${module}]: ${message}`;
    }

    return `[${new Date().toISOString()}] [${module}]: ${message}`;
  }
}
