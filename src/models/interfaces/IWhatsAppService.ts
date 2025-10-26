import { WhatsAppConfig } from '../WhatsAppConfig';
import { BirthdayRecord } from '../BirthdayRecord';

/**
 * Interface for sending birthday messages via WhatsApp using Twilio API
 */
export interface IWhatsAppService {
  /**
   * Initializes the WhatsApp service with Twilio configuration
   * @param config - WhatsApp configuration including Twilio credentials
   */
  initialize(config: WhatsAppConfig): Promise<void>;
  
  /**
   * Sends a birthday message to a recipient via WhatsApp
   * @param recipient - Birthday record containing recipient details
   * @param message - Plain text message to send
   */
  sendBirthdayMessage(recipient: BirthdayRecord, message: string): Promise<void>;
  
  /**
   * Tests the connection to Twilio API and validates credentials
   * @returns Promise resolving to true if connection successful
   */
  testConnection(): Promise<boolean>;
}
