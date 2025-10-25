import nodemailer, { Transporter } from 'nodemailer';
import { IEmailService } from '../models/interfaces/IEmailService';
import { EmailConfig } from '../models/EmailConfig';
import { BirthdayRecord } from '../models/BirthdayRecord';
import { EmailTemplate } from '../models/EmailTemplate';
import { ILogger } from '../models/interfaces/ILogger';

/**
 * Email service implementation using nodemailer with Gmail SMTP
 * Handles sending birthday emails with retry logic and error handling
 */
export class EmailService implements IEmailService {
  private transporter: Transporter | null = null;
  private config: EmailConfig | null = null;
  private logger: ILogger;
  private retryDelayMs: number;

  constructor(logger: ILogger, retryDelayMs: number = 5 * 60 * 1000) {
    this.logger = logger;
    this.retryDelayMs = retryDelayMs;
  }

  /**
   * Initializes the email service with Gmail SMTP configuration
   * @param config - Email configuration with credentials
   */
  async initialize(config: EmailConfig): Promise<void> {
    this.config = config;

    // Configure nodemailer with Gmail SMTP transport
    this.transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false, // Use TLS
      auth: {
        user: config.user,
        pass: config.password,
      },
    });

    this.logger.info('Email service initialized', {
      host: 'smtp.gmail.com',
      port: 587,
      user: config.user,
    });
  }

  /**
   * Tests the connection to Gmail SMTP server
   * @returns Promise resolving to true if connection successful
   */
  async testConnection(): Promise<boolean> {
    if (!this.transporter) {
      throw new Error('Email service not initialized. Call initialize() first.');
    }

    try {
      await this.transporter.verify();
      this.logger.info('SMTP connection test successful');
      return true;
    } catch (error) {
      this.logger.error('SMTP connection test failed', error as Error);
      return false;
    }
  }

  /**
   * Sends a birthday email to a recipient with retry logic
   * @param recipient - Birthday record containing recipient details
   * @param template - Email template with subject and body
   */
  async sendBirthdayEmail(recipient: BirthdayRecord, template: EmailTemplate): Promise<void> {
    if (!this.transporter || !this.config) {
      throw new Error('Email service not initialized. Call initialize() first.');
    }

    try {
      // Attempt to send email
      await this.sendEmail(recipient, template);
      
      this.logger.info('Birthday email sent successfully', {
        recipient: recipient.name,
        email: recipient.email,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      // Log the initial failure
      this.logger.error('Failed to send birthday email', error as Error, {
        recipient: recipient.name,
        email: recipient.email,
        attempt: 1,
      });

      // Retry logic: wait configured delay and try once more
      const delayMinutes = Math.round(this.retryDelayMs / 60000);
      this.logger.info(`Retrying email send in ${delayMinutes} minutes`, {
        recipient: recipient.name,
        email: recipient.email,
      });

      await this.delay(this.retryDelayMs);

      try {
        await this.sendEmail(recipient, template);
        
        this.logger.info('Birthday email sent successfully on retry', {
          recipient: recipient.name,
          email: recipient.email,
          timestamp: new Date().toISOString(),
          attempt: 2,
        });
      } catch (retryError) {
        // Log final failure after retry
        this.logger.error('Failed to send birthday email after retry', retryError as Error, {
          recipient: recipient.name,
          email: recipient.email,
          attempt: 2,
        });
        
        throw retryError;
      }
    }
  }

  /**
   * Internal method to send email via SMTP
   * @param recipient - Birthday record
   * @param template - Email template
   */
  private async sendEmail(recipient: BirthdayRecord, template: EmailTemplate): Promise<void> {
    if (!this.transporter || !this.config) {
      throw new Error('Email service not initialized');
    }

    const mailOptions = {
      from: this.config.from,
      to: recipient.email,
      subject: template.subject,
      text: template.body,
    };

    try {
      await this.transporter.sendMail(mailOptions);
    } catch (error) {
      // Handle specific SMTP errors
      const err = error as any;
      
      if (err.code === 'EAUTH') {
        throw new Error('SMTP authentication failed. Check credentials.');
      } else if (err.code === 'ETIMEDOUT' || err.code === 'ECONNECTION') {
        throw new Error('SMTP connection timeout or network error.');
      } else if (err.code === 'EENVELOPE') {
        throw new Error('Invalid email address format.');
      } else {
        throw error;
      }
    }
  }

  /**
   * Utility method to delay execution
   * @param ms - Milliseconds to delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
