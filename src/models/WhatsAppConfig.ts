/**
 * WhatsApp service configuration using Twilio API
 */
export interface WhatsAppConfig {
  /** Twilio Account SID */
  accountSid: string;
  
  /** Twilio Auth Token */
  authToken: string;
  
  /** Twilio WhatsApp-enabled phone number (e.g., whatsapp:+14155238886) */
  fromNumber: string;
  
  /** Whether WhatsApp notifications are enabled */
  enabled: boolean;
}
