/**
 * Email template with subject and body
 */
export interface EmailTemplate {
  /** Email subject line with optional {{name}} placeholder */
  subject: string;
  
  /** Email body content with optional {{name}} placeholder */
  body: string;
}
