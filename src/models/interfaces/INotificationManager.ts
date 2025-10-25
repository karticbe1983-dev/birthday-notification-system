/**
 * Interface for orchestrating birthday checking and notification process
 */
export interface INotificationManager {
  /**
   * Checks for today's birthdays and sends notification emails
   */
  checkAndNotify(): Promise<void>;
}
