import { EmailTemplate } from '../EmailTemplate';

/**
 * Interface for loading and rendering email and WhatsApp templates
 */
export interface ITemplateEngine {
  /**
   * Loads email template from file or returns default template
   * @param filePath - Optional path to custom template file
   * @returns Email template with subject and body
   */
  loadTemplate(filePath?: string): EmailTemplate;
  
  /**
   * Renders email template by replacing variables with actual values
   * @param template - Email template with placeholders
   * @param data - Data object containing values for placeholders
   * @returns Rendered email with subject and body
   */
  renderEmail(template: EmailTemplate, data: { name: string }): { subject: string; body: string };
  
  /**
   * Loads WhatsApp template from file or returns default template
   * Falls back to email template body if WhatsApp template not found
   * @param filePath - Optional path to custom WhatsApp template file
   * @returns WhatsApp template as plain text string
   */
  loadWhatsAppTemplate(filePath?: string): string;
  
  /**
   * Renders WhatsApp template by replacing variables with actual values
   * @param template - WhatsApp template string with placeholders
   * @param data - Data object containing values for placeholders
   * @returns Rendered WhatsApp message as plain text (truncated to 1600 chars if needed)
   */
  renderWhatsApp(template: string, data: { name: string }): string;
}
