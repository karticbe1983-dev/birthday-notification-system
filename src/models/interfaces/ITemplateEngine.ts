import { EmailTemplate } from '../EmailTemplate';

/**
 * Interface for loading and rendering email templates
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
}
