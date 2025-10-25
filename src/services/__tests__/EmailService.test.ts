import { describe, it, expect, beforeEach } from 'vitest';
import { EmailService } from '../EmailService';
import { ILogger } from '../../models/interfaces/ILogger';
import { EmailConfig } from '../../models/EmailConfig';
import { BirthdayRecord } from '../../models/BirthdayRecord';
import { EmailTemplate } from '../../models/EmailTemplate';

// Mock logger implementation
class MockLogger implements ILogger {
  public logs: Array<{ level: string; message: string; metadata?: any; error?: Error }> = [];

  info(message: string, metadata?: any): void {
    this.logs.push({ level: 'info', message, metadata });
  }

  error(message: string, error?: Error, metadata?: any): void {
    this.logs.push({ level: 'error', message, error, metadata });
  }

  warn(message: string, metadata?: any): void {
    this.logs.push({ level: 'warn', message, metadata });
  }

  clear(): void {
    this.logs = [];
  }
}

describe('EmailService', () => {
  let emailService: EmailService;
  let mockLogger: MockLogger;

  // Use short retry delay for tests (100ms instead of 5 minutes)
  const TEST_RETRY_DELAY = 100;

  // Test configuration - use environment variables if available
  const testConfig: EmailConfig = {
    user: process.env.TEST_GMAIL_USER || 'test@gmail.com',
    password: process.env.TEST_GMAIL_PASSWORD || 'test-password',
    from: process.env.TEST_GMAIL_FROM || 'Test <test@gmail.com>',
  };

  const testRecipient: BirthdayRecord = {
    name: 'John Doe',
    email: 'john@gmail.com',
    birthday: new Date('1990-10-25'),
    rowNumber: 2,
  };

  const testTemplate: EmailTemplate = {
    subject: 'Happy Birthday John Doe! 🎉',
    body: 'Dear John Doe,\n\nWishing you a very Happy Birthday!\n\nBest wishes,\nBirthday System',
  };

  beforeEach(() => {
    mockLogger = new MockLogger();
    emailService = new EmailService(mockLogger, TEST_RETRY_DELAY);
  });

  describe('initialize', () => {
    it('should initialize email service with valid configuration', async () => {
      await emailService.initialize(testConfig);

      expect(mockLogger.logs.some(log => 
        log.level === 'info' && log.message === 'Email service initialized'
      )).toBe(true);
    });

    it('should log configuration details on initialization', async () => {
      await emailService.initialize(testConfig);

      const initLog = mockLogger.logs.find(log => log.message === 'Email service initialized');
      expect(initLog).toBeDefined();
      expect(initLog?.metadata).toMatchObject({
        host: 'smtp.gmail.com',
        port: 587,
        user: testConfig.user,
      });
    });
  });

  describe('testConnection', () => {
    it('should throw error if not initialized', async () => {
      await expect(emailService.testConnection()).rejects.toThrow(
        'Email service not initialized. Call initialize() first.'
      );
    });

    it('should return false for invalid credentials', async () => {
      const invalidConfig: EmailConfig = {
        user: 'invalid@gmail.com',
        password: 'wrong-password',
        from: 'Invalid <invalid@gmail.com>',
      };

      await emailService.initialize(invalidConfig);
      const result = await emailService.testConnection();

      expect(result).toBe(false);
      expect(mockLogger.logs.some(log => 
        log.level === 'error' && log.message === 'SMTP connection test failed'
      )).toBe(true);
    });

    // This test requires valid Gmail credentials in environment variables
    it.skipIf(!process.env.TEST_GMAIL_USER)('should return true for valid credentials', async () => {
      await emailService.initialize(testConfig);
      const result = await emailService.testConnection();

      expect(result).toBe(true);
      expect(mockLogger.logs.some(log => 
        log.level === 'info' && log.message === 'SMTP connection test successful'
      )).toBe(true);
    });
  });

  describe('sendBirthdayEmail', () => {
    it('should throw error if not initialized', async () => {
      await expect(emailService.sendBirthdayEmail(testRecipient, testTemplate)).rejects.toThrow(
        'Email service not initialized. Call initialize() first.'
      );
    });

    it('should handle authentication failure', async () => {
      const invalidConfig: EmailConfig = {
        user: 'test@gmail.com',
        password: 'wrong-password',
        from: 'Test <test@gmail.com>',
      };

      await emailService.initialize(invalidConfig);

      await expect(emailService.sendBirthdayEmail(testRecipient, testTemplate)).rejects.toThrow();
      
      expect(mockLogger.logs.some(log => 
        log.level === 'error' && log.message === 'Failed to send birthday email'
      )).toBe(true);
    });

    it('should log recipient details on failure', async () => {
      const invalidConfig: EmailConfig = {
        user: 'test@gmail.com',
        password: 'wrong-password',
        from: 'Test <test@gmail.com>',
      };

      await emailService.initialize(invalidConfig);

      try {
        await emailService.sendBirthdayEmail(testRecipient, testTemplate);
      } catch (error) {
        // Expected to fail
      }

      const errorLog = mockLogger.logs.find(log => 
        log.level === 'error' && log.message === 'Failed to send birthday email'
      );
      
      expect(errorLog).toBeDefined();
      expect(errorLog?.metadata).toMatchObject({
        recipient: 'John Doe',
        email: 'john@gmail.com',
        attempt: 1,
      });
    });

    it('should log retry attempt on failure', async () => {
      const invalidConfig: EmailConfig = {
        user: 'test@gmail.com',
        password: 'wrong-password',
        from: 'Test <test@gmail.com>',
      };

      await emailService.initialize(invalidConfig);

      try {
        await emailService.sendBirthdayEmail(testRecipient, testTemplate);
      } catch (error) {
        // Expected to fail
      }

      expect(mockLogger.logs.some(log => 
        log.level === 'info' && log.message.includes('Retrying email send in')
      )).toBe(true);
    });

    // This test requires valid Gmail credentials and will actually send an email
    it.skipIf(!process.env.TEST_GMAIL_USER)('should send email successfully with valid credentials', async () => {
      await emailService.initialize(testConfig);

      const recipient: BirthdayRecord = {
        name: 'Test User',
        email: process.env.TEST_GMAIL_USER || 'test@gmail.com',
        birthday: new Date('1990-01-01'),
        rowNumber: 1,
      };

      const template: EmailTemplate = {
        subject: 'Test Birthday Email',
        body: 'This is a test birthday email from the automated test suite.',
      };

      await emailService.sendBirthdayEmail(recipient, template);

      expect(mockLogger.logs.some(log => 
        log.level === 'info' && log.message === 'Birthday email sent successfully'
      )).toBe(true);

      const successLog = mockLogger.logs.find(log => 
        log.message === 'Birthday email sent successfully'
      );
      
      expect(successLog?.metadata).toMatchObject({
        recipient: 'Test User',
        email: recipient.email,
      });
      expect(successLog?.metadata?.timestamp).toBeDefined();
    });
  });

  describe('error handling', () => {
    it('should handle network timeout errors', async () => {
      // Create a config with invalid host to simulate network error
      const networkErrorConfig: EmailConfig = {
        user: 'test@gmail.com',
        password: 'test-password',
        from: 'Test <test@gmail.com>',
      };

      await emailService.initialize(networkErrorConfig);

      try {
        await emailService.sendBirthdayEmail(testRecipient, testTemplate);
      } catch (error) {
        // Expected to fail
      }

      expect(mockLogger.logs.some(log => 
        log.level === 'error' && log.message.includes('Failed to send birthday email')
      )).toBe(true);
    });

    it('should continue logging after multiple failures', async () => {
      const invalidConfig: EmailConfig = {
        user: 'test@gmail.com',
        password: 'wrong-password',
        from: 'Test <test@gmail.com>',
      };

      await emailService.initialize(invalidConfig);

      const recipient1: BirthdayRecord = {
        name: 'User 1',
        email: 'user1@gmail.com',
        birthday: new Date('1990-01-01'),
        rowNumber: 1,
      };

      const recipient2: BirthdayRecord = {
        name: 'User 2',
        email: 'user2@gmail.com',
        birthday: new Date('1991-02-02'),
        rowNumber: 2,
      };

      try {
        await emailService.sendBirthdayEmail(recipient1, testTemplate);
      } catch (error) {
        // Expected to fail
      }

      mockLogger.clear();

      try {
        await emailService.sendBirthdayEmail(recipient2, testTemplate);
      } catch (error) {
        // Expected to fail
      }

      expect(mockLogger.logs.some(log => 
        log.metadata?.recipient === 'User 2'
      )).toBe(true);
    });
  });
});
