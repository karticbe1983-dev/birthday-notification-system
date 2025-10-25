/**
 * Interface for logging system operations and errors
 */
export interface ILogger {
  /**
   * Logs an informational message
   * @param message - Log message
   * @param metadata - Optional additional data to log
   */
  info(message: string, metadata?: any): void;
  
  /**
   * Logs an error message
   * @param message - Error message
   * @param error - Optional error object
   * @param metadata - Optional additional data to log
   */
  error(message: string, error?: Error, metadata?: any): void;
  
  /**
   * Logs a warning message
   * @param message - Warning message
   * @param metadata - Optional additional data to log
   */
  warn(message: string, metadata?: any): void;
}
