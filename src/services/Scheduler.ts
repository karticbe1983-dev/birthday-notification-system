import * as cron from 'node-cron';
import { Logger } from '../utils/Logger';

/**
 * Service for scheduling periodic birthday checks
 */
export class Scheduler {
  private task: cron.ScheduledTask | null = null;
  private logger: Logger;
  private readonly DEFAULT_CRON = '0 9 * * *'; // 9 AM daily

  constructor(logger: Logger) {
    this.logger = logger;
  }

  /**
   * Start the scheduler with the given cron expression
   * @param cronExpression - Cron expression for scheduling (e.g., "0 9 * * *")
   * @param callback - Function to execute on schedule trigger
   */
  public start(cronExpression: string, callback: () => Promise<void>): void {
    // Validate cron expression
    const validatedExpression = this.validateCronExpression(cronExpression);

    // Stop existing task if running
    if (this.task) {
      this.stop();
    }

    try {
      // Create and start the scheduled task
      this.task = cron.schedule(validatedExpression, async () => {
        this.logger.info('Scheduled birthday check triggered', {
          cronExpression: validatedExpression,
          timestamp: new Date().toISOString(),
        });

        try {
          await callback();
        } catch (error) {
          this.logger.error('Error during scheduled birthday check', error as Error, {
            cronExpression: validatedExpression,
          });
        }
      });

      this.logger.info('Scheduler started successfully', {
        cronExpression: validatedExpression,
        nextRun: this.getNextRunTime(validatedExpression),
      });
    } catch (error) {
      this.logger.error('Failed to start scheduler', error as Error, {
        cronExpression: validatedExpression,
      });
      throw error;
    }
  }

  /**
   * Stop the scheduler
   */
  public stop(): void {
    if (this.task) {
      this.task.stop();
      this.logger.info('Scheduler stopped');
      this.task = null;
    }
  }

  /**
   * Validate cron expression format
   * @param cronExpression - Cron expression to validate
   * @returns Valid cron expression (original or default)
   */
  private validateCronExpression(cronExpression: string): string {
    if (!cronExpression || cronExpression.trim() === '') {
      this.logger.warn('Empty cron expression provided, using default', {
        default: this.DEFAULT_CRON,
      });
      return this.DEFAULT_CRON;
    }

    // Use node-cron's built-in validation
    if (!cron.validate(cronExpression)) {
      this.logger.warn('Invalid cron expression, falling back to default', {
        provided: cronExpression,
        default: this.DEFAULT_CRON,
      });
      return this.DEFAULT_CRON;
    }

    return cronExpression;
  }

  /**
   * Get a human-readable description of when the next run will occur
   * @param cronExpression - Cron expression
   * @returns Description of next run time
   */
  private getNextRunTime(cronExpression: string): string {
    // Simple description based on common patterns
    if (cronExpression === '0 9 * * *') {
      return 'Daily at 9:00 AM';
    }
    if (cronExpression.startsWith('0 ')) {
      const hour = cronExpression.split(' ')[1];
      return `Daily at ${hour}:00`;
    }
    return 'As per cron schedule';
  }

  /**
   * Check if scheduler is currently running
   * @returns True if scheduler is active
   */
  public isRunning(): boolean {
    return this.task !== null;
  }
}
