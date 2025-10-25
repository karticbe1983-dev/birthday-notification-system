import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TemplateEngine } from '../TemplateEngine';
import { ILogger } from '../../models/interfaces/ILogger';
import { EmailTemplate } from '../../models/EmailTemplate';
import * as fs from 'fs';
import * as path from 'path';

// Mock logger
const createMockLogger = (): ILogger => ({
  info: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
});

describe('TemplateEngine', () => {
  let templateEngine: TemplateEngine;
  let mockLogger: ILogger;

  beforeEach(() => {
    mockLogger = createMockLogger();
    templateEngine = new TemplateEngine(mockLogger);
  });

  describe('loadTemplate', () => {
    it('should return default template when no file path provided', () => {
      const template = templateEngine.loadTemplate();

      expect(template.subject).toBe('Happy Birthday {{name}}! 🎉');
      expect(template.body).toContain('Dear {{name}}');
      expect(template.body).toContain('Wishing you a very Happy Birthday!');
      expect(mockLogger.info).toHaveBeenCalledWith('Using default email template');
    });

    it('should return default template when file does not exist', () => {
      const template = templateEngine.loadTemplate('./nonexistent-template.txt');

      expect(template.subject).toBe('Happy Birthday {{name}}! 🎉');
      expect(template.body).toContain('Dear {{name}}');
      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining('Template file not found'),
        expect.objectContaining({ filePath: './nonexistent-template.txt' })
      );
    });

    it('should load custom template from file', () => {
      const testFilePath = path.join(__dirname, 'test-files', 'custom-template.txt');
      const customContent = `Subject: Custom Birthday Wishes for {{name}}

Hello {{name}},

Happy Birthday from our team!`;

      // Create test file
      fs.mkdirSync(path.dirname(testFilePath), { recursive: true });
      fs.writeFileSync(testFilePath, customContent);

      try {
        const template = templateEngine.loadTemplate(testFilePath);

        expect(template.subject).toBe('Custom Birthday Wishes for {{name}}');
        expect(template.body).toContain('Hello {{name}}');
        expect(template.body).toContain('Happy Birthday from our team!');
      } finally {
        // Cleanup
        if (fs.existsSync(testFilePath)) {
          fs.unlinkSync(testFilePath);
        }
      }
    });

    it('should load template with Body: prefix format', () => {
      const testFilePath = path.join(__dirname, 'test-files', 'body-prefix-template.txt');
      const customContent = `Subject: Birthday for {{name}}
Body: Hi {{name}}, have a great day!`;

      fs.mkdirSync(path.dirname(testFilePath), { recursive: true });
      fs.writeFileSync(testFilePath, customContent);

      try {
        const template = templateEngine.loadTemplate(testFilePath);

        expect(template.subject).toBe('Birthday for {{name}}');
        expect(template.body).toBe('Hi {{name}}, have a great day!');
      } finally {
        if (fs.existsSync(testFilePath)) {
          fs.unlinkSync(testFilePath);
        }
      }
    });

    it('should handle template with only body content', () => {
      const testFilePath = path.join(__dirname, 'test-files', 'body-only-template.txt');
      const customContent = `Hello {{name}},

This is a simple birthday message.`;

      fs.mkdirSync(path.dirname(testFilePath), { recursive: true });
      fs.writeFileSync(testFilePath, customContent);

      try {
        const template = templateEngine.loadTemplate(testFilePath);

        expect(template.subject).toBe('Happy Birthday {{name}}! 🎉'); // Default subject
        expect(template.body).toContain('Hello {{name}}');
        expect(template.body).toContain('This is a simple birthday message.');
      } finally {
        if (fs.existsSync(testFilePath)) {
          fs.unlinkSync(testFilePath);
        }
      }
    });
  });

  describe('renderEmail', () => {
    it('should replace {{name}} variable in subject and body', () => {
      const template: EmailTemplate = {
        subject: 'Happy Birthday {{name}}!',
        body: 'Dear {{name}},\n\nHave a great day!'
      };

      const rendered = templateEngine.renderEmail(template, { name: 'John Doe' });

      expect(rendered.subject).toBe('Happy Birthday John Doe!');
      expect(rendered.body).toBe('Dear John Doe,\n\nHave a great day!');
    });

    it('should replace multiple occurrences of {{name}}', () => {
      const template: EmailTemplate = {
        subject: '{{name}}, Happy Birthday!',
        body: 'Hi {{name}},\n\nBest wishes to {{name}} on this special day!'
      };

      const rendered = templateEngine.renderEmail(template, { name: 'Jane Smith' });

      expect(rendered.subject).toBe('Jane Smith, Happy Birthday!');
      expect(rendered.body).toBe('Hi Jane Smith,\n\nBest wishes to Jane Smith on this special day!');
    });

    it('should handle template without variables', () => {
      const template: EmailTemplate = {
        subject: 'Birthday Greetings',
        body: 'Have a wonderful birthday!'
      };

      const rendered = templateEngine.renderEmail(template, { name: 'Bob Johnson' });

      expect(rendered.subject).toBe('Birthday Greetings');
      expect(rendered.body).toBe('Have a wonderful birthday!');
    });

    it('should handle empty name gracefully', () => {
      const template: EmailTemplate = {
        subject: 'Happy Birthday {{name}}!',
        body: 'Dear {{name}}'
      };

      const rendered = templateEngine.renderEmail(template, { name: '' });

      expect(rendered.subject).toBe('Happy Birthday !');
      expect(rendered.body).toBe('Dear ');
    });
  });

  describe('template validation', () => {
    it('should validate template with correct syntax', () => {
      const testFilePath = path.join(__dirname, 'test-files', 'valid-template.txt');
      const validContent = `Subject: Hello {{name}}
Body: Welcome {{name}}!`;

      fs.mkdirSync(path.dirname(testFilePath), { recursive: true });
      fs.writeFileSync(testFilePath, validContent);

      try {
        const template = templateEngine.loadTemplate(testFilePath);
        expect(template).toBeDefined();
        expect(template.subject).toBe('Hello {{name}}');
        expect(template.body).toBe('Welcome {{name}}!');
      } finally {
        if (fs.existsSync(testFilePath)) {
          fs.unlinkSync(testFilePath);
        }
      }
    });

    it('should handle template with unmatched braces gracefully', () => {
      const testFilePath = path.join(__dirname, 'test-files', 'invalid-braces-template.txt');
      const invalidContent = `Subject: Hello {{name}
Body: Welcome {{name}}!`;

      fs.mkdirSync(path.dirname(testFilePath), { recursive: true });
      fs.writeFileSync(testFilePath, invalidContent);

      try {
        const template = templateEngine.loadTemplate(testFilePath);
        
        // Should fall back to default template
        expect(template.subject).toBe('Happy Birthday {{name}}! 🎉');
        expect(mockLogger.error).toHaveBeenCalledWith(
          expect.stringContaining('Failed to load template'),
          expect.any(Error),
          expect.objectContaining({ filePath: testFilePath })
        );
      } finally {
        if (fs.existsSync(testFilePath)) {
          fs.unlinkSync(testFilePath);
        }
      }
    });

    it('should warn about unsupported variables', () => {
      const testFilePath = path.join(__dirname, 'test-files', 'unsupported-var-template.txt');
      const content = `Subject: Hello {{name}} and {{friend}}
Body: Welcome!`;

      fs.mkdirSync(path.dirname(testFilePath), { recursive: true });
      fs.writeFileSync(testFilePath, content);

      try {
        const template = templateEngine.loadTemplate(testFilePath);
        
        // Template should still load successfully
        expect(template.subject).toBe('Hello {{name}} and {{friend}}');
        expect(template.body).toBe('Welcome!');
        
        // Should have warned about unsupported variable
        expect(mockLogger.warn).toHaveBeenCalled();
      } finally {
        if (fs.existsSync(testFilePath)) {
          fs.unlinkSync(testFilePath);
        }
      }
    });
  });
});
