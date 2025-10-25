import { EmailConfig } from '../EmailConfig';
import { BirthdayRecord } from '../BirthdayRecord';
import { EmailTemplate } from '../EmailTemplate';

/**
 * Interface for sending birthday emails via Gmail
 */
export interface IEmailService {
  /**
   * Initializes the email service with configuration
   * @param config - Email configuration including credentials
   */
  initialize(config: EmailConfig): Promise<void>;
  
  /**
   * Sends a birthday email to a recipient
   * @param recipient - Birthday record containing recipient details
   * @param template - Email template with subject and body
   */
  sendBirthdayEmail(recipient: BirthdayRecord, template: EmailTemplate): Promise<void>;
  
  /**
   * Tests the connection to Gmail SMTP server
   * @returns Promise resolving to true if connection successful
   */
  testConnection(): Promise<boolean>;
}
