import * as dotenv from 'dotenv';
import { AppConfig } from '../models/AppConfig';

/**
 * Service for loading and validating application configuration
 */
export class ConfigService {
  private config: AppConfig | null = null;

  /**
   * Load configuration from environment variables
   */
  public loadConfig(): void {
    // Load .env file
    dotenv.config();

    // Validate required environment variables
    this.validateRequiredVariables();

    // Build configuration object with defaults
    this.config = {
      excel: {
        filePath: this.getRequiredEnvVar('EXCEL_FILE_PATH'),
      },
      email: {
        user: this.getRequiredEnvVar('GMAIL_USER'),
        password: this.getRequiredEnvVar('GMAIL_PASSWORD'),
        from: process.env.GMAIL_FROM || this.getRequiredEnvVar('GMAIL_USER'),
      },
      scheduler: {
        cronExpression: process.env.CRON_SCHEDULE || '0 9 * * *',
      },
      template: {
        filePath: process.env.TEMPLATE_FILE_PATH,
      },
      logging: {
        level: process.env.LOG_LEVEL || 'info',
        directory: process.env.LOG_DIRECTORY || './logs',
      },
    };
  }

  /**
   * Get the loaded configuration
   * @returns AppConfig object
   * @throws Error if configuration has not been loaded
   */
  public getConfig(): AppConfig {
    if (!this.config) {
      throw new Error('Configuration has not been loaded. Call loadConfig() first.');
    }
    return this.config;
  }

  /**
   * Validate that all required environment variables are present
   * @throws Error if any required variable is missing
   */
  private validateRequiredVariables(): void {
    const requiredVars = ['EXCEL_FILE_PATH', 'GMAIL_USER', 'GMAIL_PASSWORD'];
    const missingVars: string[] = [];

    for (const varName of requiredVars) {
      if (!process.env[varName]) {
        missingVars.push(varName);
      }
    }

    if (missingVars.length > 0) {
      throw new Error(
        `Missing required environment variables: ${missingVars.join(', ')}. ` +
        'Please ensure these are set in your .env file or environment.'
      );
    }
  }

  /**
   * Get a required environment variable
   * @param name - Name of the environment variable
   * @returns Value of the environment variable
   * @throws Error if the variable is not set
   */
  private getRequiredEnvVar(name: string): string {
    const value = process.env[name];
    if (!value) {
      throw new Error(`Required environment variable ${name} is not set.`);
    }
    return value;
  }
}
