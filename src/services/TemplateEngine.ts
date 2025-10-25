import * as fs from 'fs';
import { ITemplateEngine } from '../models/interfaces/ITemplateEngine';
import { EmailTemplate } from '../models/EmailTemplate';
import { ILogger } from '../models/interfaces/ILogger';

/**
 * Service for loading and rendering email templates
 */
export class TemplateEngine implements ITemplateEngine {
  private logger: ILogger;
  private defaultTemplate: EmailTemplate = {
    subject: 'Happy Birthday {{name}}! 🎉',
    body: `Dear {{name}},

Wishing you a very Happy Birthday! 🎂

May your day be filled with joy, laughter, and wonderful memories.

Best wishes,
Birthday Notification System`
  };

  constructor(logger: ILogger) {
    this.logger = logger;
  }

  /**
   * Loads email template from file or returns default template
   * @param filePath - Optional path to custom template file
   * @returns Email template with subject and body
   */
  public loadTemplate(filePath?: string): EmailTemplate {
    // If no file path provided, return default template
    if (!filePath) {
      this.logger.info('Using default email template');
      return { ...this.defaultTemplate };
    }

    try {
      // Check if file exists
      if (!fs.existsSync(filePath)) {
        this.logger.warn(`Template file not found: ${filePath}, using default template`, { filePath });
        return { ...this.defaultTemplate };
      }

      // Read template file
      const content = fs.readFileSync(filePath, 'utf-8');
      
      // Parse template content
      const template = this.parseTemplateContent(content);
      
      // Validate template syntax
      this.validateTemplate(template);
      
      this.logger.info('Successfully loaded custom email template', { filePath });
      return template;
    } catch (error) {
      this.logger.error(
        `Failed to load template from ${filePath}, using default template`,
        error instanceof Error ? error : new Error(String(error)),
        { filePath }
      );
      return { ...this.defaultTemplate };
    }
  }

  /**
   * Renders email template by replacing variables with actual values
   * @param template - Email template with placeholders
   * @param data - Data object containing values for placeholders
   * @returns Rendered email with subject and body
   */
  public renderEmail(template: EmailTemplate, data: { name: string }): { subject: string; body: string } {
    const subject = this.replaceVariables(template.subject, data);
    const body = this.replaceVariables(template.body, data);
    
    return { subject, body };
  }

  /**
   * Parses template file content into EmailTemplate object
   * Expected format:
   * Subject: <subject line>
   * Body: <body content>
   * or
   * Subject: <subject line>
   * 
   * <body content>
   * @param content - Raw template file content
   * @returns Parsed EmailTemplate
   */
  private parseTemplateContent(content: string): EmailTemplate {
    const lines = content.split('\n');
    let subject = '';
    let body = '';
    let inBody = false;
    let bodyStartIndex = -1;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Check for Subject line
      if (line.trim().toLowerCase().startsWith('subject:')) {
        subject = line.substring(line.indexOf(':') + 1).trim();
      }
      // Check for Body line
      else if (line.trim().toLowerCase().startsWith('body:')) {
        const bodyContent = line.substring(line.indexOf(':') + 1).trim();
        if (bodyContent) {
          body = bodyContent;
        }
        inBody = true;
        bodyStartIndex = i;
      }
      // If we've found subject and hit an empty line, rest is body
      else if (subject && !inBody && line.trim() === '') {
        inBody = true;
        bodyStartIndex = i;
      }
      // Accumulate body content
      else if (inBody && i > bodyStartIndex) {
        body += (body ? '\n' : '') + line;
      }
    }

    // If no explicit markers found, treat entire content as body
    if (!subject && !body) {
      body = content;
    }

    return {
      subject: subject || this.defaultTemplate.subject,
      body: body || this.defaultTemplate.body
    };
  }

  /**
   * Validates template syntax
   * Checks for proper {{variable}} syntax
   * @param template - Template to validate
   * @throws Error if template syntax is invalid
   */
  private validateTemplate(template: EmailTemplate): void {
    const validateText = (text: string, fieldName: string): void => {
      // Check for unmatched braces
      const openBraces = (text.match(/\{\{/g) || []).length;
      const closeBraces = (text.match(/\}\}/g) || []).length;
      
      if (openBraces !== closeBraces) {
        throw new Error(`Template ${fieldName} has unmatched braces: ${openBraces} opening, ${closeBraces} closing`);
      }

      // Check for malformed variables (single braces) - but be careful with regex lookbehind/lookahead
      // Count all single { and } that are not part of {{  or }}
      const allOpenBraces = (text.match(/\{/g) || []).length;
      const allCloseBraces = (text.match(/\}/g) || []).length;
      const doubleOpenBraces = openBraces * 2;
      const doubleCloseBraces = closeBraces * 2;
      
      if (allOpenBraces !== doubleOpenBraces || allCloseBraces !== doubleCloseBraces) {
        throw new Error(`Template ${fieldName} has malformed variable syntax. Use {{variable}} format`);
      }

      // Extract all variables and warn about unsupported ones
      const variables = text.match(/\{\{([^}]+)\}\}/g);
      if (variables) {
        for (const variable of variables) {
          const varName = variable.slice(2, -2).trim();
          if (!varName) {
            throw new Error(`Template ${fieldName} has empty variable: ${variable}`);
          }
          // Only 'name' is supported currently - warn but don't fail
          if (varName !== 'name') {
            this.logger.warn(`Template ${fieldName} contains unsupported variable: ${varName}. Only {{name}} is supported.`);
          }
        }
      }
    };

    validateText(template.subject, 'subject');
    validateText(template.body, 'body');
  }

  /**
   * Replaces template variables with actual values
   * @param text - Text containing {{variable}} placeholders
   * @param data - Data object with variable values
   * @returns Text with variables replaced
   */
  private replaceVariables(text: string, data: { name: string }): string {
    return text.replace(/\{\{name\}\}/g, data.name);
  }
}
