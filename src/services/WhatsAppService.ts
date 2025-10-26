import { Twilio } from 'twilio';
import { IWhatsAppService } from '../models/interfaces/IWhatsAppService';
import { WhatsAppConfig } from '../models/WhatsAppConfig';
import { BirthdayRecord } from '../models/BirthdayRecord';
import { ILogger } from '../models/interfaces/ILogger';

/**
 * WhatsApp service implementation using Twilio API
 * Handles sending birthday messages via WhatsApp with retry logic and error handling
 */
export class WhatsAppService implements IWhatsAppService {
  private twilioClient: Twilio | null = null;
  private config: WhatsAppConfig | null = null;
  private logger: ILogger;
  private readonly maxRetries: number = 3;

  constructor(logger: ILogger) {
    this.logger = logger;
  }

  /**
   * Initializes the WhatsApp service with Twilio configuration
   * @param config - WhatsApp configuration with Twilio credentials
   */
  async initialize(config: WhatsAppConfig): Promise<void> {
    this.config = config;

    // Initialize Twilio client with credentials
    this.twilioClient = new Twilio(config.accountSid, config.authToken);

    this.logger.info('WhatsApp service initialized', {
      accountSid: this.maskCredential(config.accountSid),
      fromNumber: config.fromNumber,
    });
  }

  /**
   * Tests the connection to Twilio API and validates credentials
   * @returns Promise resolving to true if connection successful
   */
  async testConnection(): Promise<boolean> {
    if (!this.twilioClient || !this.config) {
      throw new Error('WhatsApp service not initialized. Call initialize() first.');
    }

    try {
      // Validate credentials by fetching account information
      const account = await this.twilioClient.api.accounts(this.config.accountSid).fetch();
      
      this.logger.info('Twilio connection test successful', {
        accountSid: this.maskCredential(account.sid),
        status: account.status,
      });
      
      return true;
    } catch (error) {
      this.logger.error('Twilio connection test failed', error as Error);
      return false;
    }
  }

  /**
   * Sends a birthday message to a recipient via WhatsApp with retry logic
   * @param recipient - Birthday record containing recipient details
   * @param message - Plain text message to send
   */
  async sendBirthdayMessage(recipient: BirthdayRecord, message: string): Promise<void> {
    if (!this.twilioClient || !this.config) {
      throw new Error('WhatsApp service not initialized. Call initialize() first.');
    }

    if (!recipient.phone) {
      throw new Error('Recipient phone number is required for WhatsApp notifications');
    }

    let lastError: Error | null = null;

    // Retry logic: 3 attempts with exponential backoff
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        await this.sendMessage(recipient.phone, message);
        
        this.logger.info('WhatsApp message sent successfully', {
          recipient: recipient.name,
          phone: this.maskPhoneNumber(recipient.phone),
          attempt,
          timestamp: new Date().toISOString(),
        });
        
        return; // Success, exit function
      } catch (error) {
        lastError = error as Error;
        
        this.logger.warn('WhatsApp send attempt failed', {
          recipient: recipient.name,
          phone: this.maskPhoneNumber(recipient.phone),
          attempt,
          error: lastError.message,
          errorCode: this.extractTwilioErrorCode(lastError),
        });

        // If not the last attempt, wait before retrying (exponential backoff)
        if (attempt < this.maxRetries) {
          const delayMs = Math.pow(2, attempt - 1) * 1000; // 1s, 2s, 4s
          this.logger.info(`Retrying WhatsApp send in ${delayMs}ms`, {
            recipient: recipient.name,
            attempt: attempt + 1,
          });
          await this.delay(delayMs);
        }
      }
    }

    // All retries failed
    this.logger.error('Failed to send WhatsApp message after all retries', lastError!, {
      recipient: recipient.name,
      phone: this.maskPhoneNumber(recipient.phone),
      totalAttempts: this.maxRetries,
    });

    throw lastError;
  }

  /**
   * Internal method to send WhatsApp message via Twilio API
   * @param toPhone - Recipient phone number in E.164 format
   * @param body - Message body (plain text)
   */
  private async sendMessage(toPhone: string, body: string): Promise<void> {
    if (!this.twilioClient || !this.config) {
      throw new Error('WhatsApp service not initialized');
    }

    // Truncate message to Twilio's 1600 character limit
    const truncatedBody = body.length > 1600 ? body.substring(0, 1600) : body;

    try {
      const message = await this.twilioClient.messages.create({
        from: this.config.fromNumber,
        to: `whatsapp:${toPhone}`,
        body: truncatedBody,
      });

      this.logger.info('Twilio API response', {
        messageSid: message.sid,
        status: message.status,
      });
    } catch (error) {
      // Handle Twilio-specific error codes
      const err = error as any;
      const errorCode = err.code || err.status;

      if (errorCode === 21211) {
        throw new Error(`Invalid 'To' phone number: ${toPhone}`);
      } else if (errorCode === 21408) {
        throw new Error('Permission denied: WhatsApp not enabled for this Twilio account');
      } else if (errorCode === 21610) {
        throw new Error(`Message undeliverable to ${toPhone}`);
      } else if (errorCode === 63007) {
        throw new Error(`Recipient ${toPhone} is not on WhatsApp`);
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

  /**
   * Masks sensitive credential for logging
   * @param credential - Credential to mask
   * @returns Masked credential showing only first and last 4 characters
   */
  private maskCredential(credential: string): string {
    if (credential.length <= 8) {
      return '****';
    }
    return `${credential.substring(0, 4)}...${credential.substring(credential.length - 4)}`;
  }

  /**
   * Masks phone number for logging (shows country code and last 4 digits)
   * @param phone - Phone number to mask
   * @returns Masked phone number
   */
  private maskPhoneNumber(phone: string): string {
    if (phone.length <= 6) {
      return '****';
    }
    // Show country code (first 2-3 chars) and last 4 digits
    const countryCode = phone.substring(0, 3);
    const lastFour = phone.substring(phone.length - 4);
    return `${countryCode}...${lastFour}`;
  }

  /**
   * Extracts Twilio error code from error object
   * @param error - Error object
   * @returns Error code or undefined
   */
  private extractTwilioErrorCode(error: Error): number | undefined {
    const err = error as any;
    return err.code || err.status;
  }
}
